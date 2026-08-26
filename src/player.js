import { projectBillboard, projectGroundQuad } from './projection.js';
import { TILE_SIZE, getUV } from './tile.js';
import { gameObjects } from './gameObjects.js';
import Tile from './tile.js';
import MovingBlock from './movingBlock.js';

const PLAYER_RUN_UV = [getUV(0, 1), getUV(1, 1), getUV(2, 1), getUV(3, 1)];
const PLAYER_IDLE_UV = [getUV(4, 1), getUV(5, 1)];
const SHADOW_UV = getUV(10, 0);

export function getGroundY(x, z, currentY) {
    let highest = -10;
    const gx = Math.floor(x / TILE_SIZE);
    const gz = Math.floor(z / TILE_SIZE);

    for (let i = 0; i < gameObjects.length; i++) {
        const obj = gameObjects[i];
        if (obj instanceof Tile && obj.type !== 'HOLE' && obj.gridX === gx && obj.gridZ === gz) {
            const topY = (obj.gridY + 1) * TILE_SIZE;
            if (topY <= currentY + 0.1 && topY > highest) highest = topY;
        } else if (obj instanceof MovingBlock) {
            if (x >= obj.x && x <= obj.x + TILE_SIZE && z >= obj.z && z <= obj.z + TILE_SIZE) {
                const topY = obj.y + TILE_SIZE;
                if (topY <= currentY + 0.1 && topY > highest) highest = topY;
            }
        }
    }
    return highest;
}

function pickFrame(frames, time, fps) {
    return frames[Math.floor(time * fps) % frames.length];
}

class Player {
    constructor(x, y, z) {
        this.x = x; this.y = y; this.z = z;
        this.vx = 0; this.vy = 0; this.vz = 0;
        this.width = 0.2; this.height = 0.2; this.depth = 0.2;
        this.grounded = false;
        this.isJumping = false;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this.jumpForce = 3.3;
        this.speed = 1.5;
        this.facing = 1;
        this.aimX = 0;
        this.aimZ = 1;
        this.animTime = 0;
    }

    spawnAt(gridX, gridY, gridZ) {
        this.x = gridX * TILE_SIZE + TILE_SIZE / 2;
        this.z = gridZ * TILE_SIZE + TILE_SIZE / 2;
        this.y = gridY * TILE_SIZE + 0.5;
        this.vx = 0;
        this.vy = 0;
        this.vz = 0;
        this.grounded = false;
        this.isJumping = false;
        this.aimX = 0;
        this.aimZ = 1;
    }

    update(dt) {
        this.animTime += dt;
    }

    render(renderer) {
        // Ground drop shadow
        const groundY = getGroundY(this.x, this.z, this.y);
        if (groundY > -5) {
            const diff = Math.max(0, this.y - groundY);
            const size = Math.max(0.10, 0.22 - diff * 0.03);
            const quad = projectGroundQuad(this.x, groundY + 0.002, this.z, renderer.camera, size, SHADOW_UV, 1.0);
            if (quad) renderer.addObjectToRender(quad);
        }

        const moving = Math.hypot(this.vx, this.vz) > 0.01;
        let uv;

        if (!this.grounded) {
            uv = this.vy > 0 ? PLAYER_RUN_UV[0] : PLAYER_RUN_UV[2];
        } else if (moving) {
            uv = pickFrame(PLAYER_RUN_UV, this.animTime, 15);
        } else {
            uv = pickFrame(PLAYER_IDLE_UV, this.animTime, 3);
        }

        const tri = projectBillboard(this.x, this.y, this.z, renderer.camera, this.width, this.height, uv, 1.0, this.facing > 0, 1.0);
        if (tri) renderer.addObjectToRender(tri.vertices);
    }
}

export const player = new Player(1, 1, 1);
