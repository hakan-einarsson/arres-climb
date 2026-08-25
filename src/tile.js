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
    1: [1, 0], 2: [3, 2], 3: [5, 4], 4: [7, 6], 5: [8, 8], 6: [8, 8],
    GRASS: [1, 0], ROCK: [3, 2], SNOW: [5, 4], CLOUD: [9, 9],
    POINTER: [9, 8], RAINBOW: [7, 6], MOVING: [8, 8], MOVING_X: [8, 8], MOVING_Z: [8, 8]
};

export function createBlock(x, y, z, type = 1, isWorld = false) {
    const x0 = isWorld ? x : x * TILE_SIZE, y0 = isWorld ? y : y * TILE_SIZE, z0 = isWorld ? z : z * TILE_SIZE;
    const x1 = x0 + TILE_SIZE, y1 = y0 + TILE_SIZE, z1 = z0 + TILE_SIZE;
    const [tC, bC] = uvMap[type] || [1, 0];
    const { u0: gu0, v0: gv0, u1: gu1, v1: gv1 } = getUV(tC, 0);
    const { u0: du0, v0: dv0, u1: du1, v1: dv1 } = getUV(bC, 0);

    const h = Math.min(1.0, 0.82 + (y0 / 7.0) * 0.18);
    const lTop = 1.05 * h, lBtm = 0.45 * h, lFrnt = 0.86 * h, lBck = 0.60 * h, lLeft = 0.68 * h, lRgt = 0.80 * h;

    return [
        [x0,y1,z0,gu0,gv0,lTop],[x1,y1,z0,gu1,gv0,lTop],[x1,y1,z1,gu1,gv1,lTop], [x0,y1,z0,gu0,gv0,lTop],[x1,y1,z1,gu1,gv1,lTop],[x0,y1,z1,gu0,gv1,lTop],
        [x0,y0,z1,du0,dv1,lBtm],[x1,y0,z1,du1,dv1,lBtm],[x1,y0,z0,du1,dv0,lBtm], [x0,y0,z1,du0,dv1,lBtm],[x1,y0,z0,du1,dv0,lBtm],[x0,y0,z0,du0,dv0,lBtm],
        [x0,y0,z0,du0,dv1,lFrnt],[x1,y0,z0,du1,dv1,lFrnt],[x1,y1,z0,du1,dv0,lFrnt], [x0,y0,z0,du0,dv1,lFrnt],[x1,y1,z0,du1,dv0,lFrnt],[x0,y1,z0,du0,dv0,lFrnt],
        [x1,y0,z1,du0,dv1,lBck],[x0,y0,z1,du1,dv1,lBck],[x0,y1,z1,du1,dv0,lBck], [x1,y0,z1,du0,dv1,lBck],[x0,y1,z1,du1,dv0,lBck],[x1,y1,z1,du0,dv0,lBck],
        [x0,y0,z1,du0,dv1,lLeft],[x0,y0,z0,du1,dv1,lLeft],[x0,y1,z0,du1,dv0,lLeft], [x0,y0,z1,du0,dv1,lLeft],[x0,y1,z0,du1,dv0,lLeft],[x0,y1,z1,du0,dv0,lLeft],
        [x1,y0,z0,du0,dv1,lRgt],[x1,y0,z1,du1,dv1,lRgt],[x1,y1,z1,du1,dv0,lRgt], [x1,y0,z0,du0,dv1,lRgt],[x1,y1,z1,du1,dv0,lRgt],[x1,y1,z0,du0,dv0,lRgt]
    ];
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
