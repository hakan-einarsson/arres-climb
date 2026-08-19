import { camera } from './camera.js';
import { player } from './player.js';
import { rotateY } from './update.js';
import { getGamepadState } from './gamepad.js';

const keys = {};
const leftMouseDown = { value: false };
const JUMP_CUTOFF_FACTOR = 0.4; // hur mycket vy behålls om du släpper tidigt
const MIN_DISTANCE = 1.5;
const MAX_DISTANCE = 8;
const CAMERA_ZOOM_SPEED = 5;

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

// export function update(dt) {
//     const sensitivity = 0.002;
//     const maxMouseDeltaPerFrame = 50;

//     const dx = Math.max(-maxMouseDeltaPerFrame, Math.min(maxMouseDeltaPerFrame, mouseDelta.x));
//     const dy = Math.max(-maxMouseDeltaPerFrame, Math.min(maxMouseDeltaPerFrame, mouseDelta.y));
//     // camera.rotate(dx * sensitivity, dy * sensitivity);
//     mouseDelta.x = 0;
//     mouseDelta.y = 0;

//     let moveX = 0, moveZ = 0;
//     if (keys['w']) moveZ += 1;
//     if (keys['s']) moveZ -= 1;
//     if (keys['a']) moveX -= 1;
//     if (keys['d']) moveX += 1;
//     if (keys['+'] || keys['=']) camera.distance = Math.max(MIN_DISTANCE, camera.distance - CAMERA_ZOOM_SPEED * dt);
//     if (keys['-']) camera.distance = Math.min(MAX_DISTANCE, camera.distance + CAMERA_ZOOM_SPEED * dt);

//     if (keys['e']) {
//         camera.rotateStep(1);
//         keys['e'] = false; // förhindra kontinuerlig rotation medan tangenten hålls nere
//     }
//     if (keys['q']) {
//         camera.rotateStep(-1);
//         keys['q'] = false; // förhindra kontinuerlig rotation medan tangenten hålls nere
//     }

//     // if (keys['r']) player.destroyBlock();
//     // if (keys['f']) {
//     //     player.creatingBlock = !player.creatingBlock; // toggle creating block mode
//     //     keys['f'] = false; // prevent continuous toggling while holding the key
//     // }

//     const moveLength = Math.hypot(moveX, moveZ);
//     if (moveLength > 0) {
//         moveX /= moveLength;
//         moveZ /= moveLength;
//     }

//     if (moveX < 0) {
//         player.facing = -1;
//     } else if (moveX > 0) {
//         player.facing = 1;
//     }

//     const [rotX, rotZ] = rotateY(moveX, moveZ, camera.yaw);
//     player.vx = rotX * player.speed;
//     player.vz = rotZ * player.speed;

//     camera.followTarget(player); // sista steget varje frame: synka kamerans position till spelaren
// }

export function update(dt) {
    const input = getInputState();

    if (input.zoomIn) camera.distance = Math.max(MIN_DISTANCE, camera.distance - CAMERA_ZOOM_SPEED * dt);
    if (input.zoomOut) camera.distance = Math.min(MAX_DISTANCE, camera.distance + CAMERA_ZOOM_SPEED * dt);

    if (keys['e'] || input.rotateRight) {
        camera.rotateStep(1);
        keys['e'] = false;
    }
    if (keys['q'] || input.rotateLeft) {
        camera.rotateStep(-1);
        keys['q'] = false;
    }

    let moveX = input.moveX, moveZ = input.moveZ;
    const moveLength = Math.hypot(moveX, moveZ);
    if (moveLength > 0) {
        moveX /= moveLength;
        moveZ /= moveLength;
    }

    if (moveX < 0) player.facing = -1;
    else if (moveX > 0) player.facing = 1;

    const [rotX, rotZ] = rotateY(moveX, moveZ, camera.yaw);
    player.vx = rotX * player.speed;
    player.vz = rotZ * player.speed;

    if (input.jumpPressed) player.jumpBufferTimer = 0.1;

    camera.followTarget(player);
}

function getInputState() {
    const gp = getGamepadState();

    let moveX = 0, moveZ = 0;
    if (keys['w']) moveZ += 1;
    if (keys['s']) moveZ -= 1;
    if (keys['a']) moveX -= 1;
    if (keys['d']) moveX += 1;

    let jumpPressed = false; // hanteras separat nedan pga buffer-logik, se kommentar
    let zoomIn = keys['+'] || keys['='];
    let zoomOut = keys['-'];
    let rotateLeft = false, rotateRight = false;

    if (gp) {
        // Om gamepad-stick rör sig, låt det override:a tangentbordet
        if (Math.abs(gp.moveX) > 0 || Math.abs(gp.moveZ) > 0) {
            moveX = gp.moveX;
            moveZ = gp.moveZ;
        }
        if (gp.jumpPressed) jumpPressed = true;
        if (gp.zoomIn) zoomIn = true;
        if (gp.zoomOut) zoomOut = true;
        if (gp.rotateLeftJustPressed) rotateLeft = true;
        if (gp.rotateRightJustPressed) rotateRight = true;
        if (gp.jumpJustPressed) jumpPressed = true; // bara vid övergång, inte hela tiden
    }

    return { moveX, moveZ, jumpPressed, zoomIn, zoomOut, rotateLeft, rotateRight };
}