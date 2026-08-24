// tile.js (eller block.js)
import { worldToView } from './projection.js';

export const TILE_SIZE = 0.5; // storlek på varje tile i världen, i enheter

const texW = 128;
const texH = 32;
const tileSize = 8; // storlek på varje sprite i atlasen, i pixlar


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

const textureAtlas = {
    GRASS: { top: getUV(1, 0), bottom: getUV(0, 0) },
    ROCK: { top: getUV(3, 0), bottom: getUV(2, 0) },
    SNOW: { top: getUV(5, 0), bottom: getUV(4, 0) },
    RAINBOW: { top: getUV(7, 0), bottom: getUV(6, 0) },
    POINTER: { top: getUV(9, 0), bottom: getUV(8, 0) },
};


function createBlock(gridX, gridY, gridZ, type = 'GRASS', tileSize = TILE_SIZE, height = TILE_SIZE) {
    const x0 = gridX * tileSize;
    const x1 = x0 + tileSize;
    const z0 = gridZ * tileSize;
    const z1 = z0 + tileSize;
    const y0 = gridY * height;
    const y1 = y0 + height;

    const { u0: gu0, v0: gv0, u1: gu1, v1: gv1 } = textureAtlas[type].top;
    const { u0: du0, v0: dv0, u1: du1, v1: dv1 } = textureAtlas[type].bottom;

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

const NEAR = 0.3; // samma near-plane-tröskel som innan

function projectTriangle(p1, p2, p3, camera) {
    const va = worldToView(p1[0], p1[1], p1[2], camera);
    const vb = worldToView(p2[0], p2[1], p2[2], camera);
    const vc = worldToView(p3[0], p3[1], p3[2], camera);

    if (va[2] <= NEAR || vb[2] <= NEAR || vc[2] <= NEAR) return null;

    // Varje vertex: [x, y, z, u, v] – 5 tal, inte 4
    const vertices = [
        va[0], va[1], va[2], p1[3], p1[4],
        vb[0], vb[1], vb[2], p2[3], p2[4],
        vc[0], vc[1], vc[2], p3[3], p3[4],
    ];

    const depth = (va[2] + vb[2] + vc[2]) / 3;
    return { vertices, depth };
}

class Tile {
    constructor(gridX, gridY, gridZ, type = 1) {
        this.gridX = gridX;
        this.gridY = gridY;
        this.gridZ = gridZ;
        this.type = type;
        this.cachedBlock = null;
    }

    isVisible(camera) {
        // Simple frustum culling: check if block is within view distance
        const dx = this.gridX * TILE_SIZE - camera.x;
        const dy = this.gridY * TILE_SIZE - camera.y;
        const dz = this.gridZ * TILE_SIZE - camera.z;
        const distSq = dx * dx + dy * dy + dz * dz;
        return distSq < 400; // ~20 unit radius from camera
    }

    render(renderer) {
        if (this.type === 'HOLE') return;
        if (!this.isVisible(renderer.camera)) return;

        const camera = renderer.camera;

        if (!this.cachedBlock) {
            this.cachedBlock = createBlock(this.gridX, this.gridY, this.gridZ, this.type);
        }
        const block = this.cachedBlock;

        for (let i = 0; i < block.length; i += 3) {
            const tri = projectTriangle(block[i], block[i + 1], block[i + 2], camera);
            if (tri) renderer.addObjectToRender(tri.vertices, tri.depth);
        }
    }
}

export default Tile;