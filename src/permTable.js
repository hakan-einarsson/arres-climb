// permTable.js
export default function generatePermTable(seed) {
    const rng = SeedableRandom(seed);
    const perm = Array.from({ length: 256 }, (_, index) => index);

    for (let i = perm.length - 1; i > 0; i--) {
        const j = Math.floor(rng.next() * (i + 1));
        [perm[i], perm[j]] = [perm[j], perm[i]];
    }

    const permTable = [];
    for (let i = 0; i < 512; i++) {
        permTable[i] = perm[i & 255];
    }
    return permTable;
}

function SeedableRandom(seed) {
    const m = 0x80000000;
    const a = 1103515245;
    const c = 12345;
    seed = seed || Math.floor(Math.random() * m);

    function next() {
        seed = (a * seed + c) % m;
        return seed / m;
    }
    return { next };
}