import { gameObjects } from './gameObjects.js';
import { world } from './world.js';
import { player } from './player.js';
import { TILE_SIZE } from './tile.js';

export function init() {
    world.createWorld(0, 0);
    player.x = -world.chunkRadius * TILE_SIZE + TILE_SIZE / 2;
    player.z = -world.chunkRadius * TILE_SIZE + TILE_SIZE / 2;
    player.y = world.getHeightAt(-world.chunkRadius, -world.chunkRadius) * TILE_SIZE + 1.5; // starta spelaren lite ovanför marken
    gameObjects.forEach(obj => {
        if (typeof obj.init === 'function') {
            obj.init();
        }
    });
}