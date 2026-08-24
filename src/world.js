import Tile from './tile.js';
import { addGameObject, removeGameObject } from './gameObjects.js';
import perlin from './perlin.js';
import generatePermTable from './permTable.js';

class World {
    constructor(chunkRadius = 6, maxHeight = 12, seed = 2, scale = 0.45) {
        this.chunkRadius = chunkRadius; // hur många kolumner ut från origo som ska existera
        this.maxHeight = maxHeight;
        this.seed = seed;
        this.scale = scale;
        this.perm = generatePermTable(seed);
        this.loadedColumns = new Map(); // "x,z" -> array av Tile-instanser för den kolumnen
    }

    getHeightAt(x, z) {
        const n = perlin(x * this.scale, z * this.scale, this.perm);
        const normalized = (n + 0.7) / 1.4;

        const island = this.getIslandFactor(x, z);
        const combined = normalized * island;

        const threshold = 0; // tröskel under vilken inga block skapas (hål/kanter)
        if (combined < threshold) {
            return 0;
        }

        const normalizedHeight = (combined - threshold) / (1.0 - threshold);
        return Math.floor(Math.pow(normalizedHeight, 1.2) * this.maxHeight) + 1;
    }

    getIslandFactor(x, z) {
        const dist = Math.sqrt(x * x + z * z) / this.chunkRadius; // avstånd från world-origo, normaliserat mot radien
        const falloff = Math.max(0, 1 - Math.pow(dist, 3));
        return falloff;
    }

    loadColumn(x, z, y = null) {
        const key = `${x},${z}`;
        if (this.loadedColumns.has(key)) return;
        if (y === null) {
            y = this.getHeightAt(x, z);
        }
        if (y <= 0) return; // Inga block genereras i tomma/vatten-celler

        const height = y;
        const type = height > 7 ? 'SNOW' : height < 4 ? 'GRASS' : 'ROCK';
        const tile = new Tile(x, height - 1, z, type);
        addGameObject(tile);

        this.loadedColumns.set(key, [tile]);
    }

    unloadColumn(x, z) {
        const key = `${x},${z}`;
        const tiles = this.loadedColumns.get(key);
        if (!tiles) return;

        for (const tile of tiles) removeGameObject(tile);
        this.loadedColumns.delete(key);
    }

    createWorld(x = 0, z = 0) {
        this.loadedColumns = new Map();

        for (let dz = -this.chunkRadius; dz <= this.chunkRadius; dz++) {
            for (let dx = -this.chunkRadius; dx <= this.chunkRadius; dx++) {
                const colX = x + dx;
                const colZ = z + dz;
                this.loadColumn(colX, colZ);
            }
        }
    }

    getSpawnPosition() {
        for (let r = 0; r <= this.chunkRadius; r++) {
            for (let dz = -r; dz <= r; dz++) {
                for (let dx = -r; dx <= r; dx++) {
                    if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue;
                    const h = this.getHeightAt(dx, dz);
                    if (h > 0) {
                        return { x: dx, y: h, z: dz };
                    }
                }
            }
        }
        return { x: 0, y: 1, z: 0 };
    }
}
export default World;

export const world = new World();

