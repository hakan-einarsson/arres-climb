export default function generatePermTable(seed = 0) {
    const m = 0x80000000;
    let s = seed || Math.floor(Math.random() * m);
    const rnd = () => (s = (1103515245 * s + 12345) % m) / m;
    const p = Array.from({ length: 256 }, (_, i) => i);
    for (let i = 255; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [p[i], p[j]] = [p[j], p[i]];
    }
    return [...p, ...p];
}