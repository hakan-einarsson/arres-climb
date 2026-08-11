export const keys = {};

window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

export const mouseDelta = { x: 0, y: 0 };

export function initPointerLock(canvas) {
    canvas.addEventListener('click', () => {
        canvas.requestPointerLock();
    });

    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === canvas) {
            mouseDelta.x += e.movementX;
            mouseDelta.y += e.movementY;
        }
    });
}