import { projectBillboard, projectGroundQuad } from './projection.js';
import { TILE_SIZE, getUV } from './tile.js';
import { getGroundY } from './player.js';

const COIN_UV = {
    u0: 16 / 128 + 0.5 / 128,
    v0: 16 / 32 + 0.5 / 32,
    u1: 32 / 128 - 0.5 / 128,
    v1: 32 / 32 - 0.5 / 32,
};
const SHADOW_UV = getUV(10, 0);

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
        this.y = this.baseY + Math.sin(this.animTime * 3.0) * 0.08;
    }

    render(renderer) {
        if (!this.active) return;

        // Ground drop shadow
        const groundY = getGroundY(this.x, this.z, this.y);
        if (groundY > -5) {
            const diff = Math.max(0, this.y - groundY);
            const size = Math.max(0.12, 0.26 - diff * 0.03);
            const quad = projectGroundQuad(this.x, groundY + 0.002, this.z, renderer.camera, size, SHADOW_UV, 1.0);
            if (quad) renderer.addObjectToRender(quad);
        }

        const scaleX = Math.cos(this.animTime * this.rotationSpeed);
        const tri = projectBillboard(this.x, this.y, this.z, renderer.camera, this.width, this.height, COIN_UV, scaleX, false, 1.05);
        if (tri) renderer.addObjectToRender(tri.vertices);
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
