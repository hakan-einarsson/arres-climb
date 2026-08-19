import { update as inputUpdate } from './input.js';
import { gameObjects } from './gameObjects.js';
import { updatePhysics } from './physics.js';
import { player } from './player.js';
import { world } from './world.js';
import { camera } from './camera.js';
import { TILE_SIZE } from './tile.js';

export function rotateY(x, z, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return [x * cos - z * sin, x * sin + z * cos];
}

// export function update(dt) {
//     inputUpdate(dt);
//     gameObjects.forEach(obj => {
//         if (typeof obj.update === 'function') {
//             obj.update(dt);
//         }
//     });

// }

let lastPlayerGridX = null, lastPlayerGridZ = null;

export function update(dt) {
    inputUpdate(dt); // sätter fortfarande player.vx/vz baserat på WASD, camera.rotate baserat på mus

    updatePhysics(player, dt);

    gameObjects.forEach(obj => {
        if (typeof obj.update === 'function') obj.update(dt);
    });
    camera.update(dt); // uppdatera kamerans position baserat på spelarens position och rotation
    camera.followTarget(player);
}

function checkChunkUpdate(world, player) {
    const gridX = Math.floor(player.x / TILE_SIZE);
    const gridZ = Math.floor(player.z / TILE_SIZE);

    if (gridX !== lastPlayerGridX || gridZ !== lastPlayerGridZ) {
        world.update(gridX, gridZ);
        lastPlayerGridX = gridX;
        lastPlayerGridZ = gridZ;
    }
}