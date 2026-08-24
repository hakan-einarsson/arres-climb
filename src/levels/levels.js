export const LEVELS = [
    {
        name: "Level 1: Green Meadows",
        seed: 2,
        size: 5,
        maxHeight: 7,
        islandFactor: 3.0,
        scale: 0.45,
        threshold: 0.22,
        heightTypeMap: { grassMax: 3, rockMax: 5, snowMax: 7 },
        spawn: { x: -2, y: 2, z: -2 },
        goal: { x: 0, y: 7, z: 0 },
        modifications: [
            { x: -1, y: 3, z: -1, action: "add", type: "GRASS" },
            { x: 0, y: 5, z: -1, action: "add", type: "ROCK" }
        ]
    },
    {
        name: "Level 2: Rocky Cliffs",
        seed: 1337,
        size: 6,
        maxHeight: 10,
        islandFactor: 2.5,
        scale: 0.45,
        threshold: 0.20,
        heightTypeMap: { grassMax: 3, rockMax: 7, snowMax: 10 },
        spawn: { x: -3, y: 2, z: -3 },
        goal: { x: 1, y: 10, z: 1 },
        modifications: [
            { x: -2, y: 4, z: -2, action: "add", type: "ROCK" },
            { x: -1, y: 6, z: -1, action: "add", type: "ROCK" },
            { x: 0, y: 8, z: 0, action: "add", type: "SNOW" }
        ]
    },
    {
        name: "Level 3: Rainbow Summit",
        seed: 42,
        size: 7,
        maxHeight: 14,
        islandFactor: 3.2,
        scale: 0.4,
        threshold: 0.22,
        heightTypeMap: { grassMax: 4, rockMax: 8, snowMax: 12 },
        spawn: { x: -4, y: 2, z: -4 },
        goal: { x: 0, y: 14, z: 0 },
        modifications: [
            { x: -3, y: 5, z: -3, action: "add", type: "ROCK" },
            { x: -2, y: 8, z: -2, action: "add", type: "SNOW" },
            { x: -1, y: 11, z: -1, action: "add", type: "RAINBOW" },
            { x: 0, y: 13, z: 0, action: "add", type: "RAINBOW" }
        ]
    }
];

export default LEVELS;
