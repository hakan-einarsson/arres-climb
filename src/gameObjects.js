export const gameObjects = [];

export function addGameObject(obj) {
    gameObjects.push(obj);
}

export function removeGameObject(obj) {
    const index = gameObjects.indexOf(obj);
    if (index !== -1) {
        gameObjects.splice(index, 1);
    }
}
