import { update as inputUpdate } from './input.js';
import { gameObjects } from './gameObjects.js';
import { updatePhysics } from './physics.js';
import { player } from './player.js';
import { camera } from './camera.js';

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

export function update(dt) {
    inputUpdate(); // sätter fortfarande player.vx/vz baserat på WASD, camera.rotate baserat på mus

    updatePhysics(player, dt);
    // console.log(player.vx, player.vz, player.x, player.z)

    gameObjects.forEach(obj => {
        if (typeof obj.update === 'function') obj.update(dt);
    });

    camera.followTarget(player);
}