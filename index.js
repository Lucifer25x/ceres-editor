const { ipcRenderer } = require('electron');
const fs = require('fs');

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

ipcRenderer.on('save', (event) => {
    if (localStorage.getItem('file') != null) {
        fs.writeFileSync(localStorage.getItem('file'), editor.getValue());
    } else {
        alert('You should open any file.');
    }
})

window.addEventListener('load', () => {
    if (localStorage.getItem('file') != null) {
        editor.setValue(fs.readFileSync(localStorage.getItem('file'), 'utf-8'))
    }
})