export const LEVELS = [
    {
        name: "Level 1: Green Meadows",
        "seed": 2,
        "size": 5,
        "maxHeight": 12,
        "islandFactor": 1,
        "scale": 0.45,
        "threshold": 0.22,
        "heightTypeMap": {
            "grassMax": 3,
            "rockMax": 7,
            "snowMax": 12
        },
        "spawn": {
            "x": 2,
            "y": 1,
            "z": -3
        },
        "goal": {
            "x": 0,
            "y": 10,
            "z": 1
        },
        "modifications": [
            {
                "x": 0,
                "y": 4,
                "z": 2,
                "action": "add",
                "type": "ROCK"
            },
            {
                "x": -1,
                "y": 5,
                "z": 0,
                "action": "add",
                "type": "ROCK"
            },
            {
                "x": 2,
                "y": 7,
                "z": 1,
                "action": "add",
                "type": "SNOW"
            },
            {
                "x": 1,
                "y": 8,
                "z": -1,
                "action": "add",
                "type": "SNOW"
            },
            {
                "x": 0,
                "y": 9,
                "z": 1,
                "action": "add",
                "type": "SNOW"
            },
            {
                "x": -1,
                "y": 4,
                "z": 2,
                "action": "add",
                "type": "ROCK"
            },
            {
                "x": 2,
                "y": 7,
                "z": 0,
                "action": "add",
                "type": "SNOW"
            }
        ]
    },

    {
        name: "Level 2: Rocky Cliffs",
        "seed": 2,
        "size": 4,
        "maxHeight": 11,
        "islandFactor": 3,
        "scale": 0.3,
        "threshold": 0.21,
        "heightTypeMap": {
            "grassMax": 3,
            "rockMax": 7,
            "snowMax": 12
        },
        "spawn": {
            "x": -1,
            "y": 1,
            "z": -3
        },
        "goal": {
            "x": 0,
            "y": 8,
            "z": 1
        },
        "modifications": [
            {
                "x": -2,
                "y": 0,
                "z": 0,
                "action": "add",
                "type": "GRASS"
            },
            {
                "x": 3,
                "y": 0,
                "z": 0,
                "action": "remove"
            },
            {
                "x": 3,
                "y": 0,
                "z": 1,
                "action": "remove"
            },
            {
                "x": 2,
                "y": 0,
                "z": 3,
                "action": "remove"
            },
            {
                "x": 2,
                "y": 1,
                "z": 0,
                "action": "add",
                "type": "GRASS"
            },
            {
                "x": 2,
                "y": 1,
                "z": -1,
                "action": "add",
                "type": "GRASS"
            },
            {
                "x": 2,
                "y": 1,
                "z": -2,
                "action": "add",
                "type": "GRASS"
            }
        ]
    },
    {
        name: "Level 3: Snowy Peaks",
        "seed": 2,
        "size": 20,
        "maxHeight": 17,
        "islandFactor": 2,
        "scale": 0.1,
        "threshold": 0.42,
        "heightTypeMap": {
            "grassMax": 3,
            "rockMax": 7,
            "snowMax": 12
        },
        "spawn": {
            "x": 6,
            "y": 1,
            "z": -10
        },
        "goal": {
            "x": 0,
            "y": 11,
            "z": 4
        },
        "modifications": []
    },
    {
        name: "Level 4: Rainbow Summit",
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
