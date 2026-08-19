// gamepad.js
let gamepadIndex = null;
let prevRotateLeft = false;
let prevRotateRight = false;
let prevJumpPressed = false;

window.addEventListener('gamepadconnected', (e) => {
    gamepadIndex = e.gamepad.index;
});
window.addEventListener('gamepaddisconnected', () => {
    gamepadIndex = null;
});

export function getGamepadState() {
    if (gamepadIndex === null) return null;

    const gp = navigator.getGamepads()[gamepadIndex];
    if (!gp) return null;

    const deadzone = 0.15;
    const applyDeadzone = (v) => Math.abs(v) < deadzone ? 0 : v;

    const jumpRaw = gp.buttons[0]?.pressed || false;
    const jumpJustPressed = jumpRaw && !prevJumpPressed;
    prevJumpPressed = jumpRaw;

    // Analog stick
    let moveX = applyDeadzone(gp.axes[0]);
    let moveZ = applyDeadzone(gp.axes[1]) * -1;

    // D-pad som fallback/komplement - override:ar sticken om nåt tryckts
    const dpadUp = gp.buttons[12]?.pressed;
    const dpadDown = gp.buttons[13]?.pressed;
    const dpadLeft = gp.buttons[14]?.pressed;
    const dpadRight = gp.buttons[15]?.pressed;

    if (dpadUp) moveZ = 1;
    if (dpadDown) moveZ = -1;
    if (dpadLeft) moveX = -1;
    if (dpadRight) moveX = 1;

    const jumpPressed = gp.buttons[0]?.pressed || false;
    const zoomIn = gp.buttons[1]?.pressed || false;  // justera efter vad som känns naturligt
    const zoomOut = gp.buttons[2]?.pressed || false;

    const rotateLeftRaw = gp.buttons[4]?.pressed || false;  // verifiera rätt index själv
    const rotateRightRaw = gp.buttons[5]?.pressed || false;

    const rotateLeftJustPressed = rotateLeftRaw && !prevRotateLeft;
    const rotateRightJustPressed = rotateRightRaw && !prevRotateRight;
    prevRotateLeft = rotateLeftRaw;
    prevRotateRight = rotateRightRaw;

    return {
        moveX, moveZ,
        jumpJustPressed, zoomIn, zoomOut,
        rotateLeftJustPressed, rotateRightJustPressed
    };
}