import { worldToView } from '../projection.js';
import { TILE_SIZE } from '../tile.js';
import textureUrl from '../assets/textures.png';

const vertexShaderSource = `#version 300 es
in vec3 a_position;
in vec2 a_texcoord;
out vec2 v_texcoord;

uniform float u_focalLength;
uniform float u_aspectRatio;
uniform float u_near;
uniform float u_far;

void main() {
  float z = a_position.z;
  float clipZ = (u_far + u_near) / (u_far - u_near) * z - (2.0 * u_far * u_near) / (u_far - u_near);
  gl_Position = vec4(a_position.x * u_focalLength, a_position.y * u_focalLength * u_aspectRatio, clipZ, z);
  v_texcoord = a_texcoord;
}`;

const fragmentShaderSource = `#version 300 es
precision mediump float;
in vec2 v_texcoord;
out vec4 outColor;

uniform sampler2D u_texture;
uniform float u_alphaMultiplier;
uniform vec3 u_tintColor;
uniform float u_tintAmount;

void main() {
  vec4 color = texture(u_texture, v_texcoord);
  if (color.a < 0.1) discard;
  vec3 rgb = mix(color.rgb, u_tintColor, u_tintAmount);
  outColor = vec4(rgb, color.a * u_alphaMultiplier);
}`;

const texW = 128;
const texH = 32;
const tileSize = 8;
const epsU = 0.5 / texW;
const epsV = 0.5 / texH;

function getUV(col, row) {
    const u0 = (col * tileSize) / texW;
    const v0 = (row * tileSize) / texH;
    const u1 = ((col + 1) * tileSize) / texW;
    const v1 = ((row + 1) * tileSize) / texH;

    return {
        u0: u0 + epsU, v0: v0 + epsV,
        u1: u1 - epsU, v1: v1 - epsV,
    };
}

export const textureAtlas = {
    1: { top: getUV(1, 0), bottom: getUV(0, 0) },
    2: { top: getUV(3, 0), bottom: getUV(2, 0) },
    3: { top: getUV(5, 0), bottom: getUV(4, 0) },
    4: { top: getUV(7, 0), bottom: getUV(6, 0) },
    5: { top: getUV(8, 0), bottom: getUV(8, 0) },
    6: { top: getUV(8, 0), bottom: getUV(8, 0) },
    G: { top: getUV(1, 0), bottom: getUV(0, 0) },
    R: { top: getUV(3, 0), bottom: getUV(2, 0) },
    S: { top: getUV(5, 0), bottom: getUV(4, 0) },
    RB: { top: getUV(7, 0), bottom: getUV(6, 0) },
    MX: { top: getUV(8, 0), bottom: getUV(8, 0) },
    MZ: { top: getUV(8, 0), bottom: getUV(8, 0) },
    GRASS: { top: getUV(1, 0), bottom: getUV(0, 0) },
    ROCK: { top: getUV(3, 0), bottom: getUV(2, 0) },
    SNOW: { top: getUV(5, 0), bottom: getUV(4, 0) },
    CLOUD: { top: getUV(9, 0), bottom: getUV(9, 0) },
    RAINBOW: { top: getUV(7, 0), bottom: getUV(6, 0) },
    POINTER: { top: getUV(9, 0), bottom: getUV(8, 0) },
    MOVING: { top: getUV(8, 0), bottom: getUV(8, 0) },
    MOVING_X: { top: getUV(8, 0), bottom: getUV(8, 0) },
    MOVING_Z: { top: getUV(8, 0), bottom: getUV(8, 0) },
    SPAWN: { top: getUV(0, 1), bottom: getUV(0, 1) },
    GOAL: { top: getUV(2, 2), bottom: getUV(2, 2) },
};

function createBlockVertices(gridX, gridY, gridZ, type = 'GRASS') {
    const x0 = gridX * TILE_SIZE;
    const x1 = x0 + TILE_SIZE;
    const z0 = gridZ * TILE_SIZE;
    const z1 = z0 + TILE_SIZE;
    const y0 = gridY * TILE_SIZE;
    const y1 = y0 + TILE_SIZE;

    const atlas = textureAtlas[type] || textureAtlas.GRASS;
    const { u0: gu0, v0: gv0, u1: gu1, v1: gv1 } = atlas.top;
    const { u0: du0, v0: dv0, u1: du1, v1: dv1 } = atlas.bottom;

    const top = [
        [x0, y1, z0, gu0, gv0], [x1, y1, z0, gu1, gv0], [x1, y1, z1, gu1, gv1],
        [x0, y1, z0, gu0, gv0], [x1, y1, z1, gu1, gv1], [x0, y1, z1, gu0, gv1],
    ];
    const bottom = [
        [x0, y0, z1, du0, dv1], [x1, y0, z1, du1, dv1], [x1, y0, z0, du1, dv0],
        [x0, y0, z1, du0, dv1], [x1, y0, z0, du1, dv0], [x0, y0, z0, du0, dv0],
    ];
    const front = [
        [x0, y0, z0, du0, dv1], [x1, y0, z0, du1, dv1], [x1, y1, z0, du1, dv0],
        [x0, y0, z0, du0, dv1], [x1, y1, z0, du1, dv0], [x0, y1, z0, du0, dv0],
    ];
    const back = [
        [x1, y0, z1, du0, dv1], [x0, y0, z1, du1, dv1], [x0, y1, z1, du1, dv0],
        [x1, y0, z1, du0, dv1], [x0, y1, z1, du1, dv0], [x1, y1, z1, du0, dv0],
    ];
    const left = [
        [x0, y0, z1, du0, dv1], [x0, y0, z0, du1, dv1], [x0, y1, z0, du1, dv0],
        [x0, y0, z1, du0, dv1], [x0, y1, z0, du1, dv0], [x0, y1, z1, du0, dv0],
    ];
    const right = [
        [x1, y0, z0, du0, dv1], [x1, y0, z1, du1, dv1], [x1, y1, z1, du1, dv0],
        [x1, y0, z0, du0, dv1], [x1, y1, z1, du1, dv0], [x1, y1, z0, du0, dv0],
    ];

    return [...top, ...bottom, ...front, ...back, ...left, ...right];
}

const NEAR = 0.3;

function projectTriangles(blockVertices, camera) {
    const result = [];
    for (let i = 0; i < blockVertices.length; i += 3) {
        const p1 = blockVertices[i];
        const p2 = blockVertices[i + 1];
        const p3 = blockVertices[i + 2];

        const va = worldToView(p1[0], p1[1], p1[2], camera);
        const vb = worldToView(p2[0], p2[1], p2[2], camera);
        const vc = worldToView(p3[0], p3[1], p3[2], camera);

        if (va[2] <= NEAR || vb[2] <= NEAR || vc[2] <= NEAR) continue;

        result.push(
            va[0], va[1], va[2], p1[3], p1[4],
            vb[0], vb[1], vb[2], p2[3], p2[4],
            vc[0], vc[1], vc[2], p3[3], p3[4]
        );
    }
    return result;
}

export class EditorRenderer {
    constructor(canvas, camera) {
        this.canvas = canvas;
        this.camera = camera;
        this.gl = canvas.getContext('webgl2');

        if (!this.gl) {
            console.error('WebGL2 not supported');
        }

        const gl = this.gl;
        const vs = this.createShader(gl.VERTEX_SHADER, vertexShaderSource);
        const fs = this.createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

        this.program = gl.createProgram();
        gl.attachShader(this.program, vs);
        gl.attachShader(this.program, fs);
        gl.linkProgram(this.program);

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);

        const posLoc = gl.getAttribLocation(this.program, 'a_position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 0);

        const uvLoc = gl.getAttribLocation(this.program, 'a_texcoord');
        gl.enableVertexAttribArray(uvLoc);
        gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);

        gl.bindVertexArray(null);

        this.texture = this.loadTexture(textureUrl);

        gl.useProgram(this.program);
        const uTextureLoc = gl.getUniformLocation(this.program, 'u_texture');
        gl.uniform1i(uTextureLoc, 0);

        this.uFocalLengthLoc = gl.getUniformLocation(this.program, 'u_focalLength');
        this.uAspectRatioLoc = gl.getUniformLocation(this.program, 'u_aspectRatio');
        this.uNearLoc = gl.getUniformLocation(this.program, 'u_near');
        this.uFarLoc = gl.getUniformLocation(this.program, 'u_far');
        this.uAlphaMultiplierLoc = gl.getUniformLocation(this.program, 'u_alphaMultiplier');
        this.uTintColorLoc = gl.getUniformLocation(this.program, 'u_tintColor');
        this.uTintAmountLoc = gl.getUniformLocation(this.program, 'u_tintAmount');

        gl.uniform1f(this.uNearLoc, 0.3);
        gl.uniform1f(this.uFarLoc, 150.0);
        gl.uniform1f(this.uAlphaMultiplierLoc, 1.0);
        gl.uniform3f(this.uTintColorLoc, 0.0, 0.0, 0.0);
        gl.uniform1f(this.uTintAmountLoc, 0.0);

        this.resize();
    }

    createShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    loadTexture(url) {
        const gl = this.gl;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 255, 255]));

        const image = new Image();
        image.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        };
        image.src = url;
        return texture;
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        const width = Math.floor(rect.width);
        const height = Math.floor(rect.height);

        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas.width = width;
            this.canvas.height = height;
            this.gl.viewport(0, 0, width, height);
            this.aspectRatio = width / (height || 1);
        }
    }

    render(editorWorld, hoveredCell, selectedTool) {
        this.resize();
        const gl = this.gl;

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.DEPTH_TEST);
        gl.depthMask(true);

        gl.clearColor(0.08, 0.1, 0.14, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(this.program);
        gl.uniform1f(this.uFocalLengthLoc, 1.5);
        gl.uniform1f(this.uAspectRatioLoc, this.aspectRatio);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        const isEditMode = this.camera.mode === 'edit';
        const activeLayer = editorWorld.activeLayer;

        const mainVertices = [];
        const gridVertices = [];
        const hoverVertices = [];
        let hoverTint = [0.0, 0.0, 0.0];
        let hoverTintAmount = 0.0;

        if (!isEditMode) {
            // 3D INSPECT MODE: Render all blocks in 3D
            for (const tile of editorWorld.activeBlocks.values()) {
                const blockVerts = createBlockVertices(tile.gridX, tile.gridY, tile.gridZ, tile.type);
                const projected = projectTriangles(blockVerts, this.camera);
                mainVertices.push(...projected);
            }

            // Spawn indicator in 3D
            if (editorWorld.spawn) {
                const { x, y, z } = editorWorld.spawn;
                const spawnVerts = createBlockVertices(x, y, z, 'SPAWN');
                const projected = projectTriangles(spawnVerts, this.camera);
                mainVertices.push(...projected);
            }

            // Goal indicator in 3D
            if (editorWorld.goal) {
                const { x, y, z } = editorWorld.goal;
                const goalVerts = createBlockVertices(x, y, z, 'GOAL');
                const projected = projectTriangles(goalVerts, this.camera);
                mainVertices.push(...projected);
            }
        } else {
            // TOP-DOWN EDIT MODE: Render ONLY the active layer!
            for (const tile of editorWorld.activeBlocks.values()) {
                if (tile.gridY === activeLayer) {
                    const blockVerts = createBlockVertices(tile.gridX, tile.gridY, tile.gridZ, tile.type);
                    const projected = projectTriangles(blockVerts, this.camera);
                    mainVertices.push(...projected);
                }
            }

            // Spawn indicator on this layer if present
            if (editorWorld.spawn && editorWorld.spawn.y === activeLayer) {
                const { x, y, z } = editorWorld.spawn;
                const spawnVerts = createBlockVertices(x, y, z, 'SPAWN');
                const projected = projectTriangles(spawnVerts, this.camera);
                mainVertices.push(...projected);
            }

            // Goal indicator on this layer if present
            if (editorWorld.goal && editorWorld.goal.y === activeLayer) {
                const { x, y, z } = editorWorld.goal;
                const goalVerts = createBlockVertices(x, y, z, 'GOAL');
                const projected = projectTriangles(goalVerts, this.camera);
                mainVertices.push(...projected);
            }

            // Clean crisp grid borders on the active layer
            const gridLines = this.createGridLines(editorWorld.chunkRadius, activeLayer);
            gridVertices.push(...projectTriangles(gridLines, this.camera));

            // Hover indicator
            if (hoveredCell) {
                const hoverType = selectedTool === 'ERASER' ? 'POINTER' : (selectedTool === 'SPAWN' ? 'SPAWN' : (selectedTool === 'GOAL' ? 'GOAL' : selectedTool));
                const hoverVerts = createBlockVertices(hoveredCell.x, hoveredCell.y, hoveredCell.z, hoverType);
                hoverVertices.push(...projectTriangles(hoverVerts, this.camera));

                if (selectedTool === 'ERASER') {
                    hoverTint = [1.0, 0.1, 0.1]; // Red for erase
                    hoverTintAmount = 0.6;
                } else if (selectedTool === 'SPAWN') {
                    hoverTint = [1.0, 0.8, 0.0]; // Gold for spawn
                    hoverTintAmount = 0.4;
                } else if (selectedTool === 'GOAL') {
                    hoverTint = [1.0, 0.85, 0.0]; // Shiny gold for goal
                    hoverTintAmount = 0.5;
                } else {
                    hoverTint = [0.0, 0.0, 0.0]; // Normal texture preview
                    hoverTintAmount = 0.0;
                }
            }
        }

        // --- DRAW PASSES ---

        // 1. Blocks: Render completely untinted (100% pure texture)
        if (mainVertices.length > 0) {
            gl.depthMask(true);
            gl.uniform1f(this.uAlphaMultiplierLoc, 1.0);
            gl.uniform1f(this.uTintAmountLoc, 0.0);
            this.drawVertices(mainVertices);
        }

        // 2. Grid lines
        if (gridVertices.length > 0) {
            gl.disable(gl.DEPTH_TEST);
            gl.uniform1f(this.uAlphaMultiplierLoc, 0.7);
            gl.uniform3f(this.uTintColorLoc, 0.3, 0.65, 1.0);
            gl.uniform1f(this.uTintAmountLoc, 1.0);
            this.drawVertices(gridVertices);
            gl.enable(gl.DEPTH_TEST);
        }

        // 3. Hover indicator
        if (hoverVertices.length > 0) {
            gl.disable(gl.DEPTH_TEST);
            gl.uniform1f(this.uAlphaMultiplierLoc, 0.85);
            gl.uniform3f(this.uTintColorLoc, hoverTint[0], hoverTint[1], hoverTint[2]);
            gl.uniform1f(this.uTintAmountLoc, hoverTintAmount);
            this.drawVertices(hoverVertices);
            gl.enable(gl.DEPTH_TEST);
        }

        gl.depthMask(true);
    }

    createGridLines(radius, layer) {
        const quads = [];
        const y = (layer + 1) * TILE_SIZE + 0.002;
        const lineThick = 0.015;
        // Use solid opaque texture pixel for grid lines
        const { u0, v0, u1, v1 } = textureAtlas.ROCK.top;

        const minCoord = -radius * TILE_SIZE;
        const maxCoord = (radius + 1) * TILE_SIZE;

        // Lines along X
        for (let dz = -radius; dz <= radius + 1; dz++) {
            const z = dz * TILE_SIZE;
            const z0 = z - lineThick / 2;
            const z1 = z + lineThick / 2;

            quads.push(
                [minCoord, y, z0, u0, v0], [maxCoord, y, z0, u1, v0], [maxCoord, y, z1, u1, v1],
                [minCoord, y, z0, u0, v0], [maxCoord, y, z1, u1, v1], [minCoord, y, z1, u0, v1]
            );
        }

        // Lines along Z
        for (let dx = -radius; dx <= radius + 1; dx++) {
            const x = dx * TILE_SIZE;
            const x0 = x - lineThick / 2;
            const x1 = x + lineThick / 2;

            quads.push(
                [x0, y, minCoord, u0, v0], [x1, y, minCoord, u1, v0], [x1, y, maxCoord, u1, v1],
                [x0, y, minCoord, u0, v0], [x1, y, maxCoord, u1, v1], [x0, y, maxCoord, u0, v1]
            );
        }

        return quads;
    }

    drawVertices(verts) {
        const gl = this.gl;
        gl.bindVertexArray(this.vao);
        const array = new Float32Array(verts);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, array, gl.DYNAMIC_DRAW);
        gl.drawArrays(gl.TRIANGLES, 0, verts.length / 5);
        gl.bindVertexArray(null);
    }
}

export default EditorRenderer;
