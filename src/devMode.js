import PointerMarker, { getTargetCell } from './pointerMarker.js';
import { addGameObject, removeGameObject, gameObjects } from './gameObjects.js';
import Tile, { TILE_SIZE } from './tile.js';
import { world } from './world.js';
import { player } from './player.js';
import { camera } from './camera.js';

export const BLOCK_TYPES = ['GRASS', 'ROCK', 'SNOW'];

class DevMode {
    constructor() {
        this.enabled = false;
        this.pointer = new PointerMarker();
        this.selectedTypeIndex = 0;
        this.verticalOffset = 0;
        this.modifications = [];
        this.spawn = null;
        this.hudElement = null;
    }

    init() {
        this.createHud();
        this.setupKeyboardListeners();
        console.log('[DevMode] Initialized. Press "F" to toggle dev mode.');
    }

    createHud() {
        if (this.hudElement || typeof document === 'undefined') return;

        this.hudElement = document.createElement('div');
        this.hudElement.id = 'dev-mode-hud';
        this.hudElement.style.position = 'fixed';
        this.hudElement.style.top = '12px';
        this.hudElement.style.left = '12px';
        this.hudElement.style.padding = '10px 14px';
        this.hudElement.style.background = 'rgba(10, 15, 25, 0.85)';
        this.hudElement.style.border = '1px solid #00ffcc';
        this.hudElement.style.color = '#e0f7fa';
        this.hudElement.style.fontFamily = 'Consolas, monospace';
        this.hudElement.style.fontSize = '12px';
        this.hudElement.style.lineHeight = '1.6';
        this.hudElement.style.borderRadius = '6px';
        this.hudElement.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.5)';
        this.hudElement.style.zIndex = '99999';
        this.hudElement.style.pointerEvents = 'none';
        this.hudElement.style.display = 'none';

        document.body.appendChild(this.hudElement);
    }

    setupKeyboardListeners() {
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();

            if (key === 'f') {
                this.toggle();
                return;
            }

            if (!this.enabled) return;

            if (key === 'r' || e.code === 'Enter') {
                this.placeBlock();
            } else if (key === 'x' || e.code === 'Delete' || e.code === 'Backspace') {
                this.removeBlock();
            } else if (key === 'b') {
                if (e.shiftKey) {
                    this.teleportToSpawn();
                } else {
                    this.setSpawnPoint();
                }
            } else if (key === 't') {
                this.cycleBlockType();
            } else if (key === '1') {
                this.setBlockTypeIndex(0);
            } else if (key === '2') {
                this.setBlockTypeIndex(1);
            } else if (key === '3') {
                this.setBlockTypeIndex(2);
            } else if (e.code === 'ArrowUp' || key === 'c') {
                this.adjustVerticalOffset(1);
            } else if (e.code === 'ArrowDown' || key === 'v') {
                this.adjustVerticalOffset(-1);
            } else if (key === 'g' || key === '0') {
                this.resetVerticalOffset();
            } else if (key === 'o' || key === 'p') {
                this.exportData();
            }
        });
    }

    toggle() {
        this.enabled = !this.enabled;
        if (this.hudElement) {
            this.hudElement.style.display = this.enabled ? 'block' : 'none';
        }
        console.log(`[DevMode] ${this.enabled ? 'ENABLED' : 'DISABLED'}`);
        if (this.enabled) {
            this.updateHud();
        }
    }

    get selectedType() {
        return BLOCK_TYPES[this.selectedTypeIndex];
    }

    cycleBlockType() {
        this.selectedTypeIndex = (this.selectedTypeIndex + 1) % BLOCK_TYPES.length;
        console.log(`[DevMode] Selected block type: ${this.selectedType}`);
        this.updateHud();
    }

    setBlockTypeIndex(index) {
        if (index >= 0 && index < BLOCK_TYPES.length) {
            this.selectedTypeIndex = index;
            console.log(`[DevMode] Selected block type: ${this.selectedType}`);
            this.updateHud();
        }
    }

    adjustVerticalOffset(delta) {
        this.verticalOffset += delta;
        this.pointer.verticalOffset = this.verticalOffset;
        console.log(`[DevMode] Vertical offset: ${this.verticalOffset > 0 ? '+' : ''}${this.verticalOffset}`);
        this.updateHud();
    }

    resetVerticalOffset() {
        this.verticalOffset = 0;
        this.pointer.verticalOffset = 0;
        console.log('[DevMode] Vertical offset reset to 0');
        this.updateHud();
    }

    findBlockAt(x, y, z) {
        return gameObjects.find(
            obj => obj instanceof Tile && !(obj instanceof PointerMarker) &&
                obj.gridX === x && obj.gridY === y && obj.gridZ === z
        );
    }

    isOriginallyGenerated(x, y, z) {
        const h = world.getHeightAt(x, z);
        return h > 0 && (h - 1) === y;
    }

    getOriginalGeneratedType(x, y, z) {
        if (!this.isOriginallyGenerated(x, y, z)) return null;
        const h = world.getHeightAt(x, z);
        return h > 7 ? 'SNOW' : h < 4 ? 'GRASS' : 'ROCK';
    }

    setSpawnPoint() {
        const { gridX, gridY, gridZ } = getTargetCell(player, camera, this.verticalOffset);
        const block = this.findBlockAt(gridX, gridY, gridZ);
        // Om det finns ett block vid markören, sätt spawn ovanpå det; annars i cellen direkt
        const spawnY = block ? gridY + 1 : gridY;
        this.spawn = { x: gridX, y: spawnY, z: gridZ };
        console.log(`[DevMode] Player spawn point set to: (${this.spawn.x}, ${this.spawn.y}, ${this.spawn.z})`);
        this.updateHud();
    }

    teleportToSpawn() {
        const spawn = this.spawn || world.getSpawnPosition();
        player.x = spawn.x * TILE_SIZE + TILE_SIZE / 2;
        player.z = spawn.z * TILE_SIZE + TILE_SIZE / 2;
        player.y = spawn.y * TILE_SIZE + 0.5;
        player.vx = 0;
        player.vy = 0;
        player.vz = 0;
        console.log(`[DevMode] Teleported player to spawn: (${spawn.x}, ${spawn.y}, ${spawn.z})`);
    }

    preventPlayerStuck(gridX, gridY, gridZ) {
        const minX = gridX * TILE_SIZE;
        const maxX = minX + TILE_SIZE;
        const minY = gridY * TILE_SIZE;
        const maxY = minY + TILE_SIZE;
        const minZ = gridZ * TILE_SIZE;
        const maxZ = minZ + TILE_SIZE;

        const halfW = player.width / 2;
        const halfD = player.depth / 2;
        const pMinX = player.x - halfW;
        const pMaxX = player.x + halfW;
        const pMinY = player.y;
        const pMaxY = player.y + player.height;
        const pMinZ = player.z - halfD;
        const pMaxZ = player.z + halfD;

        const overlapX = pMinX < maxX && pMaxX > minX;
        const overlapZ = pMinZ < maxZ && pMaxZ > minZ;
        const overlapY = pMinY < maxY && pMaxY > minY;

        if (overlapX && overlapZ && overlapY) {
            // Om spelarens fötter är på eller nära blockets nivå, lyft upp spelaren ovanpå blocket
            if (player.y >= minY - 0.05) {
                player.y = maxY + 0.01;
                player.vy = 0;
                player.grounded = true;
            } else {
                // Om blocket placerades ovanför, knuffa spelaren horisontellt ut ur blocket
                const blockCenterX = minX + TILE_SIZE / 2;
                const blockCenterZ = minZ + TILE_SIZE / 2;
                const dx = player.x - blockCenterX;
                const dz = player.z - blockCenterZ;

                if (Math.abs(dx) >= Math.abs(dz)) {
                    player.x = dx >= 0 ? maxX + halfW + 0.02 : minX - halfW - 0.02;
                } else {
                    player.z = dz >= 0 ? maxZ + halfD + 0.02 : minZ - halfD - 0.02;
                }
            }
        }
    }

    placeBlock() {
        const { gridX, gridY, gridZ } = getTargetCell(player, camera, this.verticalOffset);

        const existing = this.findBlockAt(gridX, gridY, gridZ);
        if (existing) {
            console.warn(`[DevMode] Cannot place block: Cell (${gridX}, ${gridY}, ${gridZ}) is already occupied by ${existing.type}`);
            return;
        }

        const type = this.selectedType;
        const tile = new Tile(gridX, gridY, gridZ, type);
        addGameObject(tile);

        const colKey = `${gridX},${gridZ}`;
        if (!world.loadedColumns.has(colKey)) {
            world.loadedColumns.set(colKey, []);
        }
        world.loadedColumns.get(colKey).push(tile);

        // Flytta eller lyft spelaren om den är för nära/inuti det nya blocket så att gubben inte fastnar
        this.preventPlayerStuck(gridX, gridY, gridZ);

        // Hantera modifieringslistan smart
        const modIndex = this.modifications.findIndex(
            m => m.x === gridX && m.y === gridY && m.z === gridZ
        );

        if (this.isOriginallyGenerated(gridX, gridY, gridZ) && this.getOriginalGeneratedType(gridX, gridY, gridZ) === type) {
            // Återställd till samma typ som i den procedurella världen -> ta bort mod
            if (modIndex !== -1) {
                this.modifications.splice(modIndex, 1);
            }
        } else {
            const mod = { x: gridX, y: gridY, z: gridZ, action: 'add', type };
            if (modIndex !== -1) {
                this.modifications[modIndex] = mod;
            } else {
                this.modifications.push(mod);
            }
        }

        console.log(`[DevMode] Placed ${type} at (${gridX}, ${gridY}, ${gridZ}). Total mods: ${this.modifications.length}`);
        this.updateHud();
    }

    removeBlock() {
        const { gridX, gridY, gridZ } = getTargetCell(player, camera, this.verticalOffset);

        const tile = this.findBlockAt(gridX, gridY, gridZ);
        if (!tile) {
            console.warn(`[DevMode] Cannot remove block: No block exists at (${gridX}, ${gridY}, ${gridZ})`);
            return;
        }

        removeGameObject(tile);

        const colKey = `${gridX},${gridZ}`;
        const col = world.loadedColumns.get(colKey);
        if (col) {
            const idx = col.indexOf(tile);
            if (idx !== -1) col.splice(idx, 1);
        }

        const modIndex = this.modifications.findIndex(
            m => m.x === gridX && m.y === gridY && m.z === gridZ
        );

        if (!this.isOriginallyGenerated(gridX, gridY, gridZ)) {
            // Cellen var ursprungligen tom: om vi hade lagt till ett block här, ta bort 'add'-posten så att den försvinner helt
            if (modIndex !== -1) {
                this.modifications.splice(modIndex, 1);
            }
        } else {
            // Cellen hade ursprungligen ett genererat block: spara 'remove'
            const mod = { x: gridX, y: gridY, z: gridZ, action: 'remove' };
            if (modIndex !== -1) {
                this.modifications[modIndex] = mod;
            } else {
                this.modifications.push(mod);
            }
        }

        console.log(`[DevMode] Removed ${tile.type} at (${gridX}, ${gridY}, ${gridZ}). Total mods: ${this.modifications.length}`);
        this.updateHud();
    }

    getLevelExport() {
        const exportObj = {
            seed: world.seed,
            size: world.chunkRadius,
            maxHeight: world.maxHeight,
        };

        if (this.spawn) {
            exportObj.spawn = { ...this.spawn };
        }

        exportObj.modifications = [...this.modifications];
        return exportObj;
    }

    exportData() {
        const exportObj = this.getLevelExport();
        const json = JSON.stringify(exportObj, null, 2);

        console.log('\n================ LEVEL DEFINITION JSON ================');
        console.log(json);
        console.log('=======================================================\n');

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(json)
                .then(() => console.log('[DevMode] Level data copied to clipboard!'))
                .catch(err => console.warn('[DevMode] Could not copy to clipboard:', err));
        }
    }

    update(dt) {
        if (!this.enabled) return;
        this.pointer.verticalOffset = this.verticalOffset;
        this.pointer.update(dt);
        this.updateHud();
    }

    render(renderer) {
        if (!this.enabled) return;
        this.pointer.render(renderer);
    }

    updateHud() {
        if (!this.hudElement || !this.enabled) return;

        const { gridX, gridY, gridZ } = this.pointer;
        const currentBlock = this.findBlockAt(gridX, gridY, gridZ);
        const cellStatus = currentBlock ? `Occupied (${currentBlock.type})` : 'Empty';
        const offsetSign = this.verticalOffset > 0 ? `+${this.verticalOffset}` : `${this.verticalOffset}`;
        const spawnText = this.spawn ? `X: ${this.spawn.x}, Y: ${this.spawn.y}, Z: ${this.spawn.z}` : 'Auto';

        this.hudElement.innerHTML = `
            <div style="font-weight: bold; color: #00ffcc; margin-bottom: 4px;">🛠️ [DEV MODE: ON] (Toggle: F)</div>
            <div>Target: <b>X: ${gridX}, Y: ${gridY}, Z: ${gridZ}</b> [${cellStatus}]</div>
            <div>Y-Offset: <b>${offsetSign}</b> (↑/↓ or C/V, Reset: G)</div>
            <div>Spawn: <b style="color: #69f0ae;">${spawnText}</b> (Set: B, Teleport: Shift+B)</div>
            <div>Selected Type: <b style="color: #ffeb3b;">${this.selectedType}</b> (Cycle: T, 1-3)</div>
            <div>Modifications: <b>${this.modifications.length}</b> (Export: O)</div>
            <div style="margin-top: 6px; font-size: 11px; color: #90caf9;">
                <b>[R]</b> Place &nbsp;|&nbsp; <b>[X]</b> Remove &nbsp;|&nbsp; <b>[B]</b> Set Spawn &nbsp;|&nbsp; <b>[O]</b> Export JSON
            </div>
        `;
    }
}

export const devMode = new DevMode();
export default devMode;
