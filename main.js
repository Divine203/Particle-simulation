const c = document.querySelector('#c');
const ctx = c.getContext('2d');

const SCALE = 10;

ctx.imageSmoothingEnabled = false;

ctx.scale(SCALE, SCALE);

const W = c.width / SCALE;
const H = c.height / SCALE;

const grid = Array.from({ length: W }, () => new Uint8Array(H));

const EMPTY = 0;
const SAND = 1;
const WATER = 2;
const FIRE = 3;

const colors = {
    [EMPTY]: [0, 0, 0],
    [SAND]: [194, 178, 128],
    [WATER]: [64, 164, 223]
};

const imageData = ctx.createImageData(W, H);
const pixels = imageData.data;

const getN = (x, y) => { // get neighbours
    return [
        [x - 1, y], //L
        [x - 1, y - 1], //T-L
        [x - 1, y + 1], //B-R
        [x + 1, y], //R
        [x + 1, y - 1], //T-R
        [x + 1, y + 1], //B-R
        [x, y - 1], //T
        [x, y + 1], //B
    ];
}

const updateSand = (x, y) => {
    let n = getN(x, y);

}

const updateWater = (x, y) => {

}

const updateFire = (x, y) => {

}

let x = W/2-1;
let y = 0;

const update = () => {
    for(let x=0;x<W;x++) grid[x].fill(EMPTY); // clear the canvas

    y++;
    grid[x][y] = SAND;
}

const render = () => {
    for (let x = 0; x < W; x++) {
        for (let y = 0; y < H; y++) {
            const c = colors[grid[x][y]];
            const i = (y * W + x) * 4;
            pixels[i] = c[0];
            pixels[i + 1] = c[1];
            pixels[i + 2] = c[2];
            pixels[i + 3] = 255;
        }
    }
    ctx.putImageData(imageData, 0, 0);
    ctx.drawImage(c, 0, 0, W * SCALE, H * SCALE);
}


function engine() {
    update();
    render();
    requestAnimationFrame(engine);
}

engine();


