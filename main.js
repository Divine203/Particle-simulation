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
const burnLife = Array.from({ length: W }, () => new Uint8Array(H));
const corrodeLife = Array.from({ length: W }, () => new Uint8Array(H));


const fireLife = Array.from({ length: W }, () => new Uint8Array(H));
const acidLife = Array.from({ length: W }, () => new Uint8Array(H));
const gasLife = Array.from({ length: W }, () => new Uint8Array(H));

const EMPTY = 0;
const SAND = 1;
const WATER = 2;
const FIRE = 3;
const CLAY = 4;
const ACID = 5;
const GAS = 6;
const METAL = 7;

const colors = {
    [EMPTY]: [0, 0, 0], // 0: []
    [SAND]: [246, 215, 176], // 1: []
    [WATER]: [64, 164, 223], // 2: []
    [CLAY]: [33, 25, 17], // 3: []
    [FIRE]: [242, 125, 12], // 3: []
    [ACID]: [33, 223, 25], // 4: []
    [GAS]: [216, 216, 216], // smoke gray // 6: []
    [METAL]: [53, 62, 67] // smoke gray // 6: []
};

const imageData = ctx.createImageData(W, H);
const pixels = imageData.data;

let currentMaterial = EMPTY;

const SAND_STEPS = 3;
const WATER_STEPS = 3;
const FIRE_STEPS = 4;
const ACID_STEPS = 2;
const GAS_STEPS = 2;

const isFlammable = (t) => t === SAND || t === CLAY;
const isDestructable = (t) => t === SAND || t === CLAY || t === METAL;

const getN = (x, y) => { // get neighbours
    return [
        [x - 1, y], //L
        [x - 1, y - 1], //T-L
        [x - 1, y + 1], //B-L
        [x + 1, y], //R
        [x + 1, y - 1], //T-R
        [x + 1, y + 1], //B-R
        [x, y - 1], //T
        [x, y + 1], //B
    ];
}

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


// const updateWaterPos = (x, y) => {
//     if (isEmpty(x, y + 1)) {
//         return [x, y + 1];          // down
//     }
//     if (isEmpty(x - 1, y + 1)) {
//         return [x - 1, y + 1];      // down-left
//     }
//     if (isEmpty(x + 1, y + 1)) {
//         return [x + 1, y + 1];      // down-right
//     }
//     if (isEmpty(x - 1, y)) { // left
//         return [x - 1, y];
//     }
//     if (isEmpty(x + 1, y)) { // right
//         return [x + 1, y];
//     }

//     return [x, y];
// }
const updateWaterPos = (x, y) => {
    if (isEmpty(x, y + 1)) return [x, y + 1];

    const dir = Math.random() < 0.5 ? -1 : 1;

    if (isEmpty(x + dir, y + 1)) return [x + dir, y + 1];
    if (isEmpty(x - dir, y + 1)) return [x - dir, y + 1];

    if (isEmpty(x + dir, y)) return [x + dir, y];
    if (isEmpty(x - dir, y)) return [x - dir, y];

    return [x, y];
};


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

const updateAcidPos = (x, y) => {
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



const fallDist = Array.from({ length: W }, () => new Uint8Array(H));
const MAX_STEP_SAND = 3; // max cells per frame
const MAX_STEP_WATER = 2; // max cells per frame
const MAX_STEP_ACID = 1; // max cells per frame


const stepSand = () => {
    for (let y = H - 1; y >= 0; y--) {
        for (let x = 0; x < W; x++) {
            if (grid[x][y] === SAND) {
                let ux = x;
                let uy = y;
                let steps = Math.min(fallDist[x][y], MAX_STEP_SAND);

                for (let s = 0; s < steps; s++) {
                    const [nx, ny] = updateSandPos(ux, uy);
                    if (nx === ux && ny === uy) break;
                    ux = nx;
                    uy = ny;
                }

                grid[x][y] = EMPTY;
                grid[ux][uy] = SAND;

                if (ux === x && uy === y) {
                    fallDist[x][y] = 1;
                } else {
                    fallDist[ux][uy] = fallDist[x][y] + 1;
                }
            }
        }
    }
};

let flip = false;

const stepWater = () => {
    flip = !flip;

    const xStart = flip ? 0 : W - 1;
    const xEnd = flip ? W : -1;
    const xStep = flip ? 1 : -1;

    for (let y = H - 1; y >= 0; y--) {
       for (let x = xStart; x !== xEnd; x += xStep) {
            if (grid[x][y] === WATER) {
                let ux = x;
                let uy = y;
                let steps = Math.min(fallDist[x][y], MAX_STEP_WATER);

                for (let s = 0; s < steps; s++) {
                    const [nx, ny] = updateWaterPos(ux, uy);
                    if (nx === ux && ny === uy) break;
                    ux = nx;
                    uy = ny;
                }

                grid[x][y] = EMPTY;
                grid[ux][uy] = WATER;

                if (ux === x && uy === y) {
                    fallDist[x][y] = 1;
                } else {
                    fallDist[ux][uy] = fallDist[x][y] + 1;
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

const corrode = (x, y) => {
    const neighbors = [
        [x, y + 1],
        [x, y - 1],
        [x - 1, y],
        [x + 1, y],
    ];

    for (const [nx, ny] of neighbors) {
        if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;

        if (isDestructable(grid[nx][ny]) && corrodeLife[nx][ny] === 0) {
            if (Math.random() < 0.03) { // corrosion chance
                corrodeLife[nx][ny] = 30 + Math.random() * 30;
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

const stepCorroding = () => {
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            if (corrodeLife[x][y] > 0) {
                corrodeLife[x][y]--;

                if (Math.random() < 0.1) {
                    grid[x][y] = ACID;
                    acidLife[x][y] = 15;
                }

                // burned out
                if (corrodeLife[x][y] === 0) {
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

const stepAcid = () => {
    for (let y = H - 1; y >= 0; y--) {
        for (let x = 0; x < W; x++) {
            if (grid[x][y] === ACID) {
                let ux = x;
                let uy = y;
                let steps = Math.min(fallDist[x][y], MAX_STEP_ACID);

                for (let s = 0; s < steps; s++) {
                    const [nx, ny] = updateAcidPos(ux, uy);
                    if (nx === ux && ny === uy) break;
                    ux = nx;
                    uy = ny;
                }

                grid[x][y] = EMPTY;
                grid[ux][uy] = ACID;

                corrode(x, y);

                if (ux === x && uy === y) {
                    fallDist[x][y] = 1;
                } else {
                    fallDist[ux][uy] = fallDist[x][y] + 1;
                }
            }
        }
    }
};

function loadPuzzleImage(url, onDone) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');

        // draw image scaled to your grid
        ctx.drawImage(img, 0, 0, W, H);

        const imgData = ctx.getImageData(0, 0, W, H).data;
        onDone(imgData);
    };
    img.src = url;
}

function stampMetalFromImage(imgData) {
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const i = (y * W + x) * 4;
            const r = imgData[i];
            const g = imgData[i + 1];
            const b = imgData[i + 2];

            // darkness threshold
            const brightness = r + g + b;

            if (brightness < 140) { // black-ish
                grid[x][y] = METAL;
            } else {
                grid[x][y] = EMPTY;
            }
        }
    }
}

loadPuzzleImage("puzzle 1.jpg", (imgData) => {
    stampMetalFromImage(imgData);
});

function thickenMetal() {
    const copy = grid.map(col => Uint8Array.from(col));

    for (let x = 1; x < W - 1; x++) {
        for (let y = 1; y < H - 1; y++) {
            if (copy[x][y] === METAL) {
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        grid[x + dx][y + dy] = METAL;
                    }
                }
            }
        }
    }
}


const update = () => {
    grid[W - 107][20] = WATER;
    grid[W - 106][20] = WATER;
    grid[W - 105][20] = WATER;
    // grid[W / 2][29] = WATER;
    // grid[W / 2 + 1][29] = WATER;
    // grid[W / 2 + 2][29] = WATER;
    // grid[W / 2][29] = WATER;
    // grid[W / 2 + 1][28] = WATER;
    // grid[W / 2 + 2][28] = WATER;
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
    for (let i = 0; i < ACID_STEPS; i++) {
        stepCorroding();
        stepAcid();
    }
    for (let i = 0; i < GAS_STEPS; i++) {
        stepGas();
    }
}

const GAS_MIN_ALPHA = 20; // minimum alpha (out of 255)
const GAS_MAX_LIFE = 40;

const render = () => {
    for (let x = 0; x < W; x++) {
        for (let y = 0; y < H; y++) {
            const t = grid[x][y];
            const c = colors[t];
            const i = (y * W + x) * 4;

            pixels[i] = c[0];
            pixels[i + 1] = c[1];
            pixels[i + 2] = c[2];

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
    else if (currentMaterial === ACID) radius = 3;
    else if (currentMaterial === CLAY || currentMaterial === METAL || currentMaterial === GAS) radius = 7;

    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            const x = cx + dx;
            const y = cy + dy;

            if (dx * dx + dy * dy <= radius * radius) {
                if (grid[x] !== undefined && grid[x] !== null && currentMaterial !== EMPTY && currentMaterial !== undefined && currentMaterial !== null) {
                    if (grid[x][y] === EMPTY) {
                        grid[x][y] = currentMaterial;

                        if (currentMaterial == FIRE) {
                            fireLife[x][y] = 20 + Math.random() * 20; // frame
                        }
                        if (currentMaterial == ACID) {
                            acidLife[x][y] = 20 + Math.random() * 20; // frame
                        }
                        if (currentMaterial == GAS) {
                            gasLife[x][y] = 20 + Math.random() * 20;
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
        case '6':
            currentMaterial = METAL;
            break;
        case '7':
            currentMaterial = GAS;
            break;

        case 'x':
            currentMaterial = null;
            break;

        case 'X':
            currentMaterial = null;
            break;

    }
});

let thiccCount = 0;

function engine() {
    // if (thiccCount < 1) {
    //     thickenMetal();
    //     thiccCount++;
    // }

    update();
    render();
    requestAnimationFrame(engine);
}

requestAnimationFrame(engine);


