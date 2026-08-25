import { gameObjects } from './gameObjects.js';
import Tile, { TILE_SIZE, createBlock, projectTriangle } from './tile.js';

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
        const block = createBlock(this.x, this.y, this.z, 'MOVING', true);
        for (let i = 0; i < block.length; i += 3) {
            const tri = projectTriangle(block[i], block[i + 1], block[i + 2], camera);
            if (tri) renderer.addObjectToRender(tri.vertices, tri.depth);
        }
    }
}

export default MovingBlock;
