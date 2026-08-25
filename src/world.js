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
        this.loadedColumns = new Map(); // "x,z" -> array av Tile-instanser för den kolumnen
        this.movingBlocks = [];
    }

    applyLevelConfig(config) {
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
        this.perm = generatePermTable(this.seed);
    }

    applyModifications(modifications) {
        if (!Array.isArray(modifications)) return;

        for (const mod of modifications) {
            let x, y, z, action, type, dist;
            if (Array.isArray(mod)) {
                [x, y, z] = mod;
                if (mod[3] === 0 || mod[3] === 'remove') {
                    action = 'remove';
                } else {
                    action = 'add';
                    type = mod[3];
                    dist = mod[4];
                }
            } else {
                ({ x, y, z, action, type, dist } = mod);
            }
            const colKey = `${x},${z}`;

            if (action === 'remove') {
                const tileIndex = gameObjects.findIndex(
                    obj => (obj instanceof Tile || obj instanceof MovingBlock) &&
                           obj.gridX === x && obj.gridY === y && obj.gridZ === z
                );
                if (tileIndex !== -1) {
                    const obj = gameObjects[tileIndex];
                    removeGameObject(obj);
                    const col = this.loadedColumns.get(colKey);
                    if (col) {
                        const idx = col.indexOf(obj);
                        if (idx !== -1) col.splice(idx, 1);
                    }
                    const mIdx = this.movingBlocks.indexOf(obj);
                    if (mIdx !== -1) this.movingBlocks.splice(mIdx, 1);
                }
            } else if (action === 'add') {
                // Ta först bort eventuellt existerande block på samma position så det inte dubbleras/döljs
                const oldIndex = gameObjects.findIndex(
                    obj => (obj instanceof Tile || obj instanceof MovingBlock) &&
                           obj.gridX === x && obj.gridY === y && obj.gridZ === z
                );
                if (oldIndex !== -1) {
                    const oldObj = gameObjects[oldIndex];
                    removeGameObject(oldObj);
                    const col = this.loadedColumns.get(colKey);
                    if (col) {
                        const idx = col.indexOf(oldObj);
                        if (idx !== -1) col.splice(idx, 1);
                    }
                    const mIdx = this.movingBlocks.indexOf(oldObj);
                    if (mIdx !== -1) this.movingBlocks.splice(mIdx, 1);
                }

                if (type === 'MOVING_X' || type === 'MOVING_Z' || type === 'MOVING') {
                    const axis = type === 'MOVING_Z' ? 'z' : 'x';
                    const maxDist = dist !== undefined ? dist : 3;
                    const movingBlock = new MovingBlock(x, y, z, axis, maxDist);
                    addGameObject(movingBlock);
                    this.movingBlocks.push(movingBlock);
                } else {
                    const tile = new Tile(x, y, z, type || 'GRASS');
                    addGameObject(tile);
                    if (!this.loadedColumns.has(colKey)) {
                        this.loadedColumns.set(colKey, []);
                    }
                    this.loadedColumns.get(colKey).push(tile);
                }
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

        for (const mb of this.movingBlocks) {
            removeGameObject(mb);
        }
        this.movingBlocks = [];
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
        return 'CLOUD';
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
