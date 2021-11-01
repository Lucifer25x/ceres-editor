const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

var editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.setOptions({
    fontSize: '16px'
})

// Open Folder
function openFolder(location) {
    // Check user is selected any location or not
    var folderName = location.replace(/^.*[\\\/]/, '')
    document.getElementById('flname').textContent = folderName;
    document.querySelector('.flname').title = location;
    if (location.length != 0) {
        localStorage.setItem('folder', location);
        const content = fs.readdirSync(location);
        const parent = document.getElementById('files');
        parent.innerHTML = ``;
        for (let i = 0; i < content.length; i++) {
            // Check path is file or not
            if (fs.lstatSync(path.join(location, content[i])).isFile()) {
                const li = document.createElement('li');
                const el = `<img src="./file.png" alt="file" id="icon"><span id="name">${content[i]}</span>`;
                li.innerHTML = el;
                parent.appendChild(li);
                li.addEventListener('click', () => {
                    localStorage.setItem('file', path.join(location, content[i]));
                    const cont = fs.readFileSync(path.join(location, content[i]), 'utf-8');
                    editor.setValue(cont);
                })
                li.title = path.join(location, content[i])
            } else {
                const li = document.createElement('li');
                const el = `<img src="./folder.png" alt="folder" id="icon"><span id="name">${content[i]}</span>`;
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

// Open File
ipcRenderer.on('file', (event, location) => {
    if (location.length != 0) {
        editor.setValue(fs.readFileSync(location, 'utf-8'))
        localStorage.setItem('file', location)
    }
})

// Add visible class to new file form
ipcRenderer.on('newFile', (event) => {
    if (localStorage.getItem('folder') != null) {
        document.querySelector('.newFile').classList.add('visible')
        document.getElementById('filename').focus();
    } else {
        alert('Please open any folder for creating new file.')
    }
})

ipcRenderer.on('openFolder', (event, location) => {
    openFolder(location)
})

// Save File
ipcRenderer.on('save', (event) => {
    if (localStorage.getItem('file') != null) {
        fs.writeFileSync(localStorage.getItem('file'), editor.getValue());
    } else {
        alert('You should open any file.');
    }
})

// Create new file
document.getElementById('nw').addEventListener('submit', (e) => {
    e.preventDefault();
    // Check folder is empty or not
    if (localStorage.getItem('folder') != null) {
        // Check filename length
        if (document.getElementById('filename').value.length > 1) {
            // Check file is exists or not
            if (fs.existsSync(path.join(localStorage.getItem('folder'), document.getElementById('filename').value))) {
                alert('File exists. Please change location or file name.')
            } else {
                document.querySelector('.newFile').classList.remove('visible');
                fs.writeFileSync(path.join(localStorage.getItem('folder'), document.getElementById('filename').value), ' ');
                localStorage.setItem('file', path.join(localStorage.getItem('folder'), document.getElementById('filename').value));
                editor.setValue(' ')
                ipcRenderer.send('reload')
            }
        } else {
            alert('You should write valid file name.')
        }
    } else {
        alert('You should select location for file.')
    }
})

window.addEventListener('load', () => {
    // Open file automatically
    if (localStorage.getItem('file') != null) {
        if (fs.existsSync(localStorage.getItem('file'))) {
            editor.setValue(fs.readFileSync(localStorage.getItem('file'), 'utf-8'));
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