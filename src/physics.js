import { gameObjects } from './gameObjects.js';
import Tile, { TILE_SIZE } from './tile.js';
import MovingBlock from './movingBlock.js';
import { playJump, playRainbowBounce } from './audio.js';

const GRAVITY = -9.8;

function getNearbySolids(entity) {
    const minX = entity.x - TILE_SIZE * 1.5, maxX = entity.x + TILE_SIZE * 1.5;
    const minZ = entity.z - TILE_SIZE * 1.5, maxZ = entity.z + TILE_SIZE * 1.5;
    const minY = entity.y - TILE_SIZE * 1.5, maxY = entity.y + TILE_SIZE * 2.0;

    const solids = [];
    for (const obj of gameObjects) {
        if (obj.type === 'HOLE') continue;
        const isTile = obj instanceof Tile;
        const isMb = obj instanceof MovingBlock;
        if (!isTile && !isMb) continue;

        const cx = (isTile ? obj.gridX : obj.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
        const cy = (isTile ? obj.gridY : obj.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
        const cz = (isTile ? obj.gridZ : obj.z / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;

        if (cx >= minX && cx <= maxX && cz >= minZ && cz <= maxZ && cy >= minY && cy <= maxY) {
            solids.push({ obj, center: { x: cx, y: cy, z: cz } });
        }
    }
    return solids;
}

export function moveAxis(entity, axis, delta) {
    if (delta === 0) return;

    const testPos = { x: entity.x, y: entity.y, z: entity.z };
    testPos[axis] += delta;

    const nearby = getNearbySolids(entity);
    const halfTile = TILE_SIZE / 2;
    const halfWidth = entity.width / 2;
    const halfDepth = entity.depth / 2;

    for (const solid of nearby) {
        const sc = solid.center;

        if (axis === 'y') {
            const overlapX = Math.abs(testPos.x - sc.x) < (halfWidth + halfTile) - 0.005;
            const overlapZ = Math.abs(testPos.z - sc.z) < (halfDepth + halfTile) - 0.005;

            if (overlapX && overlapZ) {
                if (delta < 0 && entity.y >= sc.y + halfTile - 0.05 && testPos.y <= sc.y + halfTile) {
                    if (solid.obj.type === 4 || solid.obj.type === 'RAINBOW') {
                        entity.y = sc.y + halfTile + 0.02;
                        entity.vy = 8.5;
                        entity.isJumping = false;
                        entity.grounded = false;
                        entity.coyoteTimer = 0;
                        entity.jumpBufferTimer = 0;
                        entity.groundPlatform = null;
                        playRainbowBounce();
                        return;
                    }
                    entity.y = sc.y + halfTile;
                    entity.vy = 0;
                    entity.grounded = true;
                    entity.isJumping = false;
                    if (solid.obj instanceof MovingBlock) {
                        entity.groundPlatform = solid.obj;
                    }
                    return;
                } else if (delta > 0 && entity.y + entity.height <= sc.y - halfTile + 0.05 && testPos.y + entity.height >= sc.y - halfTile) {
                    entity.y = sc.y - halfTile - entity.height;
                    entity.vy = 0;
                    entity.isJumping = false;
                    return;
                }
            }
        } else {
            const otherAxis = axis === 'x' ? 'z' : 'x';
            const halfOther = axis === 'x' ? halfDepth : halfWidth;
            const halfCurrent = axis === 'x' ? halfWidth : halfDepth;
            const overlapY = entity.y < sc.y + halfTile - 0.005 && entity.y + entity.height > sc.y - halfTile + 0.005;
            const overlapOther = Math.abs(testPos[otherAxis] - sc[otherAxis]) < (halfOther + halfTile) - 0.005;

            if (overlapY && overlapOther && Math.abs(testPos[axis] - sc[axis]) < (halfCurrent + halfTile)) {
                entity[axis] = delta > 0 ? sc[axis] - halfTile - halfCurrent : sc[axis] + halfTile + halfCurrent;
                entity['v' + axis] = 0;
                return;
            }
        }
    }

    entity[axis] = testPos[axis];
}

export function updatePhysics(entity, dt) {
    entity.grounded = false;
    entity.groundPlatform = null;

    entity.vy += GRAVITY * dt;

    moveAxis(entity, 'x', entity.vx * dt);
    moveAxis(entity, 'y', entity.vy * dt);
    moveAxis(entity, 'z', entity.vz * dt);

    if (entity.grounded) {
        entity.coyoteTimer = 0.1;
    } else if (entity.coyoteTimer > 0) {
        entity.coyoteTimer -= dt;
    }

    if (entity.jumpBufferTimer > 0) {
        entity.jumpBufferTimer -= dt;
    }

    if (entity.jumpBufferTimer > 0 && entity.coyoteTimer > 0) {
        entity.vy = entity.jumpForce;
        entity.isJumping = true;
        entity.jumpBufferTimer = 0;
        entity.coyoteTimer = 0;
        entity.groundPlatform = null;
        playJump();
    }
}
