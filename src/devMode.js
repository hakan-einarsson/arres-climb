import PointerMarker, { getTargetCell } from './pointerMarker.js';
import { addGameObject, removeGameObject, gameObjects } from './gameObjects.js';
import Tile from './tile.js';
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

        const mod = { x: gridX, y: gridY, z: gridZ, action: 'add', type };
        this.modifications.push(mod);

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

        const mod = { x: gridX, y: gridY, z: gridZ, action: 'remove' };
        this.modifications.push(mod);

        console.log(`[DevMode] Removed ${tile.type} at (${gridX}, ${gridY}, ${gridZ}). Total mods: ${this.modifications.length}`);
        this.updateHud();
    }

    getLevelExport() {
        return {
            seed: world.seed,
            size: world.chunkRadius,
            maxHeight: world.maxHeight,
            modifications: [...this.modifications],
        };
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

        this.hudElement.innerHTML = `
            <div style="font-weight: bold; color: #00ffcc; margin-bottom: 4px;">🛠️ [DEV MODE: ON] (Toggle: F)</div>
            <div>Target: <b>X: ${gridX}, Y: ${gridY}, Z: ${gridZ}</b> [${cellStatus}]</div>
            <div>Y-Offset: <b>${offsetSign}</b> (↑/↓ or C/V, Reset: G)</div>
            <div>Selected Type: <b style="color: #ffeb3b;">${this.selectedType}</b> (Cycle: T, 1-3)</div>
            <div>Modifications: <b>${this.modifications.length}</b> (Export: O)</div>
            <div style="margin-top: 6px; font-size: 11px; color: #90caf9;">
                <b>[R]</b> Place &nbsp;|&nbsp; <b>[X]</b> Remove &nbsp;|&nbsp; <b>[O]</b> Export JSON
            </div>
        `;
    }
}

export const devMode = new DevMode();
export default devMode;
