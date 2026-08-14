// export function worldToView(x, y, z, camera) {
//     let relX = x - camera.x;
//     let relY = y - camera.y;
//     let relZ = z - camera.z;

//     const cosYaw = Math.cos(-camera.yaw);
//     const sinYaw = Math.sin(-camera.yaw);
//     const x1 = relX * cosYaw - relZ * sinYaw;
//     const z1 = relX * sinYaw + relZ * cosYaw;

//     const cosPitch = Math.cos(-camera.pitch);
//     const sinPitch = Math.sin(-camera.pitch);
//     const y1 = relY * cosPitch - z1 * sinPitch;
//     const z2 = relY * sinPitch + z1 * cosPitch;

//     return [x1, y1, z2];
// }

export function worldToView(x, y, z, camera) {
    // oförändrad – translation + rotation, ingen ändring här
    let relX = x - camera.x;
    let relY = y - camera.y;
    let relZ = z - camera.z;

    const cosYaw = Math.cos(-camera.yaw);
    const sinYaw = Math.sin(-camera.yaw);
    const x1 = relX * cosYaw - relZ * sinYaw;
    const z1 = relX * sinYaw + relZ * cosYaw;

    const cosPitch = Math.cos(-camera.pitch);
    const sinPitch = Math.sin(-camera.pitch);
    const y1 = relY * cosPitch - z1 * sinPitch;
    const z2 = relY * sinPitch + z1 * cosPitch;

    return [x1, y1, z2];
}

// export function project(x, y, z, focalLength = 1.5) {
//     if (z <= 0.01) return null;
//     return [(x / z) * focalLength, (y / z) * focalLength];
// }
