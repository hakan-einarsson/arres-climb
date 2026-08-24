import { worldToView } from './projection.js';
import { TILE_SIZE } from './tile.js';

const texW = 128;
const texH = 32;
const epsU = 0.5 / texW;
const epsV = 0.5 / texH;

// 16x16 sprite at x:16, y:16 in textures.png
const COIN_UV = {
    u0: 16 / texW + epsU,
    v0: 16 / texH + epsV,
    u1: 32 / texW - epsU,
    v1: 32 / texH - epsV,
};

function projectRotatingBillboard(x, y, z, camera, width, height, uv, angle) {
    const dx = camera.x - x;
    const dz = camera.z - z;
    const len = Math.sqrt(dx * dx + dz * dz) || 1;
    const dirX = dx / len;
    const dirZ = dz / len;

    // Right vector perpendicular to camera view
    const rightX = dirZ;
    const rightZ = -dirX;

    // Apparent horizontal width based on spin angle
    const cosAngle = Math.cos(angle);
    const halfW = (width / 2) * cosAngle;

    const leftX = x - halfW * rightX;
    const leftZ = z - halfW * rightZ;
    const rightPX = x + halfW * rightX;
    const rightPZ = z + halfW * rightZ;

    const bl = worldToView(leftX, y, leftZ, camera);
    const br = worldToView(rightPX, y, rightPZ, camera);
    const tl = worldToView(leftX, y + height, leftZ, camera);
    const tr = worldToView(rightPX, y + height, rightPZ, camera);

    if (bl[2] <= 0.3 || br[2] <= 0.3) return null;

    let { u0, v0, u1, v1 } = uv;
    if (cosAngle < 0) {
        // Mirror when showing back face
        const tmp = u0;
        u0 = u1;
        u1 = tmp;
    }

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

export class Coin {
    constructor(gridX = 0, gridY = 0, gridZ = 0) {
        this.gridX = gridX;
        this.gridY = gridY;
        this.gridZ = gridZ;

        this.x = gridX * TILE_SIZE + TILE_SIZE / 2;
        this.baseY = gridY * TILE_SIZE + 0.15;
        this.y = this.baseY;
        this.z = gridZ * TILE_SIZE + TILE_SIZE / 2;

        this.width = 0.35;
        this.height = 0.35;
        this.animTime = 0;
        this.rotationSpeed = 3.5;
        this.active = true;
    }

    setPosition(gridX, gridY, gridZ) {
        this.gridX = gridX;
        this.gridY = gridY;
        this.gridZ = gridZ;

        this.x = gridX * TILE_SIZE + TILE_SIZE / 2;
        this.baseY = gridY * TILE_SIZE + 0.15;
        this.y = this.baseY;
        this.z = gridZ * TILE_SIZE + TILE_SIZE / 2;
        this.active = true;
    }

    update(dt) {
        if (!this.active) return;
        this.animTime += dt;
        // Sväva mjukt upp och ner
        this.y = this.baseY + Math.sin(this.animTime * 3.0) * 0.08;
    }

    render(renderer) {
        if (!this.active) return;
        const angle = this.animTime * this.rotationSpeed;
        const tri = projectRotatingBillboard(this.x, this.y, this.z, renderer.camera, this.width, this.height, COIN_UV, angle);
        if (tri) renderer.addObjectToRender(tri.vertices, tri.depth);
    }

    checkCollision(player) {
        if (!this.active) return false;
        const dx = player.x - this.x;
        const dz = player.z - this.z;
        const distHoriz = Math.hypot(dx, dz);
        const distVert = Math.abs((player.y + player.height / 2) - (this.y + this.height / 2));

        return distHoriz < 0.32 && distVert < 0.45;
    }
}

export const coin = new Coin(0, 5, 0);
export default coin;
