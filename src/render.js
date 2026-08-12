import { gameObjects } from './gameObjects.js';

export function render(renderer) {
    gameObjects.forEach(obj => {
        if (typeof obj.render === 'function') {
            obj.render(renderer);
        }
    });
}
