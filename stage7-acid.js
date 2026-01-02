const ctx = c.getContext('2d');

const SCALE = 1;

ctx.imageSmoothingEnabled = false;

const W = c.width / SCALE;
const H = c.height / SCALE;

const buffer = document.createElement('canvas');
buffer.width = W;
buffer.height = H;
const bctx = buffer.getContext('2d');

const grid = Array.from({ length: W }, () => new Uint8Array(H)); // [[]]
const velocity = Array.from({ length: W }, () => new Uint8Array(H));
const fireLife = Array.from({ length: W }, () => new Uint8Array(H));
const burnLife = Array.from({ length: W }, () => new Uint8Array(H));
const gasLife = Array.from({ length: W }, () => new Uint8Array(H));

const EMPTY = 0;
const SAND = 1;
const WATER = 2;
const CLAY = 3;
const FIRE = 4;
const GAS = 5;

const GRAVITY = 1;

const SAND_STEPS = 4;
const WATER_STEPS = 6;
const FIRE_STEPS = 4;
const GAS_STEPS = 1;

const MAX_STEP_SAND = 4; // max cells per frame
const MAX_STEP_WATER = 3; // max cells per frame

const colors = {
    [EMPTY]: [0, 0, 0], // 0: []
    [SAND]: [246, 215, 176], // 1: [r, g, b]
    [WATER]: [64, 164, 223],
    [CLAY]: [33, 25, 17],
    [FIRE]: [242, 125, 12],
    [GAS]: [216, 216, 216],
};

const isFlammable = (t) => t === SAND || t === CLAY;

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

const updateFirePos = (x, y) => {
    // up
    if (isEmpty(x, y - 1)) return [x, y - 1];

    // diagonal up (random order)
    if (Math.random() < 0.5) {
        if (isEmpty(x - 1, y - 1)) return [x - 1, y - 1];
        if (isEmpty(x + 1, y - 1)) return [x + 1, y - 1];
    } else {
        if (isEmpty(x + 1, y - 1)) return [x + 1, y - 1];
        if (isEmpty(x - 1, y - 1)) return [x - 1, y - 1];
    }

    // sideways flicker
    if (Math.random() < 0.3) {
        if (isEmpty(x - 1, y)) return [x - 1, y];
        if (isEmpty(x + 1, y)) return [x + 1, y];
    }

    return [x, y];
};

const updateGasPos = (x, y) => {
    // rise
    if (isEmpty(x, y - 1)) return [x, y - 1];

    // diagonal up
    if (Math.random() < 0.5) {
        if (isEmpty(x - 1, y - 1)) return [x - 1, y - 1];
        if (isEmpty(x + 1, y - 1)) return [x + 1, y - 1];
    } else {
        if (isEmpty(x + 1, y - 1)) return [x + 1, y - 1];
        if (isEmpty(x - 1, y - 1)) return [x - 1, y - 1];
    }

    // sideways diffusion
    if (Math.random() < 0.6) {
        if (isEmpty(x - 1, y)) return [x - 1, y];
        if (isEmpty(x + 1, y)) return [x + 1, y];
    }

    return [x, y];
};

const burn = (x, y) => {
    const neighbors = [
        [x, y + 1],
        [x, y - 1],
        [x - 1, y],
        [x + 1, y],
    ];

    for (const [nx, ny] of neighbors) {
        if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;

        if (isFlammable(grid[nx][ny]) && burnLife[nx][ny] === 0) {
            if (Math.random() < 0.06) { // ignition chance
                burnLife[nx][ny] = 30 + Math.random() * 30;
            }
            // gas
            if (Math.random() < 0.05 && isEmpty(x, y - 1)) {
                grid[x][y - 1] = GAS;
                gasLife[x][y - 1] = 40;
            }
        }
    }
};

const stepBurning = () => {
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            if (burnLife[x][y] > 0) {
                burnLife[x][y]--;

                // flicker into fire sometimes
                if (Math.random() < 0.1) {
                    grid[x][y] = FIRE;
                    fireLife[x][y] = 15;
                }

                // burned out
                if (burnLife[x][y] === 0) {
                    grid[x][y] = EMPTY;
                }
            }
        }
    }
};

const stepFire = () => {
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            if (grid[x][y] === FIRE) {
                fireLife[x][y]--;

                if (fireLife[x][y] <= 0) {
                    grid[x][y] = EMPTY;
                    continue;
                }

                burn(x, y);

                const [ux, uy] = updateFirePos(x, y);

                if (ux !== x || uy !== y) {
                    grid[x][y] = EMPTY;
                    grid[ux][uy] = FIRE;
                    fireLife[ux][uy] = fireLife[x][y];
                }
            }
        }
    }
};

const stepSand = () => {
    for (let y = H - 1; y >= 0; y--) {
        for (let x = 0; x < W; x++) {
            if (grid[x][y] === SAND) {
                let ux = x;
                let uy = y;
                let vel = Math.min(velocity[x][y], MAX_STEP_SAND);

                for (let v = 0; v < vel; v++) {
                    const [nx, ny] = updateSandPos(ux, uy);
                    if (nx === ux && ny === uy) break;
                    ux = nx;
                    uy = ny;
                }

                grid[x][y] = EMPTY;
                grid[ux][uy] = SAND;

                if (ux === x && uy === y) {
                    velocity[x][y] = 1;
                } else {
                    velocity[ux][uy] = velocity[x][y] + GRAVITY;
                }
            }
        }
    }
};

const stepWater = () => {
    for (let y = H - 1; y >= 0; y--) {
        for (let x = 0; x < W; x++) {
            if (grid[x][y] === WATER) {
                let ux = x;
                let uy = y;
                let vel = Math.min(velocity[x][y], MAX_STEP_WATER);

                for (let v = 0; v < vel; v++) {
                    const [nx, ny] = updateWaterPos(ux, uy);
                    if (nx === ux && ny === uy) break;
                    ux = nx;
                    uy = ny;
                }

                grid[x][y] = EMPTY;
                grid[ux][uy] = WATER;

                if (ux === x && uy === y) {
                    velocity[x][y] = 1;
                } else {
                    velocity[ux][uy] = velocity[x][y] + GRAVITY;
                }
            }
        }
    }
};

const stepGas = () => {
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            if (grid[x][y] === GAS) {
                gasLife[x][y] -= 0.0001;

                if (gasLife[x][y] <= 0) {
                    grid[x][y] = EMPTY;
                    continue;
                }

                const [ux, uy] = updateGasPos(x, y);

                if (ux !== x || uy !== y) {
                    grid[x][y] = EMPTY;
                    grid[ux][uy] = GAS;
                    gasLife[ux][uy] = gasLife[x][y];
                } else {
                    grid[ux][uy] = EMPTY;
                }
            }
        }
    }
};


const GAS_MIN_ALPHA = 20; // minimum alpha (out of 255)
const GAS_MAX_LIFE = 40;

const render = () => {
    for (let x = 0; x < W; x++) {
        for (let y = 0; y < H; y++) {
            const t = grid[x][y];
            const c = colors[t];
            const i = (y * W + x) * 4;

            pixels[i] = c[0]; // r
            pixels[i + 1] = c[1]; // g
            pixels[i + 2] = c[2]; // b
            // pixels[i + 3] = c[3] ?? 255; // aWe 

            if (t === GAS) {
                const life = gasLife[x][y];
                const alpha = Math.max(GAS_MIN_ALPHA, (life / GAS_MAX_LIFE) * 255);
                pixels[i + 3] = alpha;
            } else {
                pixels[i + 3] = c[3] ?? 255;
            }

        }
    }
    bctx.putImageData(imageData, 0, 0);
    ctx.drawImage(buffer, 0, 0, W * SCALE, H * SCALE);
};

const update = () => {
    for (let i = 0; i < WATER_STEPS; i++) {
        stepWater();
    }
    for (let i = 0; i < SAND_STEPS; i++) {
        stepSand();
    }
    for (let i = 0; i < FIRE_STEPS; i++) {
        stepBurning();
        stepFire();
    }

    stepGas();
}

c.addEventListener('mousemove', (e) => {
    const rect = c.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const cx = Math.floor(mx / SCALE);
    const cy = Math.floor(my / SCALE);

    if (cx < 0 || cx >= W || cy < 0 || cy >= H) return;

    let radius = 5;
    if (currentMaterial === WATER) radius = 8;
    else if (currentMaterial === SAND) radius = 5;
    else if (currentMaterial === CLAY) radius = 10;

    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            const x = cx + dx;
            const y = cy + dy;

            if (dx * dx + dy * dy <= radius * radius) {
                if (grid[x] !== undefined && grid[x] !== null) {
                    if (grid[x][y] === EMPTY) {
                        grid[x][y] = currentMaterial;

                        if (currentMaterial == FIRE) {
                            fireLife[x][y] = 20 + Math.random() * 20; // frame
                        }
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
        case '3':
            currentMaterial = CLAY;
            break;
        case '4':
            currentMaterial = FIRE;
            break;
        case '5':
            currentMaterial = ACID;
            break;
    }
});




function engine() {
    update();
    render();
    requestAnimationFrame(engine);
}

requestAnimationFrame(engine);
