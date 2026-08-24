import Tile from './tile.js';
import { addGameObject, removeGameObject } from './gameObjects.js';
import perlin from './perlin.js';
import generatePermTable from './permTable.js';

const TEXTURE_TO_HEIGHT_MAP = {
    GRASS: 3,
    ROCK: 6,
    SNOW: 8,
};

// world.js
class World {
    constructor(chunkRadius = 6, maxHeight = 15, seed = 2, scale = 0.45) {
        this.chunkRadius = chunkRadius; // hur många kolumner ut från spelaren som ska existera
        this.maxHeight = maxHeight;
        this.seed = seed;
        this.scale = scale;
        this.perm = generatePermTable(seed);
        this.loadedColumns = new Map(); // "x,z" -> array av Tile-instanser för den kolumnen
    }

    getHeightAt(x, z) {
        const n = perlin(x * this.scale, z * this.scale, this.perm);
        const normalized = (n + 0.7) / 1.4;

        const island = this.getIslandFactor(x, z); // world-koordinater direkt, ingen centrering
        const combined = normalized * island;

        return Math.max(1, Math.floor(combined * this.maxHeight) + 1);

    }

    getIslandFactor(x, z) {
        const dist = Math.sqrt(x * x + z * z) / this.chunkRadius; // avstånd från world-origo, normaliserat mot radien
        const falloff = Math.max(0, 1 - Math.pow(dist, 4));
        return falloff;
    }

    // loadColumn(x, z) {
    //     const key = `${x},${z}`;
    //     if (this.loadedColumns.has(key)) return;

    //     const height = this.getHeightAt(x, z);
    //     const tiles = [];
    //     for (let y = 0; y < height; y++) {
    //         const type = height > 6 ? 'SNOW' : height < 5 ? 'GRASS' : 'ROCK'; // enklare typval för nu
    //         // const type = Math.random() < 0.5 ? 'GRASS' : 'ROCK'; // enklare typval för nu
    //         console.log('generating tile at', x, y, z, 'of type', type);
    //         const tile = new Tile(x, y, z, type);
    //         addGameObject(tile);
    //         tiles.push(tile);
    //     }
    //     this.loadedColumns.set(key, tiles);
    // }
    // world.js, i din load/generate-logik
    loadColumn(x, z, y = null) {
        const key = `${x},${z}`;
        if (this.loadedColumns.has(key)) return;
        if (!y) {
            y = this.getHeightAt(x, z);
        }
        const height = y;
        // if (height % 2 !== 0 && height !== 1) return; // inga tiles att generera
        // Skapa BARA den översta tilen - resten är begravda och osynliga ändå
        const type = height > 6 ? 'SNOW' : height < 5 ? 'GRASS' : 'ROCK'; // enklare typval för nu
        const tile = new Tile(x, height - 1, z, type);
        addGameObject(tile);

        this.loadedColumns.set(key, [tile]); // bara en tile att spåra/ta bort per kolumn nu
    }

    unloadColumn(x, z) {
        const key = `${x},${z}`;
        const tiles = this.loadedColumns.get(key);
        if (!tiles) return;

        for (const tile of tiles) removeGameObject(tile);
        this.loadedColumns.delete(key);
    }

    createWorld(x, z) {
        console.log(x, z);
        this.loadedColumns = new Map();
        const needed = new Set();

        for (let dz = -this.chunkRadius; dz <= this.chunkRadius; dz++) {
            for (let dx = -this.chunkRadius; dx <= this.chunkRadius; dx++) {
                const colX = x + dx;
                const colZ = z + dz;
                needed.add(`${colX},${colZ}`);
                this.loadColumn(colX, colZ);
            }
        }

        // Ta bort kolumner som inte längre behövs
        // for (const key of this.loadedColumns.keys()) {
        //     if (!needed.has(key)) {
        //         const [x, z] = key.split(',').map(Number);
        //         this.unloadColumn(x, z);
        //     }
        // }
    }
}
export default World;

export const world = new World();

