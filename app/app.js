
var Promise = require('bluebird');
const $ = require('jquery');

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

function UnpackCanvas(options) {

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // TODO:
    console.log(data);

}

$('#toggle').click((event) => {
    $('#buttons').toggle();
});

$('#load').click((event) => {

    OpenFileDialog()
    .then(ReadFileDataURL)
    .then(LoadImage)
    .then((image) => {

        if(image.width > canvas.width) {
            canvas.width = image.width;
        }

        if(image.height > canvas.height) {
            canvas.height = image.height;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, image.width, image.height);

    })
    .catch((err) => {
        console.error(err);
    });

});

$('#unpack').click((event) => {
    UnpackCanvas();
});
