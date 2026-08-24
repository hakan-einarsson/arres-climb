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

export function projectBillboard(x, y, z, camera, width, height, uv, scaleX = 1.0, flipX = false) {
    const dx = camera.x - x;
    const dz = camera.z - z;
    const len = Math.sqrt(dx * dx + dz * dz) || 1;
    const dirX = dx / len;
    const dirZ = dz / len;

    const rightX = dirZ;
    const rightZ = -dirX;

    const halfW = (width / 2) * scaleX;
    const leftX = x - halfW * rightX;
    const leftZ = z - halfW * rightZ;
    const rightPX = x + halfW * rightX;
    const rightPZ = z + halfW * rightZ;

    const bl = worldToView(leftX, y, leftZ, camera);
    const br = worldToView(rightPX, y, rightPZ, camera);
    const tl = worldToView(leftX, y + height, leftZ, camera);
    const tr = worldToView(rightPX, y + height, rightPZ, camera);

    if (bl[2] <= 0.3 || br[2] <= 0.3) return null;

    let { u0, v0, u1, v1 } = uv;
    if (flipX || scaleX < 0) {
        const tmp = u0;
        u0 = u1;
        u1 = tmp;
    }

    const vertices = [
        bl[0], bl[1], bl[2], u0, v1,
        br[0], br[1], br[2], u1, v1,
        tr[0], tr[1], tr[2], u1, v0,

        bl[0], bl[1], bl[2], u0, v1,
        tr[0], tr[1], tr[2], u1, v0,
        tl[0], tl[1], tl[2], u0, v0,
    ];

    const depth = (bl[2] + br[2]) / 2;
    return { vertices, depth };
}
