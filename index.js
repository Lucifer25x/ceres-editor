const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

var editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.setOptions({
    fontSize: '16px'
})

ipcRenderer.on('file', (event, location) => {
    if (location.length != 0) {
        editor.setValue(fs.readFileSync(location, 'utf-8'))
        localStorage.setItem('file', location)
    }
})

ipcRenderer.on('newFile', (event, location) => {
    if (location.length != 0) {
        localStorage.setItem('folder', location);
        document.querySelector('.newFile').classList.add('visible')
        document.getElementById('filename').focus();
    } else {
        alert('Please select location for new file.')
    }
})

ipcRenderer.on('save', (event) => {
    if (localStorage.getItem('file') != null) {
        fs.writeFileSync(localStorage.getItem('file'), editor.getValue());
    } else {
        alert('You should open any file.');
    }
})

document.getElementById('nw').addEventListener('submit', (e) => {
    e.preventDefault();
    if (localStorage.getItem('folder') != null) {
        if (document.getElementById('filename').value.length > 1) {
            if (fs.existsSync(path.join(localStorage.getItem('folder'), document.getElementById('filename').value))){
                alert('File exists. Please change location or file name.')
            } else {
                document.querySelector('.newFile').classList.remove('visible');
                fs.writeFileSync(path.join(localStorage.getItem('folder'), document.getElementById('filename').value), ' ');
                localStorage.setItem('file', path.join(localStorage.getItem('folder'), document.getElementById('filename').value));
                editor.setValue(' ')
            }
        } else {
            alert('You should write valid file name.')
        }
    } else {
        alert('You should select location for file.')
    }
})

window.addEventListener('load', () => {
    if (localStorage.getItem('file') != null) {
        if(fs.existsSync(localStorage.getItem('file'))){
            editor.setValue(fs.readFileSync(localStorage.getItem('file'), 'utf-8'));
        } else {
            editor.setValue('');
        }
    }
})