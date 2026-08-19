import { camera } from './camera.js';
import { player } from './player.js';
import { TILE_SIZE } from './tile.js';
import Tile from './tile.js';

class PointerMarker extends Tile {
    constructor(x = 0, y = 0, z = 0, type = 'POINTER') {
        super(x, y, z, type);
    }
    update(dt) {
        this.cachedBlock = null;
        const targetCell = getTargetCell(player, camera);
        this.gridX = targetCell.gridX;
        this.gridY = targetCell.gridY;
        this.gridZ = targetCell.gridZ;
    }
}

function getTargetCell(player, camera) {
    const dirX = Math.sin(camera.yaw);
    const dirZ = Math.cos(camera.yaw);

    const targetX = player.x + -dirX * TILE_SIZE; // en tile-bredd framåt
    const targetZ = player.z + dirZ * TILE_SIZE;

    const gridX = Math.floor(targetX / TILE_SIZE);
    const gridZ = Math.floor(targetZ / TILE_SIZE);
    const gridY = Math.floor(player.y / TILE_SIZE); // samma höjdnivå spelaren står på

    return { gridX, gridY, gridZ };
}

export default PointerMarker