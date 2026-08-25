import { gameObjects } from './gameObjects.js';
import Tile from './tile.js';
import MovingBlock from './movingBlock.js';
import { TILE_SIZE } from './tile.js';
import { playJump, playLand, playRainbowBounce } from './audio.js';

const GRAVITY = -9.8;

function getNearbySolids(entity) {
    const minX = entity.x - TILE_SIZE * 1.5;
    const maxX = entity.x + TILE_SIZE * 1.5;
    const minZ = entity.z - TILE_SIZE * 1.5;
    const maxZ = entity.z + TILE_SIZE * 1.5;
    const minY = entity.y - TILE_SIZE * 1.5;
    const maxY = entity.y + TILE_SIZE * 2.0;

    const solids = [];

    for (const obj of gameObjects) {
        if (obj instanceof Tile && obj.type !== 'HOLE') {
            const cx = obj.gridX * TILE_SIZE + TILE_SIZE / 2;
            const cy = obj.gridY * TILE_SIZE + TILE_SIZE / 2;
            const cz = obj.gridZ * TILE_SIZE + TILE_SIZE / 2;

            if (cx >= minX && cx <= maxX && cz >= minZ && cz <= maxZ && cy >= minY && cy <= maxY) {
                solids.push({ obj, center: { x: cx, y: cy, z: cz } });
            }
        } else if (obj instanceof MovingBlock) {
            const cx = obj.x + TILE_SIZE / 2;
            const cy = obj.y + TILE_SIZE / 2;
            const cz = obj.z + TILE_SIZE / 2;

            if (cx >= minX && cx <= maxX && cz >= minZ && cz <= maxZ && cy >= minY && cy <= maxY) {
                solids.push({ obj, center: { x: cx, y: cy, z: cz } });
            }
        }
    }

    return solids;
}

function boxesOverlap(aX, aY, aZ, aSize, bX, bY, bZ, bSize) {
    return Math.abs(aX - bX) < (aSize.x + bSize.x) / 2 &&
        Math.abs(aY - bY) < (aSize.y + bSize.y) / 2 &&
        Math.abs(aZ - bZ) < (aSize.z + bSize.z) / 2;
}

function moveAxis(entity, axis, delta) {
    if (delta === 0) return;

    const testPos = { x: entity.x, y: entity.y, z: entity.z };
    testPos[axis] += delta;

    const size = { x: entity.width, y: entity.height, z: entity.depth };
    const testCenterY = testPos.y + entity.height / 2;
    const nearby = getNearbySolids(entity);
    const tileSize = { x: TILE_SIZE, y: TILE_SIZE, z: TILE_SIZE };

    for (const solid of nearby) {
        if (boxesOverlap(testPos.x, testCenterY, testPos.z, size, solid.center.x, solid.center.y, solid.center.z, tileSize)) {
            if (axis === 'y' && entity.vy <= 0) {
                // Katapult-block: Slungar spelaren högt upp i luften vid beröring
                if (solid.obj.type === 'RAINBOW') {
                    entity.y = solid.center.y + TILE_SIZE / 2 + 0.02;
                    entity.vy = 8.5;
                    entity.grounded = false;
                    entity.coyoteTimer = 0;
                    entity.jumpBufferTimer = 0;
                    entity.groundPlatform = null;
                    playRainbowBounce();
                    return;
                }

                if (!entity.grounded && entity.vy < -2.0) {
                    playLand();
                }

                entity.grounded = true;
                if (solid.obj instanceof MovingBlock) {
                    entity.groundPlatform = solid.obj;
                }
            }
            entity['v' + axis] = 0;
            return;
        }
    }

    entity[axis] = testPos[axis];
}

export function updatePhysics(entity, dt) {
    // Om spelaren står på en rörlig plattform, bär med spelaren
    if (entity.grounded && entity.groundPlatform) {
        entity.x += entity.groundPlatform.vx * dt;
        entity.z += entity.groundPlatform.vz * dt;
    }

    entity.grounded = false;
    entity.groundPlatform = null;

    entity.vy += GRAVITY * dt;

    moveAxis(entity, 'x', entity.vx * dt);
    moveAxis(entity, 'y', entity.vy * dt);
    moveAxis(entity, 'z', entity.vz * dt);

    // Coyote-timer
    if (entity.grounded) {
        entity.coyoteTimer = 0.1;
    } else if (entity.coyoteTimer > 0) {
        entity.coyoteTimer -= dt;
    }

    // Jump buffer-timer
    if (entity.jumpBufferTimer > 0) {
        entity.jumpBufferTimer -= dt;
    }

    // Utlös hoppet
    if (entity.jumpBufferTimer > 0 && entity.coyoteTimer > 0) {
        entity.vy = entity.jumpForce;
        entity.jumpBufferTimer = 0;
        entity.coyoteTimer = 0;
        entity.groundPlatform = null;
        playJump();
    }
}
