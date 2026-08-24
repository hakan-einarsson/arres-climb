import { projectBillboard } from './projection.js';
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
        const scaleX = Math.cos(this.animTime * this.rotationSpeed);
        const tri = projectBillboard(this.x, this.y, this.z, renderer.camera, this.width, this.height, COIN_UV, scaleX);
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
