import { gameObjects } from './gameObjects.js';

function getNearbyColliders(entity, mask) {
    return gameObjects.filter(obj => {
        if (obj === entity) return false;
        if (!obj.collisionLayer) return false;
        if (!(mask & obj.collisionLayer)) return false; // bitwise mask-check

        const dx = Math.abs(obj.gridX - entity.gridX);
        const dz = Math.abs(obj.gridZ - entity.gridZ);
        return dx <= 1 && dz <= 1; // bara direkt angränsande celler
    });
}

function boxesOverlap(aX, aY, aZ, aSize, bX, bY, bZ, bSize) {
    return Math.abs(aX - bX) < (aSize.x + bSize.x) / 2 &&
        Math.abs(aY - bY) < (aSize.y + bSize.y) / 2 &&
        Math.abs(aZ - bZ) < (aSize.z + bSize.z) / 2;
}

export { getNearbyColliders, boxesOverlap };