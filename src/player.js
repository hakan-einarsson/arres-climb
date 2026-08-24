import { worldToView } from './projection.js';

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

function flipUV(uv) {
    return { u0: uv.u1, v0: uv.v0, u1: uv.u0, v1: uv.v1 };
}

function pickFrame(frames, time, fps) {
    return frames[Math.floor(time * fps) % frames.length];
}

function projectBillboard(x, y, z, camera, width, height, uv, flipX = false) {
    const dx = camera.x - x;
    const dz = camera.z - z;
    const len = Math.sqrt(dx * dx + dz * dz) || 1;
    const dirX = dx / len;
    const dirZ = dz / len;

    // Höger-vektor = riktningen roterad 90°. Byt tecken (dirZ, -dirX) -> (-dirZ, dirX) om spegelvänt.
    const rightX = dirZ;
    const rightZ = -dirX;

    const halfW = width / 2;
    const leftX = x - halfW * rightX;
    const leftZ = z - halfW * rightZ;
    const rightPX = x + halfW * rightX;
    const rightPZ = z + halfW * rightZ;

    const bl = worldToView(leftX, y, leftZ, camera);
    const br = worldToView(rightPX, y, rightPZ, camera);
    const tl = worldToView(leftX, y + height, leftZ, camera);
    const tr = worldToView(rightPX, y + height, rightPZ, camera);

    if (bl[2] <= 0.3 || br[2] <= 0.3) return null;

    const { u0, v0, u1, v1 } = flipX ? flipUV(uv) : uv;

    const vertices = [
        bl[0], bl[1], bl[2], u0, v1,
        br[0], br[1], br[2], u1, v1,
        tr[0], tr[1], tr[2], u1, v0,

        bl[0], bl[1], bl[2], u0, v1,
        tr[0], tr[1], tr[2], u1, v0,
        tl[0], tl[1], tl[2], u0, v0,
    ];

    const depth = (bl[2] + br[2]) / 2;
    return { vertices, depth };
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

        const tri = projectBillboard(this.x, this.y, this.z, renderer.camera, this.width, this.height, uv, this.facing > 0);
        if (tri) renderer.addObjectToRender(tri.vertices, tri.depth, renderer.playerTexture);
    }
}

export const player = new Player(1, 1, 1);