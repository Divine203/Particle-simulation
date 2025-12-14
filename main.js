const c = document.querySelector('#c');
const ctx = c.getContext('2d');

const SCALE = 2;

ctx.imageSmoothingEnabled = false;

ctx.scale(SCALE, SCALE);

const W = c.width / SCALE;
const H = c.height / SCALE;

const grid = Array.from({ length: W }, () => new Uint8Array(H)); // [[]]

const EMPTY = 0;
const SAND = 1;
const WATER = 2;
const FIRE = 3;

const colors = {
    [EMPTY]: [0, 0, 0], // 0: []
    [SAND]: [194, 178, 128], // 1: []
    [WATER]: [64, 164, 223] // 2: []
};

const imageData = ctx.createImageData(W, H);
const pixels = imageData.data;

let currentMaterial = SAND;

const SAND_STEPS = 3;
const WATER_STEPS = 5;


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

}
const fallDist = Array.from({ length: W }, () => new Uint8Array(H));
const MAX_STEP_SAND = 3; // max cells per frame
const MAX_STEP_WATER = 2; // max cells per frame

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

const stepWater = () => {
    for (let y = H - 1; y >= 0; y--) {
        for (let x = 0; x < W; x++) {
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



const clear = () => {
    for (let x = 0; x < W; x++) grid[x].fill(EMPTY); // clear the canvas
}


const update = () => {
    for (let i = 0; i < WATER_STEPS; i++) {
        stepWater();
    }
    for (let i = 0; i < SAND_STEPS; i++) {
        stepSand();
    }
}
const render = () => {
    for (let x = 0; x < W; x++) {
        for (let y = 0; y < H; y++) {
            const c = colors[grid[x][y]];
            const i = (y * W + x) * 4;
            pixels[i] = c[0];   // R
            pixels[i + 1] = c[1]; // G
            pixels[i + 2] = c[2]; // B
            pixels[i + 3] = 255; // A
        }
    }
    ctx.putImageData(imageData, 0, 0);
    ctx.drawImage(c, 0, 0, W * SCALE, H * SCALE);
}

c.addEventListener('mousemove', (e) => {
    const rect = c.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const cx = Math.floor(mx / SCALE);
    const cy = Math.floor(my / SCALE);

    if (cx < 0 || cx >= W || cy < 0 || cy >= H) return;

    const radius = currentMaterial === WATER ? 6 : 2; // radius in cells
    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            const x = cx + dx;
            const y = cy + dy;

            if (dx*dx + dy*dy <= radius*radius) { grid[x][y] = currentMaterial; }
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
            currentMaterial = FIRE;
            break;
    }
});


function engine() {
    update();
    render();
    requestAnimationFrame(engine);
}

requestAnimationFrame(engine);


