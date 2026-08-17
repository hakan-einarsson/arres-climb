import { camera } from './camera.js';
import { player } from './player.js';
import { rotateY } from './update.js';

const keys = {};
const leftMouseDown = { value: false };
const JUMP_CUTOFF_FACTOR = 0.4; // hur mycket vy behålls om du släpper tidigt
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;

    if (e.code === 'Space') {
        player.jumpBufferTimer = 0.1;
    }
});
window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;

    if (e.code === 'Space' && player.vy > 0) {
        player.vy *= JUMP_CUTOFF_FACTOR; // jump cutoff, oförändrad
    }
});


const mouseDelta = { x: 0, y: 0 };

export function initPointer(canvas) {
    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
            canvas.requestPointerLock();
            leftMouseDown.value = true;
        }
    });
    window.addEventListener('mouseup', (e) => {
        if (document.pointerLockElement === canvas && e.button === 0) {
            document.exitPointerLock();
        }
        if (e.button === 0) leftMouseDown.value = false;
    });

    document.addEventListener('mousemove', (e) => {
        if (leftMouseDown.value) {
            mouseDelta.x += e.movementX;
            mouseDelta.y += e.movementY;
        }
    });
}

export function update() {
    const sensitivity = 0.002;
    const maxMouseDeltaPerFrame = 50;

    const dx = Math.max(-maxMouseDeltaPerFrame, Math.min(maxMouseDeltaPerFrame, mouseDelta.x));
    const dy = Math.max(-maxMouseDeltaPerFrame, Math.min(maxMouseDeltaPerFrame, mouseDelta.y));
    camera.rotate(dx * sensitivity, dy * sensitivity);
    mouseDelta.x = 0;
    mouseDelta.y = 0;

    let moveX = 0, moveZ = 0;
    if (keys['w']) moveZ += 1;
    if (keys['s']) moveZ -= 1;
    if (keys['a']) moveX -= 1;
    if (keys['d']) moveX += 1;

    const moveLength = Math.hypot(moveX, moveZ);
    if (moveLength > 0) {
        moveX /= moveLength;
        moveZ /= moveLength;
    }

    if (moveX < 0) {
        player.facing = -1;
    } else if (moveX > 0) {
        player.facing = 1;
    }

    const [rotX, rotZ] = rotateY(moveX, moveZ, camera.yaw);
    player.vx = rotX * player.speed;
    player.vz = rotZ * player.speed;

    camera.followTarget(player); // sista steget varje frame: synka kamerans position till spelaren
}