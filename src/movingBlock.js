import { worldToView } from './projection.js';
import { TILE_SIZE } from './tile.js';
import { gameObjects } from './gameObjects.js';
import Tile from './tile.js';

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

const MOVING_UV = {
    top: getUV(8, 0),
    bottom: getUV(8, 0)
};

function createContinuousBlock(x0, y0, z0, uv = MOVING_UV) {
    const x1 = x0 + TILE_SIZE;
    const y1 = y0 + TILE_SIZE;
    const z1 = z0 + TILE_SIZE;

    const { u0: gu0, v0: gv0, u1: gu1, v1: gv1 } = uv.top;
    const { u0: du0, v0: dv0, u1: du1, v1: dv1 } = uv.bottom;

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

        const vertices = [
            va[0], va[1], va[2], p1[3], p1[4],
            vb[0], vb[1], vb[2], p2[3], p2[4],
            vc[0], vc[1], vc[2], p3[3], p3[4],
        ];
        const depth = (va[2] + vb[2] + vc[2]) / 3;
        result.push({ vertices, depth });
    }
    return result;
}

export class MovingBlock {
    constructor(gridX, gridY, gridZ, axis = 'x', maxDistance = 3, speed = 0.8) {
        this.startGridX = gridX;
        this.startGridY = gridY;
        this.startGridZ = gridZ;

        this.gridX = gridX;
        this.gridY = gridY;
        this.gridZ = gridZ;

        this.startX = gridX * TILE_SIZE;
        this.startY = gridY * TILE_SIZE;
        this.startZ = gridZ * TILE_SIZE;

        this.x = this.startX;
        this.y = this.startY;
        this.z = this.startZ;

        this.axis = axis.toLowerCase(); // 'x' or 'z'
        this.direction = 1; // 1 or -1
        this.maxDistance = maxDistance * TILE_SIZE;
        this.speed = speed;

        this.vx = this.axis === 'x' ? this.speed : 0;
        this.vy = 0;
        this.vz = this.axis === 'z' ? this.speed : 0;
        this.type = 'MOVING';
    }

    checkWallCollision(nextX, nextZ) {
        const testMinX = nextX;
        const testMaxX = nextX + TILE_SIZE;
        const testMinY = this.y;
        const testMaxY = this.y + TILE_SIZE;
        const testMinZ = nextZ;
        const testMaxZ = nextZ + TILE_SIZE;

        for (const obj of gameObjects) {
            if (obj === this) continue;
            if (obj instanceof Tile && obj.type !== 'HOLE') {
                const tMinX = obj.gridX * TILE_SIZE;
                const tMaxX = tMinX + TILE_SIZE;
                const tMinY = obj.gridY * TILE_SIZE;
                const tMaxY = tMinY + TILE_SIZE;
                const tMinZ = obj.gridZ * TILE_SIZE;
                const tMaxZ = tMinZ + TILE_SIZE;

                const overlapX = testMinX < tMaxX && testMaxX > tMinX;
                const overlapY = testMinY < tMaxY && testMaxY > tMinY;
                const overlapZ = testMinZ < tMaxZ && testMaxZ > tMinZ;

                if (overlapX && overlapY && overlapZ) {
                    return true;
                }
            } else if (obj instanceof MovingBlock) {
                const tMinX = obj.x;
                const tMaxX = obj.x + TILE_SIZE;
                const tMinY = obj.y;
                const tMaxY = obj.y + TILE_SIZE;
                const tMinZ = obj.z;
                const tMaxZ = obj.z + TILE_SIZE;

                const overlapX = testMinX < tMaxX && testMaxX > tMinX;
                const overlapY = testMinY < tMaxY && testMaxY > tMinY;
                const overlapZ = testMinZ < tMaxZ && testMaxZ > tMinZ;

                if (overlapX && overlapY && overlapZ) {
                    return true;
                }
            }
        }
        return false;
    }

    update(dt) {
        const step = this.direction * this.speed * dt;
        let nextX = this.x;
        let nextZ = this.z;

        if (this.axis === 'x') {
            nextX += step;
            const distFromStart = nextX - this.startX;

            // Vänd om den når max distance eller krockar med ett fast block
            const hitWall = this.checkWallCollision(nextX, this.z);
            const reachedMax = this.maxDistance > 0 && (distFromStart > this.maxDistance || distFromStart < 0);

            if (hitWall || reachedMax) {
                this.direction = -this.direction;
                nextX = this.x + this.direction * this.speed * dt;
            }
        } else {
            nextZ += step;
            const distFromStart = nextZ - this.startZ;

            const hitWall = this.checkWallCollision(this.x, nextZ);
            const reachedMax = this.maxDistance > 0 && (distFromStart > this.maxDistance || distFromStart < 0);

            if (hitWall || reachedMax) {
                this.direction = -this.direction;
                nextZ = this.z + this.direction * this.speed * dt;
            }
        }

        this.x = nextX;
        this.z = nextZ;
        this.vx = this.axis === 'x' ? this.direction * this.speed : 0;
        this.vz = this.axis === 'z' ? this.direction * this.speed : 0;
        this.gridX = Math.floor(this.x / TILE_SIZE);
        this.gridZ = Math.floor(this.z / TILE_SIZE);
    }

    render(renderer) {
        const camera = renderer.camera;
        const block = createContinuousBlock(this.x, this.y, this.z, MOVING_UV);
        const tris = projectTriangles(block, camera);

        for (const tri of tris) {
            renderer.addObjectToRender(tri.vertices, tri.depth);
        }
    }
}

export default MovingBlock;
