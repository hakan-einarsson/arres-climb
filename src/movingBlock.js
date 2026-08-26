import { gameObjects } from './gameObjects.js';
import Tile, { TILE_SIZE, createBlock, projectTriangle } from './tile.js';
import { player } from './player.js';
import { moveAxis } from './physics.js';

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
        let step = this.direction * this.speed * dt;
        let nextX = this.x;
        let nextZ = this.z;

        if (this.axis === 'x') {
            nextX += step;
            const distFromStart = nextX - this.startX;
            const hitWall = this.checkWallCollision(nextX, this.z);
            const reachedMax = this.maxDistance > 0 && (distFromStart > this.maxDistance || distFromStart < 0);

            if (hitWall || reachedMax) {
                this.direction = -this.direction;
                step = this.direction * this.speed * dt;
                nextX = this.x + step;
            }
        } else {
            nextZ += step;
            const distFromStart = nextZ - this.startZ;
            const hitWall = this.checkWallCollision(this.x, nextZ);
            const reachedMax = this.maxDistance > 0 && (distFromStart > this.maxDistance || distFromStart < 0);

            if (hitWall || reachedMax) {
                this.direction = -this.direction;
                step = this.direction * this.speed * dt;
                nextZ = this.z + step;
            }
        }

        // Check if player is riding on top
        const isRiding = Math.abs(player.y - (this.y + TILE_SIZE)) < 0.05 &&
            player.x + player.width / 2 > this.x && player.x - player.width / 2 < this.x + TILE_SIZE &&
            player.z + player.depth / 2 > this.z && player.z - player.depth / 2 < this.z + TILE_SIZE;

        if (isRiding) {
            moveAxis(player, this.axis, step);
        } else {
            // Check if block is pushing player / crushing against obstacle
            const testX = this.axis === 'x' ? nextX : this.x;
            const testZ = this.axis === 'z' ? nextZ : this.z;

            const overlapX = (player.x + player.width / 2 > testX + 0.002) && (player.x - player.width / 2 < testX + TILE_SIZE - 0.002);
            const overlapY = (player.y + player.height > this.y + 0.002) && (player.y < this.y + TILE_SIZE - 0.002);
            const overlapZ = (player.z + player.depth / 2 > testZ + 0.002) && (player.z - player.depth / 2 < testZ + TILE_SIZE - 0.002);

            if (overlapX && overlapY && overlapZ) {
                let pushDelta = 0;
                if (this.axis === 'x') {
                    const targetX = this.direction > 0 ? (testX + TILE_SIZE + player.width / 2) : (testX - player.width / 2);
                    pushDelta = targetX - player.x;
                } else {
                    const targetZ = this.direction > 0 ? (testZ + TILE_SIZE + player.depth / 2) : (testZ - player.depth / 2);
                    pushDelta = targetZ - player.z;
                }

                const prevPos = player[this.axis];
                moveAxis(player, this.axis, pushDelta);
                const moved = Math.abs(player[this.axis] - prevPos);

                if (moved < Math.abs(pushDelta) - 0.001) {
                    // Crushed against wall or obstacle: reverse direction immediately!
                    this.direction = -this.direction;
                    step = this.direction * this.speed * dt;
                    if (this.axis === 'x') {
                        nextX = this.x + step;
                    } else {
                        nextZ = this.z + step;
                    }
                }
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
