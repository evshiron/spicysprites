
var Promise = require('bluebird');
const $ = require('jquery');

const Color = require('./color');

const canvas = document.getElementById('canvas');

const ctx = canvas.getContext('2d');

function OpenFileDialog() {

    return new Promise((resolve, reject) => {

        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = (event) => {

            const file = event.target.files[0];
            if(file) resolve(file);
            else reject(new Error('ERROR_OPENING_FILE'));

        };
        input.dispatchEvent(new MouseEvent('click'));

    });

}

function ReadFileDataURL(file) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();
        reader.onload = (event) => {
            resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);

    });

}

function LoadImage(src) {

    return new Promise((resolve, reject) => {

        const image = new Image();
        image.onload = (event) => {
            resolve(image);
        };
        image.onerror = reject;
        image.src = src;

    });

}

function UnpackCanvas({
    background,
}) {

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);

    function getIdx(x, y) {
        return y * canvas.width + x;
    }

    function getColor(x, y) {

        const idx = getIdx(x, y);

        const r = data.data[idx * 4 + 0];
        const g = data.data[idx * 4 + 1];
        const b = data.data[idx * 4 + 2];
        const a = data.data[idx * 4 + 3];

        const inCanvas = x >= 0 && y >= 0 && x < canvas.width && y < canvas.height;

        return inCanvas ? new Color(r, g, b, a) : background;

    }

    const maskes = {};

    const boxes = [];

    function parseBox(x, y) {

        if(getColor(x, y).equals(background)) {
            return;
        }

        const box = {
            x0: x,
            x1: x,
            y0: y,
            y1: y,
        };

        // Flood fill.
        // https://en.wikipedia.org/wiki/Flood_fill

        const queue = [];

        queue.push([x, y]);

        while(queue.length > 0) {

            const [x, y] = queue.shift();

            if(maskes[getIdx(x, y)]) {
                continue;
            }

            box.x0 = Math.min(box.x0, x);
            box.x1 = Math.max(box.x1, x);
            box.y0 = Math.min(box.y0, y);
            box.y1 = Math.max(box.y1, y);

            maskes[getIdx(x, y)] = 1;

            if(!getColor(x + 1, y).equals(background) && !maskes[getIdx(x + 1, y)]) {
                queue.push([x + 1, y]);
            }

            if(!getColor(x, y + 1).equals(background) && !maskes[getIdx(x, y + 1)]) {
                queue.push([x, y + 1]);
            }

            if(!getColor(x - 1, y).equals(background) && !maskes[getIdx(x - 1, y)]) {
                queue.push([x - 1, y]);
            }

            if(!getColor(x, y - 1).equals(background) && !maskes[getIdx(x, y - 1)]) {
                queue.push([x, y - 1]);
            }

        }

        boxes.push(box);

        return box;

    }

    for(let y = 0; y < canvas.height; y++) {

        for(let x = 0; x < canvas.width; x++) {

            if(getColor(x, y).equals(background) || maskes[getIdx(x, y)]) {
                continue;
            }

            parseBox(x, y);

        }

    }

    for(let box of boxes) {

        ctx.strokeRect(box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0);

    }

    console.log(boxes);

}

$('#toggle').click((event) => {
    $('#buttons').toggle();
});

$('#load').click((event) => {

    OpenFileDialog()
    .then(ReadFileDataURL)
    .then(LoadImage)
    .then((image) => {

        canvas.width = image.width;
        canvas.height = image.height;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, image.width, image.height);

    })
    .catch((err) => {
        console.error(err);
    });

});

$('#unpack').click((event) => {

    UnpackCanvas({
        background: new Color(0, 0, 0, 0),
    });

});
