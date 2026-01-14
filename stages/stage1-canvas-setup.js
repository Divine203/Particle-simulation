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

const colors = {
    [EMPTY]: [0, 0, 0], // 0: []
    [SAND]: [246, 215, 176], // 1: [r, g, b]
};

const imageData = ctx.createImageData(W, H);
const pixels = imageData.data;

let currentMaterial = EMPTY;

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
    grid[W/2][H/2] = 1;
}



function engine() {
    update();
    render();
    requestAnimationFrame(engine);
}

requestAnimationFrame(engine);
