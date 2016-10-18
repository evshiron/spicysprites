
var Promise = require('bluebird');
const $ = require('jquery');

const Color = require('./color');
const { OpenFileDialog, ReadFileDataURL, LoadImage } = require('./util');

class App {

    constructor() {

        this.canvas = document.getElementById('canvas');

        this.boxes = [];

        this.bindEvents();

    }

    resize() {

        $('#container').width(Math.max(window.innerWidth, this.canvas.width));
        $('#container').height(Math.max(window.innerHeight, this.canvas.height));

        $(this.canvas).css({
            marginLeft: ($('#container').width() - this.canvas.width) / 2,
            marginTop: ($('#container').height() - this.canvas.height) / 2,
        });

    }

    bindEvents() {

        $(window).resize((event) => {
            this.resize();
        });

        $('#toggle').click((event) => {
            $('#buttons').toggle();
        });

        $('#load').click((event) => {

            OpenFileDialog()
            .then(ReadFileDataURL)
            .then(LoadImage)
            .then((image) => {

                const ctx = this.canvas.getContext('2d');

                this.canvas.width = image.width;
                this.canvas.height = image.height;

                this.resize();

                ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                ctx.drawImage(image, 0, 0, image.width, image.height);

            });

        });

        $('#unpack').click((event) => {

            this.UnpackCanvas({
                background: new Color(0, 0, 0, 0),
            })
            .then((boxes) => {

                const ctx = this.canvas.getContext('2d');

                this.boxes = boxes;

                for(let box of this.boxes) {
                    ctx.strokeRect(box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0);
                }

            });

        });

    }

    UnpackCanvas({
        background,
    }) {

        return new Promise((resolve, reject) => {

            const ctx = this.canvas.getContext('2d');

            const data = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

            const getIdx = (x, y) => {
                return y * this.canvas.width + x;
            };

            const getColor = (x, y) => {

                const idx = getIdx(x, y);

                const r = data.data[idx * 4 + 0];
                const g = data.data[idx * 4 + 1];
                const b = data.data[idx * 4 + 2];
                const a = data.data[idx * 4 + 3];

                const inCanvas = x >= 0 && y >= 0 && x < this.canvas.width && y < this.canvas.height;

                return inCanvas ? new Color(r, g, b, a) : background;

            };

            const maskes = {};

            const boxes = [];

            const parseBox = (x, y) => {

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

            };

            for(let y = 0; y < this.canvas.height; y++) {

                for(let x = 0; x < this.canvas.width; x++) {

                    if(getColor(x, y).equals(background) || maskes[getIdx(x, y)]) {
                        continue;
                    }

                    parseBox(x, y);

                }

            }

            resolve(boxes);

        });

    }

}

const app = new App();
