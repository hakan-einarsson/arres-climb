import { camera } from './camera.js';
import { player } from './player.js';
import { rotateY } from './update.js';
import { getGamepadState } from './gamepad.js';
import { playCameraRotate, toggleMute, unlockAudio } from './audio.js';
import { levelManager } from './levelManager.js';

const keys = {};
const leftMouseDown = { value: false };
const JUMP_CUTOFF_FACTOR = 0.4;
const MIN_DISTANCE = 1.5;
const MAX_DISTANCE = 8;
const CAMERA_ZOOM_SPEED = 5;

function updateMuteState() {
    const muted = toggleMute();
    levelManager.showBanner(muted ? 'Muted' : 'Sound On', 1.2);
    const bm = document.getElementById('bm');
    if (bm) {
        bm.style.opacity = muted ? '0.4' : '1.0';
        bm.style.textDecoration = muted ? 'line-through' : 'none';
        bm.style.borderColor = muted ? '#8b949e' : '#58a6ff';
    }
}

window.addEventListener('keydown', (e) => {
    unlockAudio();
    if (e.repeat) return;
    keys[e.key.toLowerCase()] = true;

    if (e.code === 'Space') {
        player.jumpBufferTimer = 0.12;
    }

    if (e.key === 'm' || e.key === 'M') {
        updateMuteState();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;

    if (e.code === 'Space' && player.isJumping && player.vy > 0) {
        player.vy *= JUMP_CUTOFF_FACTOR;
        player.isJumping = false;
    }
});

const mouseDelta = { x: 0, y: 0 };

let touchMoveX = 0, touchMoveZ = 0;
let touchRotateL = false, touchRotateR = false;
let touchZoomIn = false, touchZoomOut = false;

export function initTouchControls() {
    const touchUI = document.getElementById('t-ui');
    const dpad = document.getElementById('t-pad');
    const stick = document.getElementById('t-stk');

    if (!touchUI || !dpad) return;

    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        touchUI.style.display = 'block';
    }

    let touchId = null;
    let centerX = 0, centerY = 0;
    const maxRadius = 44;
    const deadzone = 18;

    const handleTouch = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            if (t.identifier === touchId) {
                const dx = t.clientX - centerX;
                const dy = t.clientY - centerY;
                const dist = Math.hypot(dx, dy);
                const clamped = Math.min(dist, maxRadius);
                const angle = Math.atan2(dy, dx);

                if (stick) {
                    stick.style.transform = `translate(${Math.cos(angle) * clamped}px, ${Math.sin(angle) * clamped}px)`;
                }

                if (dist > deadzone) {
                    const norm = (dist - deadzone) / (maxRadius - deadzone);
                    touchMoveX = (dx / dist) * norm;
                    touchMoveZ = (-dy / dist) * norm;
                } else {
                    touchMoveX = 0;
                    touchMoveZ = 0;
                }
            }
        }
    };

    dpad.addEventListener('touchstart', (e) => {
        unlockAudio();
        e.preventDefault();
        const rect = dpad.getBoundingClientRect();
        centerX = rect.left + rect.width / 2;
        centerY = rect.top + rect.height / 2;
        touchId = e.changedTouches[0].identifier;
        handleTouch(e);
    }, { passive: false });

    dpad.addEventListener('touchmove', (e) => {
        e.preventDefault();
        handleTouch(e);
    }, { passive: false });

    const endTouch = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === touchId) {
                touchId = null;
                touchMoveX = 0;
                touchMoveZ = 0;
                if (stick) stick.style.transform = 'translate(0px, 0px)';
            }
        }
    };

    dpad.addEventListener('touchend', endTouch);
    dpad.addEventListener('touchcancel', endTouch);

    const bindBtn = (id, onStart, onEnd) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.addEventListener('touchstart', (e) => {
            unlockAudio();
            e.preventDefault();
            onStart();
        }, { passive: false });
        if (onEnd) btn.addEventListener('touchend', onEnd);
    };

    bindBtn('bm', updateMuteState);
    bindBtn('bj', () => player.jumpBufferTimer = 0.12, () => {
        if (player.isJumping && player.vy > 0) {
            player.vy *= JUMP_CUTOFF_FACTOR;
            player.isJumping = false;
        }
    });
    bindBtn('brl', () => touchRotateL = true);
    bindBtn('brr', () => touchRotateR = true);
    bindBtn('bzi', () => touchZoomIn = true, () => touchZoomIn = false);
    bindBtn('bzo', () => touchZoomOut = true, () => touchZoomOut = false);
}

export function initPointer(canvas) {
    initTouchControls();

    canvas.addEventListener('mousedown', (e) => {
        unlockAudio();
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

function snap8Way(x, z) {
    const len = Math.hypot(x, z);
    if (len < 0.2) return [0, 0];
    const angle = Math.atan2(z, x);
    const snapped = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
    return [Math.cos(snapped), Math.sin(snapped)];
}

export function update(dt) {
    const input = getInputState();

    if (input.zoomIn) camera.distance = Math.max(MIN_DISTANCE, camera.distance - CAMERA_ZOOM_SPEED * dt);
    if (input.zoomOut) camera.distance = Math.min(MAX_DISTANCE, camera.distance + CAMERA_ZOOM_SPEED * dt);

    if (keys['e'] || input.rotateRight) {
        camera.rotateStep(1);
        keys['e'] = false;
        playCameraRotate();
    }
    if (keys['q'] || input.rotateLeft) {
        camera.rotateStep(-1);
        keys['q'] = false;
        playCameraRotate();
    }

    const [snappedX, snappedZ] = snap8Way(input.moveX, input.moveZ);
    const moveLength = Math.hypot(snappedX, snappedZ);

    if (moveLength > 0) {
        const [rotX, rotZ] = rotateY(snappedX, snappedZ, camera.yaw);
        player.aimX = rotX;
        player.aimZ = rotZ;

        if (snappedX < -0.1) player.facing = -1;
        else if (snappedX > 0.1) player.facing = 1;

        player.vx = rotX * player.speed;
        player.vz = rotZ * player.speed;
    } else {
        player.vx = 0;
        player.vz = 0;
    }

    camera.followTarget(player);
}

function getInputState() {
    const gp = getGamepadState();

    let moveX = 0, moveZ = 0;
    if (keys['w'] || keys['arrowup']) moveZ++;
    if (keys['s'] || keys['arrowdown']) moveZ--;
    if (keys['a'] || keys['arrowleft']) moveX--;
    if (keys['d'] || keys['arrowright']) moveX++;

    if (Math.abs(touchMoveX) > 0 || Math.abs(touchMoveZ) > 0) {
        moveX = touchMoveX;
        moveZ = touchMoveZ;
    }

    let zoomIn = keys['+'] || keys['='] || touchZoomIn;
    let zoomOut = keys['-'] || touchZoomOut;
    let rotateLeft = false, rotateRight = false;

    if (touchRotateL) {
        rotateLeft = true;
        touchRotateL = false;
    }
    if (touchRotateR) {
        rotateRight = true;
        touchRotateR = false;
    }

    if (gp) {
        if (Math.abs(gp.moveX) > 0 || Math.abs(gp.moveZ) > 0) {
            moveX = gp.moveX;
            moveZ = gp.moveZ;
        }
        if (gp.jumpJustPressed) {
            player.jumpBufferTimer = 0.12;
        }
        if (gp.jumpJustReleased && player.isJumping && player.vy > 0) {
            player.vy *= JUMP_CUTOFF_FACTOR;
            player.isJumping = false;
        }
        if (gp.zoomIn) zoomIn = true;
        if (gp.zoomOut) zoomOut = true;
        if (gp.rotateLeftJustPressed) rotateLeft = true;
        if (gp.rotateRightJustPressed) rotateRight = true;
    }

    return { moveX, moveZ, zoomIn, zoomOut, rotateLeft, rotateRight };
}
