const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');
const brace = require('brace');
const configLocations = require('../config/configLocations.json');
let ui;

function loadUi() {
    let uiConfig = configLocations.ui.replace("$HOME", os.homedir);
    if (fs.existsSync(uiConfig)) {
        ui = require(uiConfig);
    } else {
        ui = require('../config/ui.json');
    }
}

loadUi();

try {
    require(`brace/theme/${ui.editorTheme}`);
} catch {
    console.log('Theme is not available.')
}

var editor = ace.edit("editor");
editor.setTheme(`ace/theme/${ui.editorTheme}`);
editor.setOptions({
    fontFamily: ui.fontFamily,
    fontSize: ui.fontSize
})

// Open Folder
function openFolder(location) {
    // Check user is selected any location or not
    var folderName = location.match(/([^\/]*)\/*$/)[1];
    document.getElementById('flname').textContent = folderName;
    document.querySelector('.flname').title = location;
    document.querySelector('.flname').onclick = () => {
        localStorage.setItem('folder', path.dirname(location));
        openFolder(path.dirname(location));
    }
    if (location.length != 0) {
        localStorage.setItem('folder', location);
        const content = fs.readdirSync(location);
        const parent = document.getElementById('files');
        parent.innerHTML = ``;
        for (let i = 0; i < content.length; i++) {
            // Check path is file or not
            if (fs.lstatSync(path.join(location, content[i])).isFile()) {
                const li = document.createElement('li');
                const el = `<img src="../icons/file.png" alt="file" id="icon"><span id="name">${content[i]}</span>`;
                li.innerHTML = el;
                parent.appendChild(li);
                li.addEventListener('click', () => {
                    localStorage.setItem('file', path.join(location, content[i]));
                    const cont = fs.readFileSync(path.join(location, content[i]), 'utf-8');
                    editor.setValue(cont);
                    ipcRenderer.send('setWindowTitle', path.join(location, content[i]) + ' - Text Editor');
                })
                li.title = path.join(location, content[i])
            } else {
                const li = document.createElement('li');
                const el = `<img src="../icons/folder.png" alt="folder" id="icon"><span id="name">${content[i]}</span>`;
                li.innerHTML = el;
                parent.appendChild(li);
                li.addEventListener('click', () => {
                    // Open folder again
                    localStorage.setItem('folder', path.join(location, content[i]))
                    openFolder(path.join(location, content[i]));
                })
                li.title = path.join(location, content[i])
            }
        }
    } else {
        alert('Please select location for new file.')
    }
}

// New file, folder
document.getElementById('dialog').onsubmit = (e) => {
    e.preventDefault();
    // Check folder is empty or not
    if (localStorage.getItem('folder') != null) {
        const input = document.getElementById('input');
        const dialogType = input.getAttribute('dialogtype');
        // Check filename length
        if (input.value.length > 1) {
            if (input.value === ui.commands.dialogExit) {
                document.querySelector('.inputDialog').classList.remove('visible');
            } else if (dialogType === 'command') {
                if (input.value === ui.commands.close) {
                    ipcRenderer.send('close');
                } else if (input.value === ui.commands.reload) {
                    ipcRenderer.send('reload');
                }
            } else {
                // Check is file/folder exists
                if (fs.existsSync(path.join(localStorage.getItem('folder'), input.value))) {
                    alert('File/folder exists. Please change location or the file/folder name.')
                } else {
                    document.querySelector('.inputDialog').classList.remove('visible');
                    try {
                        if (dialogType === 'file') {
                            fs.writeFileSync(path.join(localStorage.getItem('folder'), input.value), '');
                            localStorage.setItem('file', path.join(localStorage.getItem('folder'), input.value));
                            editor.setValue(' ')
                        } else if (dialogType === 'folder') {
                            fs.mkdirSync(path.join(localStorage.getItem('folder'), input.value))
                        }
                        ipcRenderer.send('reload')
                    } catch (err) {
                        alert("Error!");
                        console.log(err)
                    }
                }
            }
            input.value = '';
        } else {
            document.querySelector('.inputDialog').classList.remove('visible');
        }
    } else {
        alert('You should select location.')
    }
}

// Add visible class to new file form
ipcRenderer.on('newFile', () => {
    if (localStorage.getItem('folder') != null) {
        if (!document.querySelector('.inputDialog').classList.contains('visible')) {
            document.querySelector('.inputDialog').classList.add('visible')
        }
        document.getElementById('input').setAttribute('dialogtype', 'file');
        document.getElementById('input').focus();
    } else {
        alert('Please open any folder for creating new file.')
    }
})

// Add visible class to new folder form
ipcRenderer.on('newFolder', () => {
    if (localStorage.getItem('folder') != null) {
        if (!document.querySelector('.inputDialog').classList.contains('visible')) {
            document.querySelector('.inputDialog').classList.add('visible')
        }
        document.getElementById('input').setAttribute('dialogtype', 'folder');
        document.getElementById('input').focus();
    } else {
        alert('Please open any folder for creating new folder.')
    }
})

ipcRenderer.on('commandPrompt', () => {
    if (!document.querySelector('.inputDialog').classList.contains('visible')) {
        document.querySelector('.inputDialog').classList.add('visible')
    }
    document.getElementById('input').setAttribute('dialogtype', 'command');
    document.getElementById('input').focus();
})

ipcRenderer.on('openFolder', (event, location) => {
    openFolder(location)
})

// Open File
ipcRenderer.on('file', (event, location) => {
    if (location.length != 0) {
        editor.setValue(fs.readFileSync(location, 'utf-8'))
        localStorage.setItem('file', location)
    }
})

// Toggle Sidebar 
ipcRenderer.on('sidebar', () => {
    document.querySelector('.left').classList.toggle('unvisible');
})

// Save File
ipcRenderer.on('save', () => {
    if (localStorage.getItem('file') != null) {
        fs.writeFileSync(localStorage.getItem('file'), editor.getValue());
    } else {
        alert('You should open any file.');
    }
})

window.addEventListener('load', () => {
    // Open file automatically
    if (localStorage.getItem('file') != null) {
        if (fs.existsSync(localStorage.getItem('file'))) {
            const file = localStorage.getItem('file');
            editor.setValue(fs.readFileSync(file, 'utf-8'));
            ipcRenderer.send('setWindowTitle', file + ' - Ceres Editor');
        } else {
            editor.setValue('');
        }
    }

    // Open folder automatically
    if (localStorage.getItem('folder') != null) {
        if (fs.existsSync(localStorage.getItem('folder'))) {
            openFolder(localStorage.getItem('folder'))
        }
    }
})
