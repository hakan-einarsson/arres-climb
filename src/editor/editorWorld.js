import Tile, { TILE_SIZE } from '../tile.js';
import perlin from '../perlin.js';
import generatePermTable from '../permTable.js';

export class EditorWorld {
    constructor() {
        this.seed = 2;
        this.chunkRadius = 6;
        this.maxHeight = 12;
        this.islandFactor = 3.0;
        this.scale = 0.45;
        this.threshold = 0.22;

        this.heightTypeMap = {
            grassMax: 3,
            rockMax: 7,
            snowMax: 12,
        };

        this.spawn = null;
        this.goal = null;
        this.activeLayer = 0;

        this.perm = generatePermTable(this.seed);
        this.baseBlocks = new Map();
        this.activeBlocks = new Map();
        this.modifications = [];

        this.regenerate(false);
    }

    setSeed(seed) {
        this.seed = seed;
        this.perm = generatePermTable(this.seed);
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

    regenerate(keepMods = true) {
        this.perm = generatePermTable(this.seed);
        this.baseBlocks.clear();
        this.activeBlocks.clear();

        // Generate base procedural terrain
        for (let dz = -this.chunkRadius; dz <= this.chunkRadius; dz++) {
            for (let dx = -this.chunkRadius; dx <= this.chunkRadius; dx++) {
                const height = this.getHeightAt(dx, dz);
                if (height > 0) {
                    const y = height - 1;
                    const type = this.getBlockTypeForHeight(height);
                    const key = `${dx},${y},${dz}`;
                    this.baseBlocks.set(key, { gridX: dx, gridY: y, gridZ: dz, type });
                    this.activeBlocks.set(key, new Tile(dx, y, dz, type));
                }
            }
        }

        // Re-apply modifications if requested
        if (keepMods && this.modifications.length > 0) {
            for (const mod of this.modifications) {
                const key = `${mod.x},${mod.y},${mod.z}`;
                if (mod.action === 'remove') {
                    this.activeBlocks.delete(key);
                } else if (mod.action === 'add') {
                    this.activeBlocks.set(key, new Tile(mod.x, mod.y, mod.z, mod.type || 'GRASS'));
                }
            }
        } else if (!keepMods) {
            this.modifications = [];
        }

        // Set default spawn if none exists
        if (!this.spawn) {
            this.spawn = this.calculateDefaultSpawn();
        }

        // Set default goal if none exists
        if (!this.goal) {
            this.goal = this.calculateDefaultGoal();
        }
    }

    calculateDefaultSpawn() {
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

    calculateDefaultGoal() {
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

    getBlockAt(x, y, z) {
        return this.activeBlocks.get(`${x},${y},${z}`) || null;
    }

    isOriginallyGenerated(x, y, z) {
        return this.baseBlocks.has(`${x},${y},${z}`);
    }

    getOriginalGeneratedType(x, y, z) {
        const base = this.baseBlocks.get(`${x},${y},${z}`);
        return base ? base.type : null;
    }

    addBlock(x, y, z, type = 'GRASS', dist = 3) {
        const key = `${x},${y},${z}`;
        const existing = this.activeBlocks.get(key);
        if (existing && existing.type === type) return false;

        const tile = new Tile(x, y, z, type);
        this.activeBlocks.set(key, tile);

        const modIndex = this.modifications.findIndex(m => m.x === x && m.y === y && m.z === z);

        if (this.isOriginallyGenerated(x, y, z) && this.getOriginalGeneratedType(x, y, z) === type) {
            if (modIndex !== -1) this.modifications.splice(modIndex, 1);
        } else {
            const mod = { x, y, z, action: 'add', type };
            if (type.startsWith('MOVING')) {
                mod.dist = dist;
            }
            if (modIndex !== -1) {
                this.modifications[modIndex] = mod;
            } else {
                this.modifications.push(mod);
            }
        }

        return true;
    }

    removeBlock(x, y, z) {
        const key = `${x},${y},${z}`;
        if (!this.activeBlocks.has(key)) return false;

        this.activeBlocks.delete(key);

        const modIndex = this.modifications.findIndex(m => m.x === x && m.y === y && m.z === z);

        if (!this.isOriginallyGenerated(x, y, z)) {
            if (modIndex !== -1) this.modifications.splice(modIndex, 1);
        } else {
            const mod = { x, y, z, action: 'remove' };
            if (modIndex !== -1) {
                this.modifications[modIndex] = mod;
            } else {
                this.modifications.push(mod);
            }
        }

        return true;
    }

    setSpawn(x, y, z) {
        this.spawn = { x, y, z };
    }

    setGoal(x, y, z) {
        this.goal = { x, y, z };
    }

    clearModifications() {
        this.modifications = [];
        this.regenerate(false);
    }

    exportJSON() {
        const typeMap = [
            this.heightTypeMap.grassMax !== undefined ? this.heightTypeMap.grassMax : 3,
            this.heightTypeMap.rockMax !== undefined ? this.heightTypeMap.rockMax : 7,
            this.heightTypeMap.snowMax !== undefined ? this.heightTypeMap.snowMax : 12,
        ];

        const spawnArr = this.spawn ? [this.spawn.x, this.spawn.y, this.spawn.z] : [this.calculateDefaultSpawn().x, this.calculateDefaultSpawn().y, this.calculateDefaultSpawn().z];
        const goalArr = this.goal ? [this.goal.x, this.goal.y, this.goal.z] : [this.calculateDefaultGoal().x, this.calculateDefaultGoal().y, this.calculateDefaultGoal().z];

        const typeToCode = {
            GRASS: 'G', ROCK: 'R', SNOW: 'S', RAINBOW: 'RB',
            MOVING_X: 'MX', MOVING_Z: 'MZ', MOVING: 'MX',
            1: 'G', 2: 'R', 3: 'S', 4: 'RB', 5: 'MX', 6: 'MZ'
        };

        const modsArr = this.modifications.map(m => {
            if (m.action === 'remove') return [m.x, m.y, m.z, 0];
            const code = typeToCode[m.type] || m.type;
            if (code === 'MX' || code === 'MZ' || m.type === 'MOVING_X' || m.type === 'MOVING_Z' || m.type === 'MOVING') {
                return [m.x, m.y, m.z, code, m.dist !== undefined ? m.dist : 3];
            }
            return [m.x, m.y, m.z, code];
        });

        const levelTuple = [
            this.seed,
            this.chunkRadius,
            this.maxHeight,
            this.islandFactor,
            this.scale,
            this.threshold,
            typeMap,
            spawnArr,
            goalArr,
            modsArr
        ];

        return JSON.stringify(levelTuple, null, 2);
    }

    importJSON(jsonString) {
        try {
            let clean = jsonString
                .replace(/\bG\b/g, '1')
                .replace(/\bR\b/g, '2')
                .replace(/\bS\b/g, '3')
                .replace(/\bRB\b/g, '4')
                .replace(/\bMX\b/g, '5')
                .replace(/\bMZ\b/g, '6');

            const data = JSON.parse(clean);

            if (Array.isArray(data)) {
                let arr = data;
                if (typeof arr[0] === 'string') {
                    arr = arr.slice(1);
                }
                const [seed, size, maxHeight, islandFactor, scale, threshold, heightTypeMap, spawn, goal, mods] = arr;

                if (typeof seed === 'number') this.seed = seed;
                if (typeof size === 'number') this.chunkRadius = size;
                if (typeof maxHeight === 'number') this.maxHeight = maxHeight;
                if (typeof islandFactor === 'number') this.islandFactor = islandFactor;
                if (typeof scale === 'number') this.scale = scale;
                if (typeof threshold === 'number') this.threshold = threshold;

                if (Array.isArray(heightTypeMap)) {
                    this.heightTypeMap = {
                        grassMax: heightTypeMap[0] ?? 3,
                        rockMax: heightTypeMap[1] ?? 7,
                        snowMax: heightTypeMap[2] ?? 12
                    };
                }

                if (Array.isArray(spawn)) {
                    this.spawn = { x: spawn[0], y: spawn[1], z: spawn[2] };
                }
                if (Array.isArray(goal)) {
                    this.goal = { x: goal[0], y: goal[1], z: goal[2] };
                }

                if (Array.isArray(mods)) {
                    const codeToType = {
                        1: 'GRASS', 2: 'ROCK', 3: 'SNOW', 4: 'RAINBOW',
                        5: 'MOVING_X', 6: 'MOVING_Z',
                        'G': 'GRASS', 'R': 'ROCK', 'S': 'SNOW', 'RB': 'RAINBOW',
                        'MX': 'MOVING_X', 'MZ': 'MOVING_Z'
                    };

                    this.modifications = mods.map(m => {
                        if (Array.isArray(m)) {
                            const [x, y, z, actionOrType, dist] = m;
                            if (actionOrType === 0 || actionOrType === 'remove') {
                                return { x, y, z, action: 'remove' };
                            }
                            const t = codeToType[actionOrType] || actionOrType || 'GRASS';
                            const res = { x, y, z, action: 'add', type: t };
                            if (dist !== undefined) res.dist = dist;
                            return res;
                        }
                        return m;
                    });
                }
            } else if (typeof data === 'object' && data !== null) {
                if (typeof data.seed === 'number') this.seed = data.seed;
                if (typeof data.size === 'number') this.chunkRadius = data.size;
                if (typeof data.maxHeight === 'number') this.maxHeight = data.maxHeight;
                if (typeof data.islandFactor === 'number') this.islandFactor = data.islandFactor;
                if (typeof data.scale === 'number') this.scale = data.scale;
                if (typeof data.threshold === 'number') this.threshold = data.threshold;
                if (Array.isArray(data.heightTypeMap)) {
                    this.heightTypeMap = {
                        grassMax: data.heightTypeMap[0] ?? 3,
                        rockMax: data.heightTypeMap[1] ?? 7,
                        snowMax: data.heightTypeMap[2] ?? 12
                    };
                } else if (data.heightTypeMap && typeof data.heightTypeMap === 'object') {
                    this.heightTypeMap = { ...this.heightTypeMap, ...data.heightTypeMap };
                }
                if (data.spawn) {
                    this.spawn = Array.isArray(data.spawn) ? { x: data.spawn[0], y: data.spawn[1], z: data.spawn[2] } : { ...data.spawn };
                }
                if (data.goal) {
                    this.goal = Array.isArray(data.goal) ? { x: data.goal[0], y: data.goal[1], z: data.goal[2] } : { ...data.goal };
                }
                if (Array.isArray(data.modifications)) {
                    this.modifications = data.modifications.map(m => {
                        if (Array.isArray(m)) {
                            const [x, y, z, actionOrType, dist] = m;
                            if (actionOrType === 0 || actionOrType === 'remove') return { x, y, z, action: 'remove' };
                            const res = { x, y, z, action: 'add', type: actionOrType };
                            if (dist !== undefined) res.dist = dist;
                            return res;
                        }
                        return m;
                    });
                }
            }

            this.regenerate(true);
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }
}

export const editorWorld = new EditorWorld();
export default editorWorld;
