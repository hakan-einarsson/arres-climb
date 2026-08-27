import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { Packer } from 'roadroller';

const DIST_DIR = path.resolve('dist');
const OUTPUT_ZIP = path.resolve('dist/index.zip');
const MAX_BYTES = 13312; // 13 KB limit for js13k

async function prepareDist() {
    const htmlPath = path.join(DIST_DIR, 'index.html');
    if (!fs.existsSync(htmlPath)) return;
    let html = fs.readFileSync(htmlPath, 'utf8');

    let jsCode = '';
    const assetsDir = path.join(DIST_DIR, 'assets');

    // Case 1: Separate JS in assets
    if (fs.existsSync(assetsDir)) {
        const jsFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.js'));
        if (jsFiles.length > 0) {
            const jsFile = jsFiles[0];
            jsCode = fs.readFileSync(path.join(assetsDir, jsFile), 'utf8');
            fs.unlinkSync(path.join(assetsDir, jsFile));
        }
    }

    // Case 2: Separate JS in root dist
    if (!jsCode && fs.existsSync(DIST_DIR)) {
        const jsFiles = fs.readdirSync(DIST_DIR).filter(f => f.endsWith('.js'));
        if (jsFiles.length > 0) {
            const jsFile = jsFiles[0];
            jsCode = fs.readFileSync(path.join(DIST_DIR, jsFile), 'utf8');
            fs.unlinkSync(path.join(DIST_DIR, jsFile));
        }
    }

    // Case 3: Inlined JS in html
    if (!jsCode) {
        const scriptMatch = html.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i);
        if (scriptMatch && scriptMatch[1].trim()) {
            jsCode = scriptMatch[1];
        }
    }

    if (jsCode) {
        // Replace import.meta.url and relative URLs with simple static string
        jsCode = jsCode.replace(/new URL\((['\"][^'\"]+['\"])\s*,\s*import\.meta\.url\)\.href/g, '$1');
        jsCode = jsCode.replace(/(["'])\.\.\/textures\.png\1/g, '$1textures.png$1');
        jsCode = jsCode.replace(/(["'])\/textures\.png\1/g, '$1textures.png$1');
        jsCode = jsCode.replace(/(["'])\.\/textures\.png\1/g, '$1textures.png$1');

        console.log(`Original JS size: ${jsCode.length} bytes`);
        console.log('Packing JS with Roadroller...');
        const packer = new Packer([{ data: jsCode, type: 'js', action: 'eval' }], {});
        await packer.optimize();
        const { firstLine, secondLine } = packer.makeDecoder();
        const packedJs = firstLine + '\n' + secondLine;
        console.log(`Packed JS size: ${packedJs.length} bytes`);

        // Remove any existing script tags and place packed script at end of body so DOM is fully parsed
        html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
        html = html.replace('</body>', `<script>${packedJs}</script></body>`);
        fs.writeFileSync(htmlPath, html);
    }

    // Clean up empty assets directory if any
    if (fs.existsSync(assetsDir) && fs.readdirSync(assetsDir).length === 0) {
        fs.rmdirSync(assetsDir);
    }
}

function getFiles(dir, base = '') {
    let files = [];
    if (!fs.existsSync(dir)) return files;
    for (const item of fs.readdirSync(dir)) {
        if (item.startsWith('.') || item.endsWith('.zip')) continue;
        const fullPath = path.join(dir, item);
        const relPath = base ? `${base}/${item}` : item;
        if (fs.statSync(fullPath).isDirectory()) {
            files = files.concat(getFiles(fullPath, relPath));
        } else {
            files.push({ fullPath, relPath });
        }
    }
    return files;
}

function createZip(files, outputPath) {
    if (files.length === 0) {
        console.error('No files found in dist to zip.');
        return;
    }

    const crcTable = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let k = 0; k < 8; k++) {
            c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        crcTable[i] = c >>> 0;
    }

    function crc32(buf) {
        let crc = 0xFFFFFFFF;
        for (let i = 0; i < buf.length; i++) {
            crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
        }
        return (crc ^ 0xFFFFFFFF) >>> 0;
    }

    const buffers = [];
    const centralHeaders = [];
    let offset = 0;

    for (const file of files) {
        const data = fs.readFileSync(file.fullPath);
        const uncompressedSize = data.length;
        const crc = crc32(data);
        const deflated = zlib.deflateRawSync(data, { level: 9 });
        const useCompressed = deflated.length < uncompressedSize;
        const compressedData = useCompressed ? deflated : data;
        const compMethod = useCompressed ? 8 : 0;
        const compressedSize = compressedData.length;

        const nameBuf = Buffer.from(file.relPath.replace(/\\/g, '/'), 'utf8');

        // Local file header (30 bytes + name)
        const localHeader = Buffer.alloc(30 + nameBuf.length);
        localHeader.writeUInt32LE(0x04034b50, 0);
        localHeader.writeUInt16LE(20, 4);
        localHeader.writeUInt16LE(0, 6);
        localHeader.writeUInt16LE(compMethod, 8);
        localHeader.writeUInt16LE(0, 10);
        localHeader.writeUInt16LE(0, 12);
        localHeader.writeUInt32LE(crc, 14);
        localHeader.writeUInt32LE(compressedSize, 18);
        localHeader.writeUInt32LE(uncompressedSize, 22);
        localHeader.writeUInt16LE(nameBuf.length, 26);
        localHeader.writeUInt16LE(0, 28);
        nameBuf.copy(localHeader, 30);

        buffers.push(localHeader, compressedData);

        // Central directory header (46 bytes + name)
        const centralHeader = Buffer.alloc(46 + nameBuf.length);
        centralHeader.writeUInt32LE(0x02014b50, 0);
        centralHeader.writeUInt16LE(20, 4);
        centralHeader.writeUInt16LE(20, 6);
        centralHeader.writeUInt16LE(0, 8);
        centralHeader.writeUInt16LE(compMethod, 10);
        centralHeader.writeUInt16LE(0, 12);
        centralHeader.writeUInt16LE(0, 14);
        centralHeader.writeUInt32LE(crc, 16);
        centralHeader.writeUInt32LE(compressedSize, 20);
        centralHeader.writeUInt32LE(uncompressedSize, 24);
        centralHeader.writeUInt16LE(nameBuf.length, 28);
        centralHeader.writeUInt16LE(0, 30);
        centralHeader.writeUInt16LE(0, 32);
        centralHeader.writeUInt16LE(0, 34);
        centralHeader.writeUInt16LE(0, 36);
        centralHeader.writeUInt32LE(0, 38);
        centralHeader.writeUInt32LE(offset, 42);
        nameBuf.copy(centralHeader, 46);

        centralHeaders.push(centralHeader);
        offset += localHeader.length + compressedData.length;
    }

    const centralDirOffset = offset;
    let centralDirSize = 0;
    for (const h of centralHeaders) {
        buffers.push(h);
        centralDirSize += h.length;
    }

    // End of central directory record (22 bytes)
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(0, 4);
    eocd.writeUInt16LE(0, 6);
    eocd.writeUInt16LE(files.length, 8);
    eocd.writeUInt16LE(files.length, 10);
    eocd.writeUInt32LE(centralDirSize, 12);
    eocd.writeUInt32LE(centralDirOffset, 16);
    eocd.writeUInt16LE(0, 20);

    buffers.push(eocd);

    const finalZip = Buffer.concat(buffers);
    fs.writeFileSync(outputPath, finalZip);

    const size = finalZip.length;
    const remaining = MAX_BYTES - size;
    const percent = ((size / MAX_BYTES) * 100).toFixed(1);

    console.log(`\n========================================`);
    console.log(`📦 js13k Zip Package Created!`);
    console.log(`📁 File: ${outputPath}`);
    console.log(`📊 Size: ${size} bytes / ${MAX_BYTES} bytes (${percent}%)`);
    if (remaining >= 0) {
        console.log(`✅ UNDER BUDGET! ${remaining} bytes free! (${((remaining / 1024)).toFixed(2)} KB remaining)`);
    } else {
        console.log(`❌ OVER BUDGET by ${-remaining} bytes!`);
    }
    console.log(`========================================\n`);
}

async function run() {
    await prepareDist();
    const files = getFiles(DIST_DIR);
    createZip(files, OUTPUT_ZIP);
}

run();
