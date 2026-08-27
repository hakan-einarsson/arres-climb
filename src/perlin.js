const grad3 = [
    [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
    [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
    [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
];

const lerp = (a, b, t) => a + t * (b - a);
const posMod = (n, m) => ((n % m) + m) % m;

function dotGrid(ix, iy, x, y, perm) {
    const px = posMod(ix, perm.length);
    const py = posMod(iy, perm.length);
    const g = grad3[posMod(perm[px] + py, perm.length) % 12];
    return (x - ix) * g[0] + (y - iy) * g[1];
}

export default function perlin(x, y, perm) {
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const sx = x - x0, sy = y - y0;
    const n0 = dotGrid(x0, y0, x, y, perm), n1 = dotGrid(x0 + 1, y0, x, y, perm);
    const n2 = dotGrid(x0, y0 + 1, x, y, perm), n3 = dotGrid(x0 + 1, y0 + 1, x, y, perm);
    return lerp(lerp(n0, n1, sx), lerp(n2, n3, sx), sy);
}