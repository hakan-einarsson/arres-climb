import { projectBillboard } from './projection.js';
import { TILE_SIZE } from './tile.js';

const texW = 128, texH = 32, tileSize = 8;
const epsU = 0.5 / texW, epsV = 0.5 / texH;

function getUV(col, row) {
    const u0 = (col * tileSize) / texW;
    const v0 = (row * tileSize) / texH;
    const u1 = ((col + 1) * tileSize) / texW;
    const v1 = ((row + 1) * tileSize) / texH;
    return { u0: u0 + epsU, v0: v0 + epsV, u1: u1 - epsU, v1: v1 - epsV };
}

const PLAYER_RUN_UV = [getUV(0, 1), getUV(1, 1), getUV(2, 1), getUV(3, 1)];
const PLAYER_IDLE_UV = [getUV(4, 1), getUV(5, 1)];
const PLAYER_JUMP_UV = [getUV(0, 1)];
const PLAYER_FALL_UV = [getUV(2, 1)];

function pickFrame(frames, time, fps) {
    return frames[Math.floor(time * fps) % frames.length];
}

class Player {
    constructor(x, y, z) {
        this.x = x; this.y = y; this.z = z;
        this.vx = 0; this.vy = 0; this.vz = 0;
        this.width = 0.2; this.height = 0.2; this.depth = 0.2;
        this.grounded = false;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this.jumpForce = 3.3;
        this.speed = 1.5;
        this.facing = 1;
        this.aimX = 0;
        this.aimZ = 1;
        this.animTime = 0;
        this.hasJumped = false;
    }

    spawnAt(gridX, gridY, gridZ) {
        this.x = gridX * TILE_SIZE + TILE_SIZE / 2;
        this.z = gridZ * TILE_SIZE + TILE_SIZE / 2;
        this.y = gridY * TILE_SIZE + 0.5;
        this.vx = 0;
        this.vy = 0;
        this.vz = 0;
        this.grounded = false;
        this.aimX = 0;
        this.aimZ = 1;
    }

    update(dt) {
        this.animTime += dt;
    }

    render(renderer) {
        const moving = Math.hypot(this.vx, this.vz) > 0.01;
        let uv;

        if (!this.grounded) {
            uv = this.vy > 0 ? PLAYER_JUMP_UV[0] : PLAYER_FALL_UV[0];
        } else if (moving) {
            uv = pickFrame(PLAYER_RUN_UV, this.animTime, 15);
        } else {
            uv = pickFrame(PLAYER_IDLE_UV, this.animTime, 3);
        }

        const tri = projectBillboard(this.x, this.y, this.z, renderer.camera, this.width, this.height, uv, 1.0, this.facing > 0);
        if (tri) renderer.addObjectToRender(tri.vertices, tri.depth);
    }
}

export const player = new Player(1, 1, 1);
