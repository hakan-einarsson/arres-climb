import Tile from './tile.js';
import { addGameObject } from './gameObjects.js';

const tileTypes = {
    0: 'HOLE',
    1: 'GRASS',
    2: 'ROCK',
};

class World {
    constructor(size = 32, holeChance = 0.1, space = 0.1) {
        this.size = size;
        this.holeChance = holeChance;
        this.space = space;
    }

    init() {
        for (let z = 0; z < this.size; z++) {
            for (let x = 0; x < this.size; x++) {
                // type shoujld be 0, 1, or 2
                const type = Math.random() < this.holeChance ? tileTypes[0] : (Math.random() < 0.5 ? tileTypes[1] : tileTypes[2]);
                const tile = new Tile(x - this.size / 2, z - this.size / 2, type, this.space);
                addGameObject(tile);
            }
        }
    }
}

export default World;

