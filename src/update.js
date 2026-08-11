import { keys, mouseDelta } from './input.js';
import { camera } from './camera.js';

function rotateY(x, z, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return [x * cos - z * sin, x * sin + z * cos];
}

export function update(dt) {
    const sensitivity = 0.002;

    // camera.pitch += mouseDelta.y * sensitivity;

    const maxMouseDeltaPerFrame = 20; // justera efter känsla, testa dig fram

    const dx = Math.max(-maxMouseDeltaPerFrame, Math.min(maxMouseDeltaPerFrame, mouseDelta.x));
    const dy = Math.max(-maxMouseDeltaPerFrame, Math.min(maxMouseDeltaPerFrame, mouseDelta.y));

    const maxPitch = Math.PI / 2 - 0.01; // strax under 90 grader

    camera.yaw -= dx * sensitivity;
    camera.pitch += dy * sensitivity;
    camera.pitch = Math.max(-maxPitch, Math.min(maxPitch, camera.pitch));



    mouseDelta.x = 0;
    mouseDelta.y = 0;

    const speed = 3 * dt;
    let moveX = 0;
    let moveZ = 0;

    if (keys['w']) moveZ += 1;
    if (keys['s']) moveZ -= 1;
    if (keys['a']) moveX -= 1;
    if (keys['d']) moveX += 1;

    // Rotera rörelse-vektorn med kamerans yaw, så "framåt" alltid är dit du tittar
    const [rotX, rotZ] = rotateY(moveX, moveZ, camera.yaw);

    camera.x += rotX * speed;
    camera.z += rotZ * speed;
}