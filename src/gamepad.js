let gamepadIndex = null;
let prevRotL = false, prevRotR = false, prevJump = false;

window.addEventListener('gamepadconnected', e => gamepadIndex = e.gamepad.index);
window.addEventListener('gamepaddisconnected', () => gamepadIndex = null);

export function getGamepadState() {
    if (gamepadIndex === null) return null;
    const gp = navigator.getGamepads()[gamepadIndex];
    if (!gp) return null;

    const dz = v => Math.abs(v) < 0.15 ? 0 : v;
    const btn = i => gp.buttons[i]?.pressed || false;

    const jumpRaw = btn(0);
    const jumpJustPressed = jumpRaw && !prevJump;
    const jumpJustReleased = !jumpRaw && prevJump;
    prevJump = jumpRaw;

    let moveX = dz(gp.axes[0]);
    let moveZ = -dz(gp.axes[1]);

    if (btn(12)) moveZ = 1;
    if (btn(13)) moveZ = -1;
    if (btn(14)) moveX = -1;
    if (btn(15)) moveX = 1;

    const rotL = btn(4);
    const rotR = btn(5);
    const rotateLeftJustPressed = rotL && !prevRotL;
    const rotateRightJustPressed = rotR && !prevRotR;
    prevRotL = rotL;
    prevRotR = rotR;

    return {
        moveX, moveZ,
        jumpJustPressed,
        jumpJustReleased,
        zoomIn: btn(1),
        zoomOut: btn(2),
        rotateLeftJustPressed,
        rotateRightJustPressed
    };
}
