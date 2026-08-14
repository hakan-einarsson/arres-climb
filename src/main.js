import { init } from './init.js';
import { update } from './update.js';
import { render } from './render.js';
import { camera } from './camera.js';
import Renderer from './renderer.js';
import { initPointer } from './input.js';
import World from './world.js';
import { gameObjects, addGameObject } from './gameObjects.js';
import { player } from './player.js';

const app = document.getElementById('app');
const canvas = document.createElement('canvas');
canvas.width = window.innerHeight * (16 / 9); // 16:9 aspect ratio
canvas.height = window.innerHeight;
app.appendChild(canvas);
canvas.style.display = 'block';
canvas.style.margin = '0 auto';

const aspectRatio = canvas.width / canvas.height;
initPointer(canvas);

const renderer = new Renderer(canvas, camera, aspectRatio);
const world = new World();
world.init();
addGameObject(player);

let lastTime = 0;

// function gameLoop(time) {
//   const dt = (time - lastTime) / 1000; // sekunder
//   lastTime = time;

//   update(dt);
//   render(renderer);
//   renderer.draw();

//   requestAnimationFrame(gameLoop);
// }
function gameLoop(time) {
  let dt = (time - lastTime) / 1000;
  dt = Math.min(dt, 1 / 30); // aldrig hoppa mer än vad 30fps skulle motsvara
  lastTime = time;

  update(dt);
  render(renderer);
  renderer.draw();

  requestAnimationFrame(gameLoop);
}

init();
requestAnimationFrame(gameLoop);