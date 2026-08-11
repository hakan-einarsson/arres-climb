import { worldToScreen } from './projection.js';

function createPlane(gridX, gridZ, tileSize = 0.5) {
    const xIndex = gridX + 6; // justering för att centrera tiles
    const zIndex = gridZ + 6; // justering för att centrera tiles
    const space = 0.1; // mellanrum mellan tiles
    const x0 = gridX * tileSize;
    const x0Adjusted = x0 + xIndex * space - tileSize; // justering för mellanrum
    const x1 = x0 + tileSize;
    const x1Adjusted = x1 + xIndex * space - tileSize; // justering för mellanrum
    const z0 = gridZ * tileSize;
    const z0Adjusted = z0 + zIndex * space; // justering för mellanrum
    const z1 = z0 + tileSize;
    const z1Adjusted = z1 + zIndex * space; // justering för mellanrum
    const y = -1; // golvhöjd, konstant

    return [
        [x0Adjusted, y, z0Adjusted], [x1Adjusted, y, z0Adjusted], [x1Adjusted, y, z1Adjusted],
        [x0Adjusted, y, z0Adjusted], [x1Adjusted, y, z1Adjusted], [x0Adjusted, y, z1Adjusted],
    ];
}

export function buildFrame(camera, tilemap) {
    const vertices2D = [];

    for (let gridZ = 0; gridZ < 12; gridZ++) {
        for (let gridX = 0; gridX < 12; gridX++) {
            const quad3D = createPlane(gridX - 6, gridZ - 6);
            for (const [x, y, z] of quad3D) {
                const p = worldToScreen(x, y, z, camera, 1.5);
                if (p) vertices2D.push(p[0], p[1]);
            }
        }
    }

    return new Float32Array(vertices2D);
}

function projectTriangle(p1, p2, p3, camera, focalLength) {
    const a = worldToScreen(p1[0], p1[1], p1[2], camera, focalLength);
    const b = worldToScreen(p2[0], p2[1], p2[2], camera, focalLength);
    const c = worldToScreen(p3[0], p3[1], p3[2], camera, focalLength);

    if (!a || !b || !c) return null; // nån punkt bakom/nära kameran -> skippa hela triangeln

    return [a[0], a[1], b[0], b[1], c[0], c[1]];
}

export function render(renderer) {
    const camera = renderer.camera;
    const vertices2D = [];

    for (let gridZ = 0; gridZ < 12; gridZ++) {
        for (let gridX = 0; gridX < 12; gridX++) {
            const quad3D = createPlane(gridX - 6, gridZ - 6);

            // quad3D = [p1,p2,p3, p4,p5,p6] -> två trianglar
            const tri1 = projectTriangle(quad3D[0], quad3D[1], quad3D[2], camera, 1.5);
            const tri2 = projectTriangle(quad3D[3], quad3D[4], quad3D[5], camera, 1.5);

            if (tri1) vertices2D.push(...tri1);
            if (tri2) vertices2D.push(...tri2);
        }
    }

    renderer.addObjectToRender(vertices2D);
}
