import { update as inputUpdate } from './input.js';
import { gameObjects } from './gameObjects.js';
// import { camera } from './camera.js';

function rotateY(x, z, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return [x * cos - z * sin, x * sin + z * cos];
}

export function update(dt) {
    inputUpdate(dt);
    gameObjects.forEach(obj => {
        if (typeof obj.update === 'function') {
            obj.update(dt);
        }
    });

}