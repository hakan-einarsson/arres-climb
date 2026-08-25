import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const DIST_DIR = path.resolve('dist');
const OUTPUT_ZIP = path.resolve('dist/index.zip');
const MAX_BYTES = 13312; // 13 KB limit for js13k

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
        localHeader.writeUInt32LE(0x04034b50, 0); // signature
        localHeader.writeUInt16LE(20, 4);         // version needed (2.0)
        localHeader.writeUInt16LE(0, 6);          // flags
        localHeader.writeUInt16LE(compMethod, 8);  // compression method
        localHeader.writeUInt16LE(0, 10);         // time
        localHeader.writeUInt16LE(0, 12);         // date
        localHeader.writeUInt32LE(crc, 14);       // crc32
        localHeader.writeUInt32LE(compressedSize, 18); // compressed size
        localHeader.writeUInt32LE(uncompressedSize, 22); // uncompressed size
        localHeader.writeUInt16LE(nameBuf.length, 26); // name length
        localHeader.writeUInt16LE(0, 28);         // extra length
        nameBuf.copy(localHeader, 30);

        buffers.push(localHeader, compressedData);

        // Central directory header (46 bytes + name)
        const centralHeader = Buffer.alloc(46 + nameBuf.length);
        centralHeader.writeUInt32LE(0x02014b50, 0); // signature
        centralHeader.writeUInt16LE(20, 4);         // version made by
        centralHeader.writeUInt16LE(20, 6);         // version needed
        centralHeader.writeUInt16LE(0, 8);          // flags
        centralHeader.writeUInt16LE(compMethod, 10); // compression method
        centralHeader.writeUInt16LE(0, 12);         // time
        centralHeader.writeUInt16LE(0, 14);         // date
        centralHeader.writeUInt32LE(crc, 16);       // crc32
        centralHeader.writeUInt32LE(compressedSize, 20); // compressed size
        centralHeader.writeUInt32LE(uncompressedSize, 24); // uncompressed size
        centralHeader.writeUInt16LE(nameBuf.length, 28); // name length
        centralHeader.writeUInt16LE(0, 30);         // extra length
        centralHeader.writeUInt16LE(0, 32);         // comment length
        centralHeader.writeUInt16LE(0, 34);         // disk start
        centralHeader.writeUInt16LE(0, 36);         // internal attrs
        centralHeader.writeUInt32LE(0, 38);         // external attrs
        centralHeader.writeUInt32LE(offset, 42);    // local header offset
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
    eocd.writeUInt32LE(0x06054b50, 0); // signature
    eocd.writeUInt16LE(0, 4);          // disk number
    eocd.writeUInt16LE(0, 6);          // start disk
    eocd.writeUInt16LE(files.length, 8); // records on this disk
    eocd.writeUInt16LE(files.length, 10); // total records
    eocd.writeUInt32LE(centralDirSize, 12); // central dir size
    eocd.writeUInt32LE(centralDirOffset, 16); // offset of central dir
    eocd.writeUInt16LE(0, 20);         // comment length

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

const files = getFiles(DIST_DIR);
createZip(files, OUTPUT_ZIP);
