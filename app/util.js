
const { dialog } = require('electron').remote;

const Promise = require('bluebird');

function OpenFileDialog() {

    return new Promise((resolve, reject) => {

        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = (event) => {

            const file = event.target.files[0];
            if(file) {
                return resolve(file);
            }
            else {
                return reject(new Error('ERROR_OPENING_FILE'));
            }

        };
        input.dispatchEvent(new MouseEvent('click'));

    });

}

function OpenDirDialog() {

    return new Promise((resolve, reject) => {

        const path = dialog.showOpenDialog({
            properties: [
                'openDirectory',
            ],
        });

        if(path[0]) {
            return resolve(path[0]);
        }
        else {
            return reject(new Error('ERROR_OPENING_DIR'));
        }

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

module.exports = {
    OpenFileDialog, OpenDirDialog, ReadFileDataURL, LoadImage,
};
