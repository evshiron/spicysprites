
const { join } = require('path');
const { outputFile } = require('fs-extra');

var Promise = require('bluebird');
const $ = require('jquery');

const Color = require('./color');
const { OpenFileDialog, OpenDirDialog, ReadFileDataURL, LoadImage } = require('./util');

class App {

    constructor() {

        this.canvas = document.getElementById('canvas');

        this.offset = [0, 0];

        this.loadedImage = null;

        this.boxes = [];

        this.selecting = false;
        // Box [x0, y0, x1, y1].
        this.selectingBox = [0, 0, 0, 0];
        this.selectedBoxIndices = [];

        this.bindEvents();

        this.render();

    }

    resize() {

        const width = this.loadedImage ? Math.max(window.innerWidth, this.loadedImage.width) : window.innerWidth;
        const height = this.loadedImage ? Math.max(window.innerHeight, this.loadedImage.height) : window.innerHeight;

        $('#container').width(width);
        $('#container').height(height);

        this.canvas.width = width;
        this.canvas.height = height;

        this.offset = [
            this.loadedImage ? (width - this.loadedImage.width) / 2 : 0,
            this.loadedImage ? (height - this.loadedImage.height) / 2 : 0,
        ];

    }

    isBoxOverlapped(box1, box2) {
        return !(box1[0] > box2[2] || box1[1] > box2[3] || box2[0] > box1[2] || box2[1] > box1[3]);
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
            .then((path) => ReadFileDataURL(path))
            .then((url) => LoadImage(url))
            .then((image) => {

                this.loadedImage = image;

                this.resize();

            });

        });

        $('#unpack').click((event) => {

            this.UnpackCanvas({
                background: new Color(0, 0, 0, 0),
            })
            .then((boxes) => {

                this.boxes = boxes;

            });

        });

        $('#join').click((event) => {

            this.JoinBoxes()
            .then((result) => {

                this.boxes = this.boxes.filter((box, idx) => !this.selectedBoxIndices.includes(idx));
                this.boxes.push(result);

                this.selectedBoxIndices = [];

            });

        });

        $('#export').click((event) => {

            $('#export-panel').toggle();

        });

        $('#export-select').click((event) => {

            OpenDirDialog()
            .then((path) => {
                $('#export-pattern').val(join(path, '{}.png'));
            });

        });

        $('#export-execute').click((event) => {

            const pattern = $('#export-pattern').val();

            this.ExportSprites(pattern)
            .then(() => {
                alert('Exported.');
            });

        });

        $(this.canvas).mousedown((event) => {

            this.selecting = true;

            this.selectingBox = [
                event.offsetX - this.offset[0],
                event.offsetY - this.offset[1],
                0,
                0,
            ];

        });

        $(this.canvas).mouseup((event) => {

            if(this.selecting) {

                this.selectingBox[2] = event.offsetX - this.offset[0];
                this.selectingBox[3] = event.offsetY - this.offset[1];

                const selectBox = [
                    Math.min(this.selectingBox[0], this.selectingBox[2]),
                    Math.min(this.selectingBox[1], this.selectingBox[3]),
                    Math.max(this.selectingBox[0], this.selectingBox[2]),
                    Math.max(this.selectingBox[1], this.selectingBox[3]),
                ];

                this.selectedBoxIndices = this.boxes.map((box, idx) => {

                    if(this.isBoxOverlapped(box, selectBox)) {
                        return idx;
                    }
                    else {
                        return -1;
                    }

                }).filter(idx => idx != -1);

                this.selectingBox = [0, 0, 0, 0];

                this.selecting = false;

            }

        });

        $(this.canvas).mousemove((event) => {

            if(this.selecting) {

                this.selectingBox[2] = event.offsetX - this.offset[0];
                this.selectingBox[3] = event.offsetY - this.offset[1];

            }

        });

    }

    getImageOnlyCanvas() {

        if(!this.loadedImage) {
            throw new Error('ERROR_NO_LOADED_IMAGE');
        }

        const canvas = document.createElement('canvas');

        canvas.width = this.loadedImage.width;
        canvas.height = this.loadedImage.height;

        const ctx = canvas.getContext('2d');

        ctx.drawImage(this.loadedImage, 0, 0, this.loadedImage.width, this.loadedImage.height);

        return canvas;

    }

    render() {

        requestAnimationFrame(this.render.bind(this));

        const ctx = this.canvas.getContext('2d');

        ctx.save();

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.translate(...this.offset);

        // Draw loaded image.
        if(this.loadedImage) {

            ctx.save();

            const canvas = this.canvas;
            const image = this.loadedImage;

            ctx.drawImage(image, 0, 0, image.width, image.height);

            ctx.restore();

        }

        // Draw bounding boxes.
        if(this.boxes) {

            ctx.save();

            const boxes = this.boxes;

            for(let box of boxes) {
                ctx.strokeRect(box[0], box[1], box[2] - box[0], box[3] - box[1]);
            }

            ctx.restore();

        }

        // Draw selected bounding boxes.
        if(this.selectedBoxIndices) {

            ctx.save();

            const indices = this.selectedBoxIndices;
            const boxes = indices.map(idx => this.boxes[idx]);

            ctx.strokeStyle = 'blue';

            for(let box of boxes) {
                ctx.strokeRect(box[0], box[1], box[2] - box[0], box[3] - box[1]);
            }

            ctx.restore();

        }

        // Draw selecting box.
        if(this.selecting) {

            ctx.save();

            const box = this.selectingBox;

            if(box[0] && box[1] && box[2] && box[3]) {

                ctx.setLineDash([2, 2]);

                ctx.strokeRect(box[0], box[1], box[2] - box[0], box[3] - box[1]);

            }

            ctx.restore();

        }

        ctx.restore();

    }

    UnpackCanvas({
        background,
    }) {

        return new Promise((resolve, reject) => {

            const canvas = this.getImageOnlyCanvas();
            const ctx = canvas.getContext('2d');

            const data = ctx.getImageData(0, 0, canvas.width, canvas.height);

            const getIdx = (x, y) => {
                return y * canvas.width + x;
            };

            const getColor = (x, y) => {

                const idx = getIdx(x, y);

                const r = data.data[idx * 4 + 0];
                const g = data.data[idx * 4 + 1];
                const b = data.data[idx * 4 + 2];
                const a = data.data[idx * 4 + 3];

                const inCanvas = x >= 0 && y >= 0 && x < canvas.width && y < canvas.height;

                return inCanvas ? new Color(r, g, b, a) : background;

            };

            const maskes = {};

            const boxes = [];

            const parseBox = (x, y) => {

                if(getColor(x, y).equals(background)) {
                    return;
                }

                const box = [x, y, x, y];

                // Flood fill.
                // https://en.wikipedia.org/wiki/Flood_fill

                const queue = [];

                queue.push([x, y]);

                while(queue.length > 0) {

                    const [x, y] = queue.shift();

                    if(maskes[getIdx(x, y)]) {
                        continue;
                    }

                    box[0] = Math.min(box[0], x);
                    box[2] = Math.max(box[2], x);
                    box[1] = Math.min(box[1], y);
                    box[3] = Math.max(box[3], y);

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

            for(let y = 0; y < canvas.height; y++) {

                for(let x = 0; x < canvas.width; x++) {

                    if(getColor(x, y).equals(background) || maskes[getIdx(x, y)]) {
                        continue;
                    }

                    parseBox(x, y);

                }

            }

            resolve(boxes);

        });

    }

    JoinBoxes() {

        return new Promise((resolve, reject) => {

            const boxes = this.selectedBoxIndices.map(idx => this.boxes[idx]);

            if(boxes.length) {

                const [x0, y0, x1, y1] = boxes[0];
                const result = [x0, y0, x1, y1];

                for(let i = 1; i < boxes.length; i++) {

                    const box = boxes[i];

                    result[0] = Math.min(result[0], box[0]);
                    result[1] = Math.min(result[1], box[1]);
                    result[2] = Math.max(result[2], box[2]);
                    result[3] = Math.max(result[3], box[3]);

                }

                return resolve(result);

            }
            else {

                return reject(new Error('ERROR_BOXES_NOT_EXISTS'));

            }

        });

    }

    ExportSprites(pattern) {

        return new Promise.map(this.boxes, (box, idx) => {

            return new Promise((resolve, reject) => {

                const [x0, y0, x1, y1] = box;

                const canvas = document.createElement('canvas');
                // +1 for exporting full sprite.
                canvas.width = x1 - x0 + 1;
                canvas.height = y1 - y0 + 1;

                const source = this.getImageOnlyCanvas();

                const ctx = canvas.getContext('2d');

                ctx.drawImage(source, x0, y0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);

                outputFile(pattern.replace('{}', ''+idx), new Buffer(canvas.toDataURL('image/png').split(',')[1], 'base64'), resolve);

            });

        });

    }

}

const app = new App();
