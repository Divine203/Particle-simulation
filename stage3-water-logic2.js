const c = document.querySelector('#c');
const ctx = c.getContext('2d');

const SCALE = 2;

ctx.imageSmoothingEnabled = false;

const W = c.width / SCALE;
const H = c.height / SCALE;

const buffer = document.createElement('canvas');
buffer.width = W;
buffer.height = H;
const bctx = buffer.getContext('2d');


const grid = Array.from({ length: W }, () => new Uint8Array(H)); // [[]]

const EMPTY = 0;
const SAND = 1;
const WATER = 2;

const colors = {
    [EMPTY]: [0, 0, 0], // 0: []
    [SAND]: [246, 215, 176], // 1: [r, g, b]
    [WATER]: [64, 164, 223],
};

const imageData = ctx.createImageData(W, H);
const pixels = imageData.data;

let currentMaterial = EMPTY;

const isEmpty = (x, y) => {
    return (
        x >= 0 &&
        x < W &&
        y >= 0 &&
        y < H &&
        grid[x][y] === EMPTY
    );
};

const updateSandPos = (x, y) => {
    if (isEmpty(x, y + 1)) {
        return [x, y + 1];          // down
    }
    if (isEmpty(x - 1, y + 1)) {
        return [x - 1, y + 1];      // down-left
    }
    if (isEmpty(x + 1, y + 1)) {
        return [x + 1, y + 1];      // down-right
    }

    return [x, y];
};


const updateWaterPos = (x, y) => {
    if (isEmpty(x, y + 1)) {
        return [x, y + 1];          // down
    }
    if (isEmpty(x - 1, y + 1)) {
        return [x - 1, y + 1];      // down-left
    }
    if (isEmpty(x + 1, y + 1)) {
        return [x + 1, y + 1];      // down-right
    }
    if (isEmpty(x - 1, y)) { // left
        return [x - 1, y];
    }
    if (isEmpty(x + 1, y)) { // right
        return [x + 1, y];
    }

    return [x, y];
}

const render = () => {
    for (let x = 0; x < W; x++) {
        for (let y = 0; y < H; y++) {
            const t = grid[x][y];
            const c = colors[t];
            const i = (y * W + x) * 4;

            pixels[i] = c[0]; // r
            pixels[i + 1] = c[1]; // g
            pixels[i + 2] = c[2]; // b
            pixels[i + 3] = c[3] ?? 255; // a

        }
    }
    bctx.putImageData(imageData, 0, 0);
    ctx.drawImage(buffer, 0, 0, W * SCALE, H * SCALE);
};


const update = () => {
    for (let y = H - 1; y >= 0; y--) {
        for (let x = 0; x < W; x++) {
            if (grid[x][y] === SAND) {
                const [ux, uy] = updateSandPos(x, y);

                grid[x][y] = EMPTY;
                grid[ux][uy] = SAND;
            }

            if (grid[x][y] === WATER) {
                const [ux, uy] = updateWaterPos(x, y);

                grid[x][y] = EMPTY;
                grid[ux][uy] = WATER;
            }
        }
    }
}

c.addEventListener('mousemove', (e) => {
    const rect = c.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const cx = Math.floor(mx / SCALE);
    const cy = Math.floor(my / SCALE);

    if (cx < 0 || cx >= W || cy < 0 || cy >= H) return;

    let radius = 2;
    if (currentMaterial === WATER) radius = 6;
    else if (currentMaterial === SAND) radius = 2;

    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            const x = cx + dx;
            const y = cy + dy;

            if (dx * dx + dy * dy <= radius * radius) {
                if (grid[x] !== undefined && grid[x] !== null) {
                    if (grid[x][y] === EMPTY) {
                        grid[x][y] = currentMaterial;
                    }
                }
            }
        }
    }
});


window.addEventListener('keydown', (e) => {
    switch (e.key.toLowerCase()) {
        case '1':
            currentMaterial = SAND;
            break;
        case '2':
            currentMaterial = WATER;
            break;
    }
});




function engine() {
    update();
    render();
    requestAnimationFrame(engine);
}

requestAnimationFrame(engine);
