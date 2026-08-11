export function worldToView(x, y, z, camera) {
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

export function project(x, y, z, focalLength = 1.5) {
    if (z <= 0.1) return null;
    return [(x / z) * focalLength, (y / z) * focalLength];
}

export function worldToScreen(x, y, z, camera, focalLength) {
    const [vx, vy, vz] = worldToView(x, y, z, camera);
    return project(vx, vy, vz, focalLength);
}