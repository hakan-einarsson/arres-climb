import { gameObjects } from './gameObjects.js';

export function init() {
    gameObjects.forEach(obj => {
        if (typeof obj.init === 'function') {
            obj.init();
        }
    });
}