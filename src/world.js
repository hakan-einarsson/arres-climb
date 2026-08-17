import Tile from './tile.js';
import { addGameObject } from './gameObjects.js';
import perlin from './perlin.js';
import generatePermTable from './permTable.js';

const TEXTURE_TO_HEIGHT_MAP = {
    GRASS: 5,
    ROCK: 10,
    SNOW: 15,
};

class World {
    constructor(size = 32, maxHeight = 20, seed = 1337, scale = 0.05) {
        this.size = size;
        this.maxHeight = maxHeight;
        this.seed = seed;
        this.scale = scale;
        this.heightMap = new Map();
    }

    init() {
        const perm = generatePermTable(this.seed);

        for (let z = 0; z < this.size; z++) {
            for (let x = 0; x < this.size; x++) {
                const n = perlin(x * this.scale, z * this.scale, perm); // ungefär -0.7 till 0.7
                const normalized = (n + 0.7) / 1.4; // pressa in i 0-1
                const height = Math.max(1, Math.floor(normalized * this.maxHeight) + 1);
                this.heightMap.set(`${x},${z}`, height);
            }
        }

        for (let z = 0; z < this.size; z++) {
            for (let x = 0; x < this.size; x++) {
                const height = this.heightMap.get(`${x},${z}`);
                for (let y = 0; y < height; y++) {
                    // const type = Math.random() < 0.5 ? 'GRASS' : 'ROCK';
                    const type = Object.keys(TEXTURE_TO_HEIGHT_MAP).find(key => TEXTURE_TO_HEIGHT_MAP[key] >= y * (this.maxHeight / 40)) || 'GRASS';
                    addGameObject(new Tile(x - this.size / 2, y, z - this.size / 2, type));
                }
            }
        }
    }
}
export default World;

// const tileTypes = {
//     0: 'HOLE',
//     1: 'GRASS',
//     2: 'ROCK',
//     3: 'SNOW',
//     4: 'RAINBOW',
// };

// class World {
//     constructor(size = 64, holeChance = 0.1, maxHeight = 2) {
//         this.size = size;
//         this.holeChance = holeChance;
//         this.maxHeight = maxHeight;
//         this.heightMap = new Map();
//     }

//     init() {
//         // Generate random heights for each (x, z) column
//         for (let z = 0; z < this.size; z++) {
//             for (let x = 0; x < this.size; x++) {
//                 const height = Math.floor(Math.random() * this.maxHeight) + 1;
//                 this.heightMap.set(`${x},${z}`, height);
//             }
//         }

//         // Create blocks at each (x, y, z) position
//         for (let z = 0; z < this.size; z++) {
//             for (let x = 0; x < this.size; x++) {
//                 const height = this.heightMap.get(`${x},${z}`);
//                 for (let y = 0; y < height; y++) {
//                     const rand = Math.random();
//                     const type = rand < this.holeChance ? tileTypes[2] : (Math.random() < 0.5 ? tileTypes[1] : tileTypes[3]);
//                     const tile = new Tile(x - this.size / 2, y, z - this.size / 2, type);
//                     addGameObject(tile);
//                 }
//             }
//         }
//     }
// }

// export default World;

