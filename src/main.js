import { init } from './init.js';
import { update } from './update.js';
import { render } from './render.js';
import { camera } from './camera.js';
import Renderer from './Renderer.js';
import { initPointer } from './input.js';
import { addGameObject } from './gameObjects.js';
import { player } from './player.js';
import { unlockAudio } from './audio.js';
import { getSavedLevel, levelManager, resetProgress } from './levelManager.js';
import textureUrl from './assets/textures.png';

window.addEventListener('pointerdown', unlockAudio, { once: true });
window.addEventListener('keydown', unlockAudio, { once: true });
window.addEventListener('touchstart', unlockAudio, { once: true });

const app = document.getElementById('app');
const canvas = document.createElement('canvas');
app.appendChild(canvas);

const renderer = new Renderer(canvas, camera, 16 / 9);
addGameObject(player);

function resizeCanvas() {
  const targetAspect = 16 / 9;
  const winW = window.innerWidth;
  const winH = window.innerHeight;
  let w, h;
  if (winW / winH > targetAspect) {
    h = winH;
    w = Math.floor(winH * targetAspect);
  } else {
    w = winW;
    h = Math.floor(winW / targetAspect);
  }
  canvas.width = w;
  canvas.height = h;
  renderer.resize(w, h);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
initPointer(canvas);

// Title Screen & Save progress setup
let isGameStarted = false;
const titleScreen = document.getElementById('ts');
const logoCvs = document.getElementById('logo');
const btnGroup = document.getElementById('bg');
const startBtn = document.getElementById('sb');

if (logoCvs) {
  const ctx = logoCvs.getContext('2d');
  const img = new Image();
  img.onload = () => {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 32, 16, 32, 16, 0, 0, logoCvs.width, logoCvs.height);
  };
  img.src = textureUrl;
}

const savedLvl = getSavedLevel();
if (savedLvl > 0 && btnGroup && startBtn) {
  startBtn.textContent = `CONTINUE (LEVEL ${savedLvl + 1})`;
  const newGameBtn = document.createElement('button');
  newGameBtn.className = 'btn btn-s';
  newGameBtn.textContent = 'NEW GAME';
  newGameBtn.onclick = () => {
    resetProgress();
    startGame(0);
  };
  btnGroup.appendChild(newGameBtn);
  startBtn.onclick = () => startGame(savedLvl);
} else if (startBtn) {
  startBtn.onclick = () => startGame(0);
}

function startGame(lvlIndex = 0) {
  unlockAudio();
  isGameStarted = true;
  if (titleScreen) titleScreen.style.display = 'none';
  levelManager.loadLevel(lvlIndex);
}

let lastTime = 0;
let devUpdate = null;
let devRender = null;

function gameLoop(time) {
  let dt = (time - lastTime) / 1000;
  dt = Math.min(dt, 1 / 30);
  lastTime = time;

  if (isGameStarted) {
    update(dt);
  } else {
    camera.yaw += dt * 0.25;
    camera.followTarget(player);
  }

  if (devUpdate) devUpdate(dt);

  render(renderer);
  if (devRender) devRender(renderer);

  renderer.draw();
  requestAnimationFrame(gameLoop);
}

init();

if (import.meta.env.DEV) {
  import('./devMode.js').then(({ devMode }) => {
    devMode.init();
    devUpdate = (dt) => devMode.update(dt);
    devRender = (r) => devMode.render(r);
  });
}

requestAnimationFrame(gameLoop);
