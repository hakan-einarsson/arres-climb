import Tile, { TILE_SIZE } from './tile.js';
import { addGameObject, removeGameObject, gameObjects } from './gameObjects.js';
import perlin from './perlin.js';
import generatePermTable from './permTable.js';

class World {
    constructor(chunkRadius = 6, maxHeight = 12, seed = 2, scale = 0.45) {
        this.chunkRadius = chunkRadius;
        this.maxHeight = maxHeight;
        this.seed = seed;
        this.scale = scale;
        this.islandFactor = 3.0;
        this.threshold = 0.22;
        this.heightTypeMap = { grassMax: 3, rockMax: 7, snowMax: 12 };
        this.perm = generatePermTable(seed);
        this.loadedColumns = new Map(); // "x,z" -> array av Tile-instanser för den kolumnen
    }

    applyLevelConfig(config) {
        if (typeof config.seed === 'number') this.seed = config.seed;
        if (typeof config.size === 'number') this.chunkRadius = config.size;
        if (typeof config.maxHeight === 'number') this.maxHeight = config.maxHeight;
        if (typeof config.islandFactor === 'number') this.islandFactor = config.islandFactor;
        if (typeof config.scale === 'number') this.scale = config.scale;
        if (typeof config.threshold === 'number') this.threshold = config.threshold;
        if (config.heightTypeMap && typeof config.heightTypeMap === 'object') {
            this.heightTypeMap = { ...this.heightTypeMap, ...config.heightTypeMap };
        }
        this.perm = generatePermTable(this.seed);
    }

    applyModifications(modifications) {
        if (!Array.isArray(modifications)) return;

        for (const mod of modifications) {
            const { x, y, z, action, type } = mod;
            const colKey = `${x},${z}`;

            if (action === 'remove') {
                const tileIndex = gameObjects.findIndex(
                    obj => obj instanceof Tile && obj.gridX === x && obj.gridY === y && obj.gridZ === z
                );
                if (tileIndex !== -1) {
                    const tile = gameObjects[tileIndex];
                    removeGameObject(tile);
                    const col = this.loadedColumns.get(colKey);
                    if (col) {
                        const idx = col.indexOf(tile);
                        if (idx !== -1) col.splice(idx, 1);
                    }
                }
            } else if (action === 'add') {
                const tile = new Tile(x, y, z, type || 'GRASS');
                addGameObject(tile);
                if (!this.loadedColumns.has(colKey)) {
                    this.loadedColumns.set(colKey, []);
                }
                this.loadedColumns.get(colKey).push(tile);
            }
        }
    }

    clearWorld() {
        for (const tiles of this.loadedColumns.values()) {
            for (const tile of tiles) {
                removeGameObject(tile);
            }
        }
        this.loadedColumns.clear();
    }

    getHeightAt(x, z) {
        const n = perlin(x * this.scale, z * this.scale, this.perm);
        const normalized = (n + 0.7) / 1.4;

        const dist = Math.sqrt(x * x + z * z) / this.chunkRadius;
        const falloff = Math.max(0, 1 - Math.pow(dist, this.islandFactor));
        const combined = normalized * falloff;

        if (combined < this.threshold) {
            return 0;
        }

        const normalizedHeight = (combined - this.threshold) / (1.0 - this.threshold);
        return Math.floor(Math.pow(normalizedHeight, 1.2) * this.maxHeight) + 1;
    }

    getBlockTypeForHeight(h) {
        if (h <= this.heightTypeMap.grassMax) return 'GRASS';
        if (h <= this.heightTypeMap.rockMax) return 'ROCK';
        if (h <= this.heightTypeMap.snowMax) return 'SNOW';
        return 'RAINBOW';
    }

    loadColumn(x, z, y = null) {
        const key = `${x},${z}`;
        if (this.loadedColumns.has(key)) return;
        if (y === null) {
            y = this.getHeightAt(x, z);
        }
        if (y <= 0) return; // Inga block genereras i tomma/vatten-celler

        const height = y;
        const type = this.getBlockTypeForHeight(height);
        const tile = new Tile(x, height - 1, z, type);
        addGameObject(tile);

        this.loadedColumns.set(key, [tile]);
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

    getGoalPosition() {
        let maxH = 0;
        let goalPos = { x: 0, y: 1, z: 0 };

        for (let dz = -this.chunkRadius; dz <= this.chunkRadius; dz++) {
            for (let dx = -this.chunkRadius; dx <= this.chunkRadius; dx++) {
                const h = this.getHeightAt(dx, dz);
                if (h > maxH) {
                    maxH = h;
                    goalPos = { x: dx, y: h, z: dz };
                }
            }
        }
        return goalPos;
    }
}
export default World;

export const world = new World();
