import { TILE_SIZE } from '../tile.js';
import { LEVELS } from '../levels/levels.js';
import { editorPlaytest } from './editorPlaytest.js';

export class EditorUI {
    constructor(editorWorld, editorCamera) {
        this.world = editorWorld;
        this.camera = editorCamera;
        this.selectedTool = 'GRASS'; // 'GRASS' | 'ROCK' | 'SNOW' | 'RAINBOW' | 'ERASER' | 'SPAWN' | 'GOAL' | 'MOVING_X' | 'MOVING_Z'
        this.statusTimer = null;
        this.isPlaytesting = false;

        // Clone levels list from LEVELS
        this.gameLevels = JSON.parse(JSON.stringify(LEVELS));
        this.selectedGameLevelIndex = 0;

        this.initElements();
        this.bindEvents();
        this.populateGameLevelSelect();
        this.loadSelectedGameLevel(0);
    }

    initElements() {
        // Playtest elements
        this.btnPlaytest = document.getElementById('btn-playtest');
        this.btnStopPlaytest = document.getElementById('btn-stop-playtest');
        this.btnStopPlaytestBanner = document.getElementById('btn-stop-playtest-banner');
        this.playtestBanner = document.getElementById('playtest-banner');
        this.playtestText = document.getElementById('playtest-text');

        // Game Levels elements
        this.selectGameLevel = document.getElementById('select-game-level');
        this.btnLoadGameLevel = document.getElementById('btn-load-game-level');
        this.btnUpdateGameLevel = document.getElementById('btn-update-game-level');
        this.btnAddGameLevel = document.getElementById('btn-add-game-level');
        this.btnDeleteGameLevel = document.getElementById('btn-delete-game-level');
        this.btnMoveLevelUp = document.getElementById('btn-move-level-up');
        this.btnMoveLevelDown = document.getElementById('btn-move-level-down');
        this.btnSaveAllToFile = document.getElementById('btn-save-all-to-file');
        this.gameLevelsCount = document.getElementById('game-levels-count');
        this.levelStatusMsg = document.getElementById('level-status-msg');

        // View mode & layers
        this.btnModeInspect = document.getElementById('btn-mode-inspect');
        this.btnModeEdit = document.getElementById('btn-mode-edit');

        this.layerSlider = document.getElementById('layer-slider');
        this.layerDisplay = document.getElementById('layer-display');
        this.btnLayerDown = document.getElementById('btn-layer-down');
        this.btnLayerUp = document.getElementById('btn-layer-up');

        // Block palette
        this.paletteBtns = document.querySelectorAll('.palette-btn');
        this.btnToolSpawn = document.getElementById('btn-tool-spawn');
        this.btnToolGoal = document.getElementById('btn-tool-goal');
        this.inputMovingDist = document.getElementById('input-moving-dist');

        // Procedural parameters
        this.inputSeed = document.getElementById('input-seed');
        this.btnRandomSeed = document.getElementById('btn-random-seed');
        this.sliderSize = document.getElementById('slider-size');
        this.valSize = document.getElementById('val-size');
        this.sliderHeight = document.getElementById('slider-height');
        this.valHeight = document.getElementById('val-height');
        this.sliderFalloff = document.getElementById('slider-falloff');
        this.valFalloff = document.getElementById('val-falloff');
        this.sliderScale = document.getElementById('slider-scale');
        this.valScale = document.getElementById('val-scale');
        this.sliderThreshold = document.getElementById('slider-threshold');
        this.valThreshold = document.getElementById('val-threshold');

        this.inputGrassMax = document.getElementById('input-grass-max');
        this.inputRockMax = document.getElementById('input-rock-max');
        this.inputSnowMax = document.getElementById('input-snow-max');

        this.btnRegenerate = document.getElementById('btn-regenerate');
        this.btnClearMods = document.getElementById('btn-clear-mods');

        this.btnExport = document.getElementById('btn-export');
        this.btnImport = document.getElementById('btn-import');
        this.jsonTextarea = document.getElementById('json-textarea');

        this.infoMode = document.getElementById('info-mode');
        this.infoLayer = document.getElementById('info-layer');
        this.infoCell = document.getElementById('info-cell');
        this.infoMods = document.getElementById('info-mods');
    }

    bindEvents() {
        // Playtest controls
        if (this.btnPlaytest) {
            this.btnPlaytest.addEventListener('click', () => this.startPlaytest());
        }
        if (this.btnStopPlaytest) {
            this.btnStopPlaytest.addEventListener('click', () => this.stopPlaytest());
        }
        if (this.btnStopPlaytestBanner) {
            this.btnStopPlaytestBanner.addEventListener('click', () => this.stopPlaytest());
        }

        // Game Levels controls
        if (this.selectGameLevel) {
            this.selectGameLevel.addEventListener('change', () => {
                const idx = parseInt(this.selectGameLevel.value, 10);
                if (!isNaN(idx)) {
                    this.loadSelectedGameLevel(idx);
                }
            });
        }
        if (this.btnLoadGameLevel) {
            this.btnLoadGameLevel.addEventListener('click', () => {
                const idx = parseInt(this.selectGameLevel.value, 10);
                if (!isNaN(idx)) this.loadSelectedGameLevel(idx);
            });
        }
        if (this.btnUpdateGameLevel) {
            this.btnUpdateGameLevel.addEventListener('click', () => this.updateCurrentGameLevel());
        }
        if (this.btnAddGameLevel) {
            this.btnAddGameLevel.addEventListener('click', () => this.addNewGameLevel());
        }
        if (this.btnDeleteGameLevel) {
            this.btnDeleteGameLevel.addEventListener('click', () => this.deleteCurrentGameLevel());
        }
        if (this.btnMoveLevelUp) {
            this.btnMoveLevelUp.addEventListener('click', () => this.moveLevelUp());
        }
        if (this.btnMoveLevelDown) {
            this.btnMoveLevelDown.addEventListener('click', () => this.moveLevelDown());
        }
        if (this.btnSaveAllToFile) {
            this.btnSaveAllToFile.addEventListener('click', () => this.saveAllLevelsToFile());
        }

        // Mode toggles
        this.btnModeInspect.addEventListener('click', () => this.setMode('inspect'));
        this.btnModeEdit.addEventListener('click', () => this.setMode('edit'));

        // Layer controls
        this.layerSlider.addEventListener('input', (e) => this.setLayer(parseInt(e.target.value, 10)));
        this.btnLayerDown.addEventListener('click', () => this.setLayer(this.world.activeLayer - 1));
        this.btnLayerUp.addEventListener('click', () => this.setLayer(this.world.activeLayer + 1));

        // Block palette
        this.paletteBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.getAttribute('data-type');
                if (type) this.setSelectedTool(type);
            });
        });

        if (this.btnToolSpawn) {
            this.btnToolSpawn.addEventListener('click', () => this.setSelectedTool('SPAWN'));
        }

        if (this.btnToolGoal) {
            this.btnToolGoal.addEventListener('click', () => this.setSelectedTool('GOAL'));
        }

        // Procedural sliders & inputs
        this.inputSeed.addEventListener('change', (e) => {
            this.world.setSeed(parseInt(e.target.value, 10) || 0);
            this.world.regenerate(true);
            this.syncJSON();
        });

        this.btnRandomSeed.addEventListener('click', () => {
            const newSeed = Math.floor(Math.random() * 99999);
            this.inputSeed.value = newSeed;
            this.world.setSeed(newSeed);
            this.world.regenerate(true);
            this.syncJSON();
        });

        this.sliderSize.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            this.valSize.textContent = val;
            this.world.chunkRadius = val;
            this.world.regenerate(true);
            this.syncJSON();
        });

        this.sliderHeight.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            this.valHeight.textContent = val;
            this.world.maxHeight = val;
            this.layerSlider.max = val;
            this.world.regenerate(true);
            this.syncJSON();
        });

        this.sliderFalloff.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            this.valFalloff.textContent = val;
            this.world.islandFactor = val;
            this.world.regenerate(true);
            this.syncJSON();
        });

        this.sliderScale.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            this.valScale.textContent = val;
            this.world.scale = val;
            this.world.regenerate(true);
            this.syncJSON();
        });

        this.sliderThreshold.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            this.valThreshold.textContent = val;
            this.world.threshold = val;
            this.world.regenerate(true);
            this.syncJSON();
        });

        const handleHeightChange = (input, prop, def) => {
            const raw = parseInt(input.value, 10);
            this.world.heightTypeMap[prop] = isNaN(raw) ? def : Math.max(0, raw);
            this.world.regenerate(true);
            this.syncJSON();
        };

        this.inputGrassMax.addEventListener('input', () => handleHeightChange(this.inputGrassMax, 'grassMax', 3));
        this.inputRockMax.addEventListener('input', () => handleHeightChange(this.inputRockMax, 'rockMax', 7));
        if (this.inputSnowMax) {
            this.inputSnowMax.addEventListener('input', () => handleHeightChange(this.inputSnowMax, 'snowMax', 12));
        }

        this.btnRegenerate.addEventListener('click', () => {
            this.world.regenerate(true);
            this.syncJSON();
        });

        this.btnClearMods.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all manual block modifications?')) {
                this.world.clearModifications();
                this.syncJSON();
            }
        });

        // Export / Import
        this.btnExport.addEventListener('click', () => {
            this.syncJSON();
            const json = this.jsonTextarea.value;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(json).then(() => {
                    const origText = this.btnExport.innerHTML;
                    this.btnExport.innerHTML = '✅ Copied!';
                    setTimeout(() => {
                        this.btnExport.innerHTML = origText;
                    }, 1500);
                }).catch(() => { });
            }
        });

        this.btnImport.addEventListener('click', () => {
            const json = this.jsonTextarea.value.trim();
            if (!json) {
                alert('Please paste a level definition JSON into the box first.');
                return;
            }
            const result = this.world.importJSON(json);
            if (result.success) {
                this.syncFromWorld();
                this.showStatus('✅ Level imported from JSON!');
            } else {
                alert('Import error: ' + result.error);
            }
        });
    }

    // --- Status & Feedback ---

    showStatus(message, isError = false) {
        if (!this.levelStatusMsg) return;
        if (this.statusTimer) clearTimeout(this.statusTimer);
        this.levelStatusMsg.style.color = isError ? '#f85149' : '#7ee787';
        this.levelStatusMsg.textContent = message;
        this.statusTimer = setTimeout(() => {
            if (this.levelStatusMsg) this.levelStatusMsg.textContent = '';
        }, 3500);
    }

    // --- Game Levels Management ---

    populateGameLevelSelect(selectedIndex = this.selectedGameLevelIndex) {
        if (!this.selectGameLevel) return;
        this.selectGameLevel.innerHTML = '';

        this.gameLevels.forEach((_, idx) => {
            const opt = document.createElement('option');
            opt.value = idx.toString();
            opt.textContent = `Level ${idx + 1}`;
            if (idx === selectedIndex) opt.selected = true;
            this.selectGameLevel.appendChild(opt);
        });

        if (this.gameLevelsCount) {
            this.gameLevelsCount.textContent = `${this.gameLevels.length} levels`;
        }

        if (this.btnUpdateGameLevel) {
            this.btnUpdateGameLevel.textContent = `💾 Update Level ${selectedIndex + 1}`;
        }
    }

    loadSelectedGameLevel(index = 0) {
        if (index < 0 || index >= this.gameLevels.length) {
            index = 0;
        }
        this.selectedGameLevelIndex = index;
        if (this.selectGameLevel) {
            this.selectGameLevel.value = index.toString();
        }

        const levelData = this.gameLevels[index];
        const res = this.world.importJSON(JSON.stringify(levelData));
        if (res.success) {
            this.syncFromWorld();
            if (this.btnUpdateGameLevel) {
                this.btnUpdateGameLevel.textContent = `💾 Update Level ${index + 1}`;
            }
            this.showStatus(`📂 Loaded Level ${index + 1}`);
        } else {
            this.showStatus(`❌ Error loading Level ${index + 1}: ${res.error}`, true);
        }
    }

    updateCurrentGameLevel() {
        const rawJson = this.world.exportJSON();
        let parsed;
        try {
            parsed = JSON.parse(rawJson);
        } catch (e) {
            this.showStatus('❌ Error exporting level data', true);
            return;
        }

        this.gameLevels[this.selectedGameLevelIndex] = parsed;
        this.showStatus(`💾 Updated Level ${this.selectedGameLevelIndex + 1}! Click "Save All" or Ctrl+S to write to levels.js.`);
    }

    addNewGameLevel() {
        const rawJson = this.world.exportJSON();
        let parsed;
        try {
            parsed = JSON.parse(rawJson);
        } catch (e) {
            this.showStatus('❌ Error exporting level data', true);
            return;
        }

        this.gameLevels.push(parsed);
        this.selectedGameLevelIndex = this.gameLevels.length - 1;
        this.populateGameLevelSelect(this.selectedGameLevelIndex);
        this.showStatus(`➕ Added as Level ${this.selectedGameLevelIndex + 1}!`);
    }

    deleteCurrentGameLevel() {
        if (this.gameLevels.length <= 1) {
            alert('Cannot delete the only remaining level in the game.');
            return;
        }

        if (confirm(`Are you sure you want to delete Level ${this.selectedGameLevelIndex + 1} from the game?`)) {
            this.gameLevels.splice(this.selectedGameLevelIndex, 1);
            this.selectedGameLevelIndex = Math.min(this.selectedGameLevelIndex, this.gameLevels.length - 1);
            this.populateGameLevelSelect(this.selectedGameLevelIndex);
            this.loadSelectedGameLevel(this.selectedGameLevelIndex);
            this.showStatus(`🗑️ Deleted level from game.`);
        }
    }

    moveLevelUp() {
        if (this.selectedGameLevelIndex <= 0) return;
        const idx = this.selectedGameLevelIndex;
        const temp = this.gameLevels[idx];
        this.gameLevels[idx] = this.gameLevels[idx - 1];
        this.gameLevels[idx - 1] = temp;
        this.selectedGameLevelIndex--;
        this.populateGameLevelSelect(this.selectedGameLevelIndex);
        this.showStatus(`⬆️ Moved level up to position ${this.selectedGameLevelIndex + 1}`);
    }

    moveLevelDown() {
        if (this.selectedGameLevelIndex >= this.gameLevels.length - 1) return;
        const idx = this.selectedGameLevelIndex;
        const temp = this.gameLevels[idx];
        this.gameLevels[idx] = this.gameLevels[idx + 1];
        this.gameLevels[idx + 1] = temp;
        this.selectedGameLevelIndex++;
        this.populateGameLevelSelect(this.selectedGameLevelIndex);
        this.showStatus(`⬇️ Moved level down to position ${this.selectedGameLevelIndex + 1}`);
    }

    async saveAllLevelsToFile() {
        try {
            // Make sure current level in editor is updated in the array
            const currentJson = this.world.exportJSON();
            this.gameLevels[this.selectedGameLevelIndex] = JSON.parse(currentJson);

            const res = await fetch('/api/save-levels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ levels: this.gameLevels })
            });

            const result = await res.json();
            if (result.success) {
                this.showStatus(`✅ Successfully saved all ${this.gameLevels.length} levels to src/levels/levels.js!`);
            } else {
                throw new Error(result.error || 'Unknown error');
            }
        } catch (err) {
            console.warn('Direct file save failed:', err);
            // Fallback: Copy to clipboard and notify
            this.syncJSON();
            this.showStatus(`⚠️ Could not reach server. Level JSON synced to textarea below.`, true);
        }
    }

    // --- Playtest ---

    startPlaytest() {
        if (this.isPlaytesting) return;
        this.isPlaytesting = true;

        // Keep current in-editor changes synced into memory
        try {
            this.gameLevels[this.selectedGameLevelIndex] = JSON.parse(this.world.exportJSON());
        } catch { }

        if (this.playtestBanner) this.playtestBanner.style.display = 'flex';
        if (this.btnPlaytest) this.btnPlaytest.style.display = 'none';
        if (this.btnStopPlaytest) this.btnStopPlaytest.style.display = 'inline-flex';
        if (this.infoMode) this.infoMode.textContent = '🎮 Playtesting';

        const canvas = document.getElementById('editor-canvas');
        editorPlaytest.start(canvas, this.world, () => this.stopPlaytest());
    }

    stopPlaytest() {
        if (!this.isPlaytesting && !editorPlaytest.isActive) return;
        this.isPlaytesting = false;

        if (this.playtestBanner) this.playtestBanner.style.display = 'none';
        if (this.btnPlaytest) this.btnPlaytest.style.display = 'inline-flex';
        if (this.btnStopPlaytest) this.btnStopPlaytest.style.display = 'none';

        if (editorPlaytest.isActive) {
            editorPlaytest.stop();
        }

        this.camera.updatePosition();
        this.btnModeInspect.classList.toggle('active', this.camera.mode === 'inspect');
        this.btnModeEdit.classList.toggle('active', this.camera.mode === 'edit');
        this.infoMode.textContent = this.camera.mode === 'edit' ? 'Top-Down Edit' : '3D Inspect';
        this.showStatus('⏹️ Exited Playtest');
    }

    // --- View Modes & Tools ---

    get movingDistance() {
        return parseInt(this.inputMovingDist?.value, 10) || 3;
    }

    setMode(mode) {
        if (this.isPlaytesting) {
            this.stopPlaytest();
        }
        this.camera.setMode(mode);
        if (mode === 'edit') {
            this.camera.targetY = (this.world.activeLayer + 0.5) * TILE_SIZE;
            this.camera.updatePosition();
        }
        this.btnModeInspect.classList.toggle('active', mode === 'inspect');
        this.btnModeEdit.classList.toggle('active', mode === 'edit');
        this.infoMode.textContent = mode === 'edit' ? 'Top-Down Edit' : '3D Inspect';
    }

    toggleMode() {
        if (this.isPlaytesting) {
            this.stopPlaytest();
            return;
        }
        const next = this.camera.mode === 'inspect' ? 'edit' : 'inspect';
        this.setMode(next);
    }

    setLayer(layer) {
        const clamped = Math.max(0, Math.min(this.world.maxHeight, layer));
        this.world.activeLayer = clamped;
        this.layerSlider.value = clamped;
        this.layerDisplay.textContent = clamped;
        this.infoLayer.textContent = clamped;

        if (this.camera.mode === 'edit') {
            this.camera.targetY = (clamped + 0.5) * TILE_SIZE;
            this.camera.updatePosition();
        }
    }

    setSelectedTool(tool) {
        this.selectedTool = tool;
        this.paletteBtns.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-type') === tool);
        });
        if (this.btnToolSpawn) {
            this.btnToolSpawn.classList.toggle('active', tool === 'SPAWN');
        }
        if (this.btnToolGoal) {
            this.btnToolGoal.classList.toggle('active', tool === 'GOAL');
        }
    }

    syncJSON() {
        if (this.jsonTextarea) {
            this.jsonTextarea.value = this.world.exportJSON();
            this.jsonTextarea.value = this.jsonTextarea.value.replace(/"([A-Z_]+)"/g, '$1');
        }
    }

    syncFromWorld() {
        this.inputSeed.value = this.world.seed;
        this.sliderSize.value = this.world.chunkRadius;
        this.valSize.textContent = this.world.chunkRadius;
        this.sliderHeight.value = this.world.maxHeight;
        this.valHeight.textContent = this.world.maxHeight;
        this.sliderFalloff.value = this.world.islandFactor;
        this.valFalloff.textContent = this.world.islandFactor;
        this.sliderScale.value = this.world.scale;
        this.valScale.textContent = this.world.scale;
        this.sliderThreshold.value = this.world.threshold;
        this.valThreshold.textContent = this.world.threshold;

        this.inputGrassMax.value = this.world.heightTypeMap.grassMax ?? 3;
        this.inputRockMax.value = this.world.heightTypeMap.rockMax ?? 7;
        if (this.inputSnowMax) {
            this.inputSnowMax.value = this.world.heightTypeMap.snowMax ?? 12;
        }

        this.layerSlider.max = this.world.maxHeight;
        this.setLayer(this.world.activeLayer);
        this.syncJSON();
    }

    updateOverlay(hoveredCell) {
        if (this.isPlaytesting) {
            if (this.infoCell) this.infoCell.textContent = 'Player Controls Active';
            if (this.infoMods) this.infoMods.textContent = '-';
            return;
        }
        if (hoveredCell) {
            this.infoCell.textContent = `(${hoveredCell.x}, ${hoveredCell.y}, ${hoveredCell.z})`;
        } else {
            this.infoCell.textContent = '-';
        }
        this.infoMods.textContent = this.world.modifications.length;
    }
}

export default EditorUI;
