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

export function projectTriangle(p1, p2, p3, camera, focalLength) {
    const a = worldToScreen(p1[0], p1[1], p1[2], camera, focalLength);
    const b = worldToScreen(p2[0], p2[1], p2[2], camera, focalLength);
    const c = worldToScreen(p3[0], p3[1], p3[2], camera, focalLength);

    if (!a || !b || !c) return null; // nån punkt bakom/nära kameran -> skippa hela triangeln

    return [a[0], a[1], b[0], b[1], c[0], c[1]];
}