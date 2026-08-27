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
        for (const obj of gameObjects) {
            if (obj === this || obj.type === 'HOLE') continue;
            const isTile = obj instanceof Tile;
            const isMb = obj instanceof MovingBlock;
            if (!isTile && !isMb) continue;

            const tX = isTile ? obj.gridX * TILE_SIZE : obj.x;
            const tY = isTile ? obj.gridY * TILE_SIZE : obj.y;
            const tZ = isTile ? obj.gridZ * TILE_SIZE : obj.z;

            if (nextX < tX + TILE_SIZE && nextX + TILE_SIZE > tX &&
                this.y < tY + TILE_SIZE && this.y + TILE_SIZE > tY &&
                nextZ < tZ + TILE_SIZE && nextZ + TILE_SIZE > tZ) {
                return true;
            }
        }
        return false;
    }

    update(dt) {
        let step = this.direction * this.speed * dt;
        const isX = this.axis === 'x';
        let nextX = this.x + (isX ? step : 0);
        let nextZ = this.z + (isX ? 0 : step);

        const distFromStart = (isX ? nextX : nextZ) - (isX ? this.startX : this.startZ);
        const hitWall = this.checkWallCollision(nextX, nextZ);
        const reachedMax = this.maxDistance > 0 && (distFromStart > this.maxDistance || distFromStart < 0);

        if (hitWall || reachedMax) {
            this.direction = -this.direction;
            step = this.direction * this.speed * dt;
            nextX = this.x + (isX ? step : 0);
            nextZ = this.z + (isX ? 0 : step);
        }

        // Check if player is riding on top
        const isRiding = Math.abs(player.y - (this.y + TILE_SIZE)) < 0.05 &&
            player.x + player.width / 2 > this.x && player.x - player.width / 2 < this.x + TILE_SIZE &&
            player.z + player.depth / 2 > this.z && player.z - player.depth / 2 < this.z + TILE_SIZE;

        if (isRiding) {
            moveAxis(player, this.axis, step);
        } else {
            // Check if block is pushing player / crushing against obstacle
            const testX = isX ? nextX : this.x;
            const testZ = isX ? this.z : nextZ;

            const overlapX = (player.x + player.width / 2 > testX + 0.002) && (player.x - player.width / 2 < testX + TILE_SIZE - 0.002);
            const overlapY = (player.y + player.height > this.y + 0.002) && (player.y < this.y + TILE_SIZE - 0.002);
            const overlapZ = (player.z + player.depth / 2 > testZ + 0.002) && (player.z - player.depth / 2 < testZ + TILE_SIZE - 0.002);

            if (overlapX && overlapY && overlapZ) {
                const targetPos = this.direction > 0 ? ((isX ? testX : testZ) + TILE_SIZE + (isX ? player.width : player.depth) / 2) : ((isX ? testX : testZ) - (isX ? player.width : player.depth) / 2);
                const pushDelta = targetPos - player[this.axis];

                const prevPos = player[this.axis];
                moveAxis(player, this.axis, pushDelta);
                const moved = Math.abs(player[this.axis] - prevPos);

                if (moved < Math.abs(pushDelta) - 0.001) {
                    this.direction = -this.direction;
                    step = this.direction * this.speed * dt;
                    nextX = this.x + (isX ? step : 0);
                    nextZ = this.z + (isX ? 0 : step);
                }
            }
        }

        this.x = nextX;
        this.z = nextZ;
        this.vx = isX ? this.direction * this.speed : 0;
        this.vz = isX ? 0 : this.direction * this.speed;
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
