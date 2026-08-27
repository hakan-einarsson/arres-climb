import Tile, { TILE_SIZE } from './tile.js';
import MovingBlock from './movingBlock.js';
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
        this.loadedColumns = new Map();
        this.movingBlocks = [];
    }

    applyLevelConfig(config) {
        if (Array.isArray(config)) {
            this.seed = config[0];
            this.chunkRadius = config[1];
            this.maxHeight = config[2];
            this.islandFactor = config[3];
            this.scale = config[4];
            this.threshold = config[5];
            const h = config[6];
            this.heightTypeMap = { grassMax: h[0], rockMax: h[1], snowMax: h[2] };
        } else if (config) {
            if (typeof config.seed === 'number') this.seed = config.seed;
            if (typeof config.size === 'number') this.chunkRadius = config.size;
            if (typeof config.maxHeight === 'number') this.maxHeight = config.maxHeight;
            if (typeof config.islandFactor === 'number') this.islandFactor = config.islandFactor;
            if (typeof config.scale === 'number') this.scale = config.scale;
            if (typeof config.threshold === 'number') this.threshold = config.threshold;
            if (Array.isArray(config.heightTypeMap)) {
                this.heightTypeMap = { grassMax: config.heightTypeMap[0], rockMax: config.heightTypeMap[1], snowMax: config.heightTypeMap[2] };
            } else if (config.heightTypeMap && typeof config.heightTypeMap === 'object') {
                this.heightTypeMap = { ...this.heightTypeMap, ...config.heightTypeMap };
            }
        }
        this.perm = generatePermTable(this.seed);
    }

    removeTileAt(x, y, z) {
        const idx = gameObjects.findIndex(obj => (obj instanceof Tile || obj instanceof MovingBlock) && obj.gridX === x && obj.gridY === y && obj.gridZ === z);
        if (idx !== -1) {
            const obj = gameObjects[idx];
            removeGameObject(obj);
            const col = this.loadedColumns.get(`${x},${z}`);
            if (col) {
                const ci = col.indexOf(obj);
                if (ci !== -1) col.splice(ci, 1);
            }
            const mi = this.movingBlocks.indexOf(obj);
            if (mi !== -1) this.movingBlocks.splice(mi, 1);
        }
    }

    applyModifications(modifications) {
        if (!Array.isArray(modifications)) return;

        for (const mod of modifications) {
            let x, y, z, action, type, dist;
            if (Array.isArray(mod)) {
                [x, y, z] = mod;
                if (mod[3] === 0 || mod[3] === 'remove') action = 'remove';
                else { action = 'add'; type = mod[3]; dist = mod[4]; }
            } else {
                ({ x, y, z, action, type, dist } = mod);
            }

            this.removeTileAt(x, y, z);

            if (action === 'add') {
                const colKey = `${x},${z}`;
                if (type === 5 || type === 6 || type === 'MOVING_X' || type === 'MOVING_Z' || type === 'MOVING' || type === 'MX' || type === 'MZ') {
                    const mb = new MovingBlock(x, y, z, (type === 6 || type === 'MOVING_Z' || type === 'MZ') ? 'z' : 'x', dist !== undefined ? dist : 3);
                    addGameObject(mb);
                    this.movingBlocks.push(mb);
                } else {
                    const tile = new Tile(x, y, z, type || 1);
                    addGameObject(tile);
                    if (!this.loadedColumns.has(colKey)) this.loadedColumns.set(colKey, []);
                    this.loadedColumns.get(colKey).push(tile);
                }
            }
        }
    }

    clearWorld() {
        for (const tiles of this.loadedColumns.values()) {
            for (const tile of tiles) removeGameObject(tile);
        }
        this.loadedColumns.clear();

        for (const mb of this.movingBlocks) removeGameObject(mb);
        this.movingBlocks = [];
    }

    getHeightAt(x, z) {
        const n = perlin(x * this.scale, z * this.scale, this.perm);
        const normalized = (n + 0.7) / 1.4;

        const dist = Math.sqrt(x * x + z * z) / this.chunkRadius;
        const falloff = Math.max(0, 1 - Math.pow(dist, this.islandFactor));
        const combined = normalized * falloff;

        if (combined < this.threshold) return 0;

        const normalizedHeight = (combined - this.threshold) / (1.0 - this.threshold);
        return Math.floor(Math.pow(normalizedHeight, 1.2) * this.maxHeight) + 1;
    }

    getBlockTypeForHeight(h) {
        if (h <= this.heightTypeMap.grassMax) return 1;
        if (h <= this.heightTypeMap.rockMax) return 2;
        if (h <= this.heightTypeMap.snowMax) return 3;
        return 3;
    }

    loadColumn(x, z, y = null) {
        const key = `${x},${z}`;
        if (this.loadedColumns.has(key)) return;
        if (y === null) y = this.getHeightAt(x, z);
        if (y <= 0) return;

        const tile = new Tile(x, y - 1, z, this.getBlockTypeForHeight(y));
        addGameObject(tile);
        this.loadedColumns.set(key, [tile]);
    }

    createWorld(x = 0, z = 0) {
        this.loadedColumns = new Map();
        for (let dz = -this.chunkRadius; dz <= this.chunkRadius; dz++) {
            for (let dx = -this.chunkRadius; dx <= this.chunkRadius; dx++) {
                this.loadColumn(x + dx, z + dz);
            }
        }
    }

    getSpawnPosition() {
        for (let r = 0; r <= this.chunkRadius; r++) {
            for (let dz = -r; dz <= r; dz++) {
                for (let dx = -r; dx <= r; dx++) {
                    if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue;
                    const h = this.getHeightAt(dx, dz);
                    if (h > 0) return { x: dx, y: h, z: dz };
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
