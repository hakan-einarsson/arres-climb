import { worldToScreen } from './projection.js';

// world.js
import { projectTriangle } from './projection.js'; // eller där den nu bor

class World {
    constructor(size = 12, holeChance = 0.1, space = 0.1) {
        this.size = size;
        this.holeChance = holeChance;
        this.space = space;
        this.tilemap = null;
    }

    init() {
        this.tilemap = this.generateTilemap();
        // eventuella initialiseringar
    }

    generateTilemap() {
        const map = [];
        for (let z = 0; z < this.size; z++) {
            const row = [];
            for (let x = 0; x < this.size; x++) {
                row.push(Math.random() < this.holeChance ? 0 : 1);
            }
            map.push(row);
        }
        return map;
    }

    createPlane(gridX, gridZ, tileSize = 0.5, space = 0.1) {
        const xIndex = gridX + 6; // justering för att centrera tiles
        const zIndex = gridZ + 6; // justering för att centrera tiles
        // const space = 0.1; // mellanrum mellan tiles
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

    render(renderer) {
        const camera = renderer.camera;
        const vertices2D = [];

        this.tilemap.forEach((row, gridZ) => {
            row.forEach((tile, gridX) => {
                if (tile === 0) return; // hål, hoppa över

                const quad3D = this.createPlane(gridX - row.length / 2, gridZ - this.tilemap.length / 2, 0.5, this.space);
                const tri1 = projectTriangle(quad3D[0], quad3D[1], quad3D[2], camera, 1.5);
                const tri2 = projectTriangle(quad3D[3], quad3D[4], quad3D[5], camera, 1.5);
                if (tri1) vertices2D.push(...tri1);
                if (tri2) vertices2D.push(...tri2);
            });
        });

        renderer.addObjectToRender(vertices2D);
    }
}

export default World;


// export function buildFrame(camera, tilemap) {
//     const vertices2D = [];

//     for (let gridZ = 0; gridZ < 12; gridZ++) {
//         for (let gridX = 0; gridX < 12; gridX++) {
//             const quad3D = createPlane(gridX - 6, gridZ - 6);
//             for (const [x, y, z] of quad3D) {
//                 const p = worldToScreen(x, y, z, camera, 1.5);
//                 if (p) vertices2D.push(p[0], p[1]);
//             }
//         }
//     }

//     return new Float32Array(vertices2D);
// }

// function projectTriangle(p1, p2, p3, camera, focalLength) {
//     const a = worldToScreen(p1[0], p1[1], p1[2], camera, focalLength);
//     const b = worldToScreen(p2[0], p2[1], p2[2], camera, focalLength);
//     const c = worldToScreen(p3[0], p3[1], p3[2], camera, focalLength);

//     if (!a || !b || !c) return null; // nån punkt bakom/nära kameran -> skippa hela triangeln

//     return [a[0], a[1], b[0], b[1], c[0], c[1]];
// }

// const gridSize = 16;
// const holeChance = 0.1; // 10% chans att en tile är ett hål

// function generateTilemap(size, holeChance) {
//     const map = [];
//     for (let z = 0; z < size; z++) {
//         const row = [];
//         for (let x = 0; x < size; x++) {
//             row.push(Math.random() < holeChance ? 0 : 1);
//         }
//         map.push(row);
//     }
//     return map;
// }

// const tilemap = generateTilemap(gridSize, holeChance);

// export function render(renderer) {
//     const camera = renderer.camera;
//     const vertices2D = [];

//     tilemap.forEach((row, gridZ) => {
//         row.forEach((tile, gridX) => {
//             if (tile === 1) { // bara rendera om det inte är ett hål
//                 const quad3D = createPlane(gridX - row.length / 2, gridZ - tilemap.length / 2);
//                 const tri1 = projectTriangle(quad3D[0], quad3D[1], quad3D[2], camera, 1.5);
//                 const tri2 = projectTriangle(quad3D[3], quad3D[4], quad3D[5], camera, 1.5);
//                 if (tri1) vertices2D.push(...tri1);
//                 if (tri2) vertices2D.push(...tri2);
//             }
//         });
//     });

//     renderer.addObjectToRender(vertices2D);
// }
