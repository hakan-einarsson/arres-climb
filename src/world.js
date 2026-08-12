import Tile from './tile.js';
import { addGameObject } from './gameObjects.js';

const tileTypes = {
    0: 'HOLE',
    1: 'GRASS',
    2: 'ROCK',
};

class World {
    constructor(size = 64, holeChance = 0.1, maxHeight = 4) {
        this.size = size;
        this.holeChance = holeChance;
        this.maxHeight = maxHeight;
        this.heightMap = new Map();
    }

    init() {
        // Generate random heights for each (x, z) column
        for (let z = 0; z < this.size; z++) {
            for (let x = 0; x < this.size; x++) {
                const height = Math.floor(Math.random() * this.maxHeight) + 1;
                this.heightMap.set(`${x},${z}`, height);
            }
        }

        // Create blocks at each (x, y, z) position
        for (let z = 0; z < this.size; z++) {
            for (let x = 0; x < this.size; x++) {
                const height = this.heightMap.get(`${x},${z}`);
                for (let y = 0; y < height; y++) {
                    const type = Math.random() < this.holeChance ? tileTypes[0] : (Math.random() < 0.5 ? tileTypes[1] : tileTypes[2]);
                    const tile = new Tile(x - this.size / 2, y, z - this.size / 2, type);
                    addGameObject(tile);
                }
            }
        }
    }
}

export default World;

