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
        this.baseBlocks = new Map(); // "x,y,z" -> { gridX, gridY, gridZ, type }
        this.activeBlocks = new Map(); // "x,y,z" -> Tile
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
        return 'RAINBOW';
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
            // Reverted back to exact base terrain block
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
            // Was added during editing -> cancel modification
            if (modIndex !== -1) this.modifications.splice(modIndex, 1);
        } else {
            // Was in procedural terrain -> record removal
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
        const data = {
            seed: this.seed,
            size: this.chunkRadius,
            maxHeight: this.maxHeight,
            islandFactor: this.islandFactor,
            scale: this.scale,
            threshold: this.threshold,
            heightTypeMap: { ...this.heightTypeMap },
            spawn: this.spawn ? { ...this.spawn } : this.calculateDefaultSpawn(),
            goal: this.goal ? { ...this.goal } : this.calculateDefaultGoal(),
            modifications: [...this.modifications],
        };
        return JSON.stringify(data, null, 2);
    }

    importJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (typeof data.seed === 'number') this.seed = data.seed;
            if (typeof data.size === 'number') this.chunkRadius = data.size;
            if (typeof data.maxHeight === 'number') this.maxHeight = data.maxHeight;
            if (typeof data.islandFactor === 'number') this.islandFactor = data.islandFactor;
            if (typeof data.scale === 'number') this.scale = data.scale;
            if (typeof data.threshold === 'number') this.threshold = data.threshold;
            if (data.heightTypeMap && typeof data.heightTypeMap === 'object') {
                this.heightTypeMap = { ...this.heightTypeMap, ...data.heightTypeMap };
            }
            if (data.spawn && typeof data.spawn.x === 'number') {
                this.spawn = { ...data.spawn };
            }
            if (data.goal && typeof data.goal.x === 'number') {
                this.goal = { ...data.goal };
            }
            if (Array.isArray(data.modifications)) {
                this.modifications = [...data.modifications];
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
