import { camera } from './camera.js';
import { player } from './player.js';
import { TILE_SIZE } from './tile.js';
import Tile from './tile.js';

export function getTargetCell(player, camera, verticalOffset = 0) {
    let aimX = player.aimX;
    let aimZ = player.aimZ;

    if (aimX === undefined || aimZ === undefined || (aimX === 0 && aimZ === 0)) {
        aimX = -Math.sin(camera.yaw);
        aimZ = Math.cos(camera.yaw);
    }

    const threshold = 0.38;
    let stepX = Math.abs(aimX) >= threshold ? Math.sign(aimX) : 0;
    let stepZ = Math.abs(aimZ) >= threshold ? Math.sign(aimZ) : 0;

    if (stepX === 0 && stepZ === 0) {
        stepZ = 1;
    }

    const playerGridX = Math.floor(player.x / TILE_SIZE);
    const playerGridZ = Math.floor(player.z / TILE_SIZE);

    const gridX = playerGridX + stepX;
    const gridZ = playerGridZ + stepZ;
    const gridY = Math.floor(player.y / TILE_SIZE) + verticalOffset;

    return { gridX, gridY, gridZ };
}

class PointerMarker extends Tile {
    constructor(x = 0, y = 0, z = 0, type = 'POINTER') {
        super(x, y, z, type);
        this.verticalOffset = 0;
    }

    update(dt) {
        this.cachedBlock = null;
        const targetCell = getTargetCell(player, camera, this.verticalOffset);
        this.gridX = targetCell.gridX;
        this.gridY = targetCell.gridY;
        this.gridZ = targetCell.gridZ;
    }
}

export default PointerMarker;