import { gameObjects } from './gameObjects.js';
import { levelManager } from './levelManager.js';

export function render(renderer) {
    gameObjects.forEach(obj => {
        if (typeof obj.render === 'function') {
            obj.render(renderer);
        }
    });
    levelManager.render(renderer);
}
