import { TILE_SIZE } from '../tile.js';

export class EditorUI {
    constructor(editorWorld, editorCamera) {
        this.world = editorWorld;
        this.camera = editorCamera;
        this.selectedTool = 'GRASS'; // 'GRASS' | 'ROCK' | 'SNOW' | 'RAINBOW' | 'ERASER' | 'SPAWN'

        this.initElements();
        this.bindEvents();
        this.syncFromWorld();
    }

    initElements() {
        this.btnModeInspect = document.getElementById('btn-mode-inspect');
        this.btnModeEdit = document.getElementById('btn-mode-edit');

        this.layerSlider = document.getElementById('layer-slider');
        this.layerDisplay = document.getElementById('layer-display');
        this.btnLayerDown = document.getElementById('btn-layer-down');
        this.btnLayerUp = document.getElementById('btn-layer-up');

        this.paletteBtns = document.querySelectorAll('.palette-btn');
        this.btnToolSpawn = document.getElementById('btn-tool-spawn');

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

        this.inputGrassMax.addEventListener('change', (e) => {
            this.world.heightTypeMap.grassMax = parseInt(e.target.value, 10) || 3;
            this.world.regenerate(true);
            this.syncJSON();
        });

        this.inputRockMax.addEventListener('change', (e) => {
            this.world.heightTypeMap.rockMax = parseInt(e.target.value, 10) || 7;
            this.world.regenerate(true);
            this.syncJSON();
        });

        if (this.inputSnowMax) {
            this.inputSnowMax.addEventListener('change', (e) => {
                this.world.heightTypeMap.snowMax = parseInt(e.target.value, 10) || 12;
                this.world.regenerate(true);
                this.syncJSON();
            });
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
                }).catch(() => {});
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
                alert('Level definition successfully imported!');
            } else {
                alert('Import error: ' + result.error);
            }
        });
    }

    setMode(mode) {
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
    }

    syncJSON() {
        if (this.jsonTextarea) {
            this.jsonTextarea.value = this.world.exportJSON();
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

        this.inputGrassMax.value = this.world.heightTypeMap.grassMax;
        this.inputRockMax.value = this.world.heightTypeMap.rockMax;
        if (this.inputSnowMax) {
            this.inputSnowMax.value = this.world.heightTypeMap.snowMax || 12;
        }

        this.layerSlider.max = this.world.maxHeight;
        this.setLayer(this.world.activeLayer);
        this.syncJSON();
    }

    updateOverlay(hoveredCell) {
        if (hoveredCell) {
            this.infoCell.textContent = `(${hoveredCell.x}, ${hoveredCell.y}, ${hoveredCell.z})`;
        } else {
            this.infoCell.textContent = '-';
        }
        this.infoMods.textContent = this.world.modifications.length;
    }
}

export default EditorUI;
