import { gameObjects } from './gameObjects.js';
import { levelManager } from './levelManager.js';

export function init() {
    levelManager.loadLevel(0);
    gameObjects.forEach(obj => {
        if (typeof obj.init === 'function') {
            obj.init();
        }
    });
}