import { editorCamera } from './editorCamera.js';
import { editorWorld } from './editorWorld.js';
import EditorRenderer from './editorRenderer.js';
import EditorUI from './editorUI.js';
import { TILE_SIZE } from '../tile.js';

const canvas = document.getElementById('editor-canvas');
const renderer = new EditorRenderer(canvas, editorCamera);
const ui = new EditorUI(editorWorld, editorCamera);

let hoveredCell = null;
let isMouseDown = false;
let mouseButton = 0;
let isPanning = false;
let isPainting = false;
let isErasing = false;
let lastMouseX = 0;
let lastMouseY = 0;

function updateHoveredCell(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    if (mouseX < 0 || mouseX > rect.width || mouseY < 0 || mouseY > rect.height) {
        hoveredCell = null;
        return;
    }

    const ndcX = (mouseX / rect.width) * 2 - 1;
    const ndcY = -((mouseY / rect.height) * 2 - 1);
    const aspectRatio = rect.width / (rect.height || 1);
    const focalLength = 1.5;

    let gridX, gridZ;

    if (editorCamera.mode === 'edit') {
        // Top-Down Edit Mode: Exact camera unprojection on the active layer plane
        const worldX = editorCamera.targetX + (ndcX * editorCamera.distance) / focalLength;
        const worldZ = editorCamera.targetZ + (ndcY * editorCamera.distance) / (focalLength * aspectRatio);
        gridX = Math.floor(worldX / TILE_SIZE);
        gridZ = Math.floor(worldZ / TILE_SIZE);
    } else {
        // 3D Inspect Mode: Ray-plane intersection on the active layer plane
        const planeY = (editorWorld.activeLayer + 0.5) * TILE_SIZE;
        const vx = ndcX / focalLength;
        const vy = ndcY / (focalLength * aspectRatio);
        const vz = 1.0;

        const cosP = Math.cos(editorCamera.pitch);
        const sinP = Math.sin(editorCamera.pitch);
        const y1 = vy * cosP + vz * sinP;
        const z1 = -vy * sinP + vz * cosP;

        const cosY = Math.cos(editorCamera.yaw);
        const sinY = Math.sin(editorCamera.yaw);
        const dirX = vx * cosY + z1 * sinY;
        const dirY = y1;
        const dirZ = -vx * sinY + z1 * cosY;

        if (Math.abs(dirY) < 1e-5) {
            hoveredCell = null;
            return;
        }

        const t = (planeY - editorCamera.y) / dirY;
        if (t <= 0) {
            hoveredCell = null;
            return;
        }

        const hitX = editorCamera.x + dirX * t;
        const hitZ = editorCamera.z + dirZ * t;
        gridX = Math.floor(hitX / TILE_SIZE);
        gridZ = Math.floor(hitZ / TILE_SIZE);
    }

    const maxR = editorWorld.chunkRadius + 8;
    if (Math.abs(gridX) <= maxR && Math.abs(gridZ) <= maxR) {
        hoveredCell = { x: gridX, y: editorWorld.activeLayer, z: gridZ };
    } else {
        hoveredCell = null;
    }
}

function applyActionAtHovered(button) {
    if (!hoveredCell || editorCamera.mode !== 'edit') return;
    const { x, y, z } = hoveredCell;

    if (button === 2 || ui.selectedTool === 'ERASER') {
        // Erase block
        editorWorld.removeBlock(x, y, z);
    } else if (ui.selectedTool === 'SPAWN') {
        // Set spawn
        editorWorld.setSpawn(x, y, z);
    } else if (ui.selectedTool === 'GOAL') {
        // Set goal
        editorWorld.setGoal(x, y, z);
    } else {
        // Place selected block
        const dist = ui.movingDistance;
        editorWorld.addBlock(x, y, z, ui.selectedTool, dist);
    }
    ui.syncJSON();
}

// Mouse events
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

canvas.addEventListener('mousedown', (e) => {
    isMouseDown = true;
    mouseButton = e.button;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    updateHoveredCell(e.clientX, e.clientY);

    if (editorCamera.mode === 'edit') {
        // In edit mode: middle click or shift+drag pans camera
        if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
            isPanning = true;
        } else if (e.button === 0) {
            // Left click: place or erase (if eraser selected)
            isPainting = true;
            applyActionAtHovered(0);
        } else if (e.button === 2) {
            // Right click: erase
            isErasing = true;
            applyActionAtHovered(2);
        }
    } else {
        // In 3D inspect mode:
        if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
            isPanning = true;
        }
    }
});

window.addEventListener('mousemove', (e) => {
    updateHoveredCell(e.clientX, e.clientY);

    if (!isMouseDown) return;

    const dx = e.clientX - lastMouseX;
    const dy = e.clientY - lastMouseY;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    if (isPanning) {
        const panSpeed = editorCamera.distance * 0.0012;
        editorCamera.pan(-dx * panSpeed, dy * panSpeed);
    } else if (editorCamera.mode === 'inspect') {
        if (mouseButton === 0 || mouseButton === 2) {
            editorCamera.rotate(-dx * 0.006, -dy * 0.006);
        }
    } else if (editorCamera.mode === 'edit') {
        if (isPainting) {
            applyActionAtHovered(0);
        } else if (isErasing) {
            applyActionAtHovered(2);
        }
    }
});

window.addEventListener('mouseup', () => {
    isMouseDown = false;
    isPanning = false;
    isPainting = false;
    isErasing = false;
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    editorCamera.zoom(e.deltaY);
}, { passive: false });

// Keyboard shortcuts
window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const key = e.key.toLowerCase();

    if (key === 'f') {
        ui.toggleMode();
    } else if (key === 'q') {
        ui.setLayer(editorWorld.activeLayer - 1);
    } else if (key === 'e') {
        ui.setLayer(editorWorld.activeLayer + 1);
    } else if (key === '1') {
        ui.setSelectedTool('GRASS');
    } else if (key === '2') {
        ui.setSelectedTool('ROCK');
    } else if (key === '3') {
        ui.setSelectedTool('SNOW');
    } else if (key === '4') {
        ui.setSelectedTool('CLOUD');
    } else if (key === '5') {
        ui.setSelectedTool('RAINBOW');
    } else if (key === '6') {
        ui.setSelectedTool('MOVING_X');
    } else if (key === '7') {
        ui.setSelectedTool('MOVING_Z');
    } else if (key === 'x' || e.code === 'Delete' || e.code === 'Backspace') {
        ui.setSelectedTool('ERASER');
    } else if (key === 's') {
        ui.setSelectedTool('SPAWN');
    } else if (key === 'g') {
        ui.setSelectedTool('GOAL');
    } else if (key === 'r') {
        editorWorld.regenerate(true);
    } else if (key === 'o' || key === 'p') {
        const json = editorWorld.exportJSON();
        ui.jsonTextarea.value = json;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(json);
        }
    }
});

// Render loop
function loop() {
    renderer.render(editorWorld, hoveredCell, ui.selectedTool);
    ui.updateOverlay(hoveredCell);
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
