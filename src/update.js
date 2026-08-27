import { update as inputUpdate } from './input.js';
import { gameObjects } from './gameObjects.js';
import { updatePhysics } from './physics.js';
import { player } from './player.js';
import { camera } from './camera.js';
import { levelManager } from './levelManager.js';

export function rotateY(x, z, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return [x * cos - z * sin, x * sin + z * cos];
}

export function update(dt) {
    if (levelManager.isVictory) {
        player.vx = 0;
        player.vz = 0;
        camera.yaw += dt * 0.25;
        camera.pitch = Math.min(0.55, camera.pitch + dt * 0.05);
    } else {
        inputUpdate(dt);
    }

    updatePhysics(player, dt);

    gameObjects.forEach(obj => {
        if (typeof obj.update === 'function') obj.update(dt);
    });

    levelManager.update(dt);

    camera.update(dt);
    camera.followTarget(player);
}