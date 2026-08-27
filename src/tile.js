import { worldToView } from './projection.js';

export const TILE_SIZE = 0.5;

const texW = 128, texH = 32, tileSize = 8;
const epsU = 0.5 / texW, epsV = 0.5 / texH;

export function getUV(col, row) {
    const u0 = (col * tileSize) / texW;
    const v0 = (row * tileSize) / texH;
    const u1 = ((col + 1) * tileSize) / texW;
    const v1 = ((row + 1) * tileSize) / texH;
    return { u0: u0 + epsU, v0: v0 + epsV, u1: u1 - epsU, v1: v1 - epsV };
}

export const uvMap = {
    1: [1, 0], 2: [3, 2], 3: [5, 4], 4: [7, 6], 5: [8, 8], 6: [8, 8], 7: [9, 9],
    G: [1, 0], R: [3, 2], S: [5, 4], RB: [7, 6], MX: [8, 8], MZ: [8, 8], C: [9, 9],
    GRASS: [1, 0], ROCK: [3, 2], SNOW: [5, 4], CLOUD: [9, 9],
    POINTER: [9, 8], RAINBOW: [7, 6], MOVING: [8, 8], MOVING_X: [8, 8], MOVING_Z: [8, 8]
};

const FACES = [
    [0,1,0, 1,1,0, 1,1,1, 0,1,1, 1.1, 1],
    [0,0,1, 1,0,1, 1,0,0, 0,0,0, 0.2, 0],
    [0,0,0, 1,0,0, 1,1,0, 0,1,0, 0.95, 0],
    [1,0,1, 0,0,1, 0,1,1, 1,1,1, 0.35, 0],
    [0,0,1, 0,0,0, 0,1,0, 0,1,1, 0.55, 0],
    [1,0,0, 1,0,1, 1,1,1, 1,1,0, 0.7, 0]
];

export function createBlock(x, y, z, type = 1, isWorld = false) {
    const x0 = isWorld ? x : x * TILE_SIZE, y0 = isWorld ? y : y * TILE_SIZE, z0 = isWorld ? z : z * TILE_SIZE;
    const [tC, bC] = uvMap[type] || [1, 0];
    const topUV = getUV(tC, 0), botUV = getUV(bC, 0);
    const res = [];

    for (const [x0f, y0f, z0f, x1f, y1f, z1f, x2f, y2f, z2f, x3f, y3f, z3f, light, isTop] of FACES) {
        const u = isTop ? topUV : botUV;
        const uvs = isTop ? [u.u0, u.v0, u.u1, u.v0, u.u1, u.v1, u.u0, u.v1] : [u.u0, u.v1, u.u1, u.v1, u.u1, u.v0, u.u0, u.v0];
        const c0 = [x0 + x0f * TILE_SIZE, y0 + y0f * TILE_SIZE, z0 + z0f * TILE_SIZE, uvs[0], uvs[1], light];
        const c1 = [x0 + x1f * TILE_SIZE, y0 + y1f * TILE_SIZE, z0 + z1f * TILE_SIZE, uvs[2], uvs[3], light];
        const c2 = [x0 + x2f * TILE_SIZE, y0 + y2f * TILE_SIZE, z0 + z2f * TILE_SIZE, uvs[4], uvs[5], light];
        const c3 = [x0 + x3f * TILE_SIZE, y0 + y3f * TILE_SIZE, z0 + z3f * TILE_SIZE, uvs[6], uvs[7], light];
        res.push(c0, c1, c2, c0, c2, c3);
    }
    return res;
}

const NEAR = 0.3;

export function projectTriangle(p1, p2, p3, camera) {
    const va = worldToView(p1[0], p1[1], p1[2], camera);
    const vb = worldToView(p2[0], p2[1], p2[2], camera);
    const vc = worldToView(p3[0], p3[1], p3[2], camera);

    if (va[2] <= NEAR || vb[2] <= NEAR || vc[2] <= NEAR) return null;

    const vertices = [
        va[0], va[1], va[2], p1[3], p1[4], p1[5],
        vb[0], vb[1], vb[2], p2[3], p2[4], p2[5],
        vc[0], vc[1], vc[2], p3[3], p3[4], p3[5],
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
        const dx = this.gridX * TILE_SIZE - camera.x;
        const dy = this.gridY * TILE_SIZE - camera.y;
        const dz = this.gridZ * TILE_SIZE - camera.z;
        return (dx * dx + dy * dy + dz * dz) < 400;
    }

    render(renderer) {
        if (this.type === 'HOLE' || !this.isVisible(renderer.camera)) return;
        const camera = renderer.camera;
        if (!this.cachedBlock) {
            this.cachedBlock = createBlock(this.gridX, this.gridY, this.gridZ, this.type);
        }
        const block = this.cachedBlock;
        for (let i = 0; i < block.length; i += 3) {
            const tri = projectTriangle(block[i], block[i + 1], block[i + 2], camera);
            if (tri) renderer.addObjectToRender(tri.vertices);
        }
    }
}

export default Tile;
