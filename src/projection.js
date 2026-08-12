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

export function worldToScreen(x, y, z, camera, focalLength) {
    const [vx, vy, vz] = worldToView(x, y, z, camera);
    return project(vx, vy, vz, focalLength);
}

export function projectTriangle(p1, p2, p3, camera, focalLength) {
    const va = worldToView(p1[0], p1[1], p1[2], camera);
    const vb = worldToView(p2[0], p2[1], p2[2], camera);
    const vc = worldToView(p3[0], p3[1], p3[2], camera);

    const a = project(va[0], va[1], va[2], focalLength);
    const b = project(vb[0], vb[1], vb[2], focalLength);
    const c = project(vc[0], vc[1], vc[2], focalLength);

    if (!a || !b || !c) return null;

    // Varje vertex blir nu [x, y, u, v] istället för bara [x, y]
    const vertices = [
        a[0], a[1], p1[3], p1[4],
        b[0], b[1], p2[3], p2[4],
        c[0], c[1], p3[3], p3[4],
    ];

    const depth = (va[2] + vb[2] + vc[2]) / 3;
    return { vertices, depth };
}