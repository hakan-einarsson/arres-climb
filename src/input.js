import { camera } from './camera.js';

const keys = {};
window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

const mouseDelta = { x: 0, y: 0 };

export function initPointerLock(canvas) {
    canvas.addEventListener('click', () => canvas.requestPointerLock());
    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === canvas) {
            mouseDelta.x += e.movementX;
            mouseDelta.y += e.movementY;
        }
    });
}

export function update(dt) {
    const sensitivity = 0.002;
    const maxMouseDeltaPerFrame = 20;

    const dx = Math.max(-maxMouseDeltaPerFrame, Math.min(maxMouseDeltaPerFrame, mouseDelta.x));
    const dy = Math.max(-maxMouseDeltaPerFrame, Math.min(maxMouseDeltaPerFrame, mouseDelta.y));

    camera.rotate(dx * sensitivity, dy * sensitivity);

    mouseDelta.x = 0;
    mouseDelta.y = 0;

    const speed = 3 * dt;
    let moveX = 0, moveZ = 0;
    if (keys['w']) moveZ += 1;
    if (keys['s']) moveZ -= 1;
    if (keys['a']) moveX -= 1;
    if (keys['d']) moveX += 1;

    camera.move(moveX, moveZ, speed);
}