import { gameObjects } from './gameObjects.js';
import Tile from './tile.js';

const GRAVITY = -9.8;

function getNearbyTiles(entity) {
    const gridX = Math.floor(entity.x / 0.5);
    const gridZ = Math.floor(entity.z / 0.5);

    return gameObjects.filter(obj => {
        if (!(obj instanceof Tile) || obj.type === 'HOLE') return false;
        return Math.abs(obj.gridX - gridX) <= 1 && Math.abs(obj.gridZ - gridZ) <= 1;
    });
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
    const nearby = getNearbyTiles(entity);

    for (const tile of nearby) {
        const tileCenter = {
            x: tile.gridX * 0.5 + 0.25,
            y: tile.gridY * 0.5 + 0.25,
            z: tile.gridZ * 0.5 + 0.25,
        };
        const tileSize = { x: 0.5, y: 0.5, z: 0.5 };

        if (boxesOverlap(testPos.x, testCenterY, testPos.z, size, tileCenter.x, tileCenter.y, tileCenter.z, tileSize)) {
            if (axis === 'y' && entity.vy < 0) {
                entity.grounded = true;   // <-- den här raden måste finnas
            }
            entity['v' + axis] = 0;
            return;
        }
    }

    entity[axis] = testPos[axis];
}

export function updatePhysics(entity, dt) {
    entity.grounded = false;

    entity.vy += GRAVITY * dt;

    moveAxis(entity, 'x', entity.vx * dt);
    moveAxis(entity, 'y', entity.vy * dt);
    moveAxis(entity, 'z', entity.vz * dt);

    // Coyote-timer: fylls på när grounded, räknas ner annars
    if (entity.grounded) {
        entity.coyoteTimer = 0.1;
    } else if (entity.coyoteTimer > 0) {
        entity.coyoteTimer -= dt;
    }

    // Jump buffer-timer: räknas ner oavsett, oberoende av grounded
    if (entity.jumpBufferTimer > 0) {
        entity.jumpBufferTimer -= dt;
    }

    // Utlös hoppet HÄR, centralt, när båda fönster är öppna samtidigt
    if (entity.jumpBufferTimer > 0 && entity.coyoteTimer > 0) {
        entity.vy = entity.jumpForce;
        entity.jumpBufferTimer = 0;
        entity.coyoteTimer = 0;
    }
}