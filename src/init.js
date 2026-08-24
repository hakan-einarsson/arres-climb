import { gameObjects } from './gameObjects.js';
import { world } from './world.js';
import { player } from './player.js';
import { TILE_SIZE } from './tile.js';

export function init() {
    world.createWorld(0, 0);
    const spawn = world.getSpawnPosition();
    player.x = spawn.x * TILE_SIZE + TILE_SIZE / 2;
    player.z = spawn.z * TILE_SIZE + TILE_SIZE / 2;
    player.y = spawn.y * TILE_SIZE + 0.5;
    gameObjects.forEach(obj => {
        if (typeof obj.init === 'function') {
            obj.init();
        }
    });
}