import { init } from './init.js';
import { update } from './update.js';
import { render } from './render.js';
import { camera } from './camera.js';
import Renderer from './renderer.js';
import { mouseDelta, initPointerLock } from './input.js';

const app = document.getElementById('app');
const canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
app.appendChild(canvas);
canvas.style.display = 'block';
canvas.style.margin = '0 auto';

initPointerLock(canvas);

const renderer = new Renderer(canvas, camera);

let lastTime = 0;

function gameLoop(time) {
  const dt = (time - lastTime) / 1000; // sekunder
  lastTime = time;

  update(dt);
  render(renderer);
  renderer.draw();

  requestAnimationFrame(gameLoop);
}

init();
requestAnimationFrame(gameLoop);