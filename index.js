const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

var editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.setOptions({
    fontSize: '16px'
})

window.ondblclick = () => {
    if (document.querySelector('.context-menu').classList.contains('visible')) {
        document.querySelector('.context-menu').classList.remove('visible');
    }
}

// Open Folder
function openFolder(location) {
    // Check user is selected any location or not
    var folderName = location.match(/([^\/]*)\/*$/)[1];
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
                    ipcRenderer.send('setWindowTitle', path.join(location, content[i]) + ' - Text Editor');
                })
                li.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    document.querySelector('.context-menu').classList.add('visible');
                    document.querySelector('.context-menu').style.top = e.clientY + 'px';
                    document.querySelector('.context-menu').style.left = e.clientX + 'px';

                    document.getElementById('rename').addEventListener('click', () => {
                        document.querySelector('.rename').classList.add('visible');
                        document.querySelector('.context-menu').classList.remove('visible');
                    })

                    document.getElementById('delete').addEventListener('click', () => {
                        if (confirm('Are you sure to delete this file?')) {
                            fs.unlinkSync(path.join(location, content[i]));
                            localStorage.removeItem('file');
                        }
                        document.querySelector('.context-menu').classList.remove('visible');
                        ipcRenderer.send('reload')
                    })

                    document.getElementById("newName").addEventListener('submit', (e) => {
                        e.preventDefault();
                        const newName = document.getElementById('newfilename').value;
                        if (newName.length != 0) {
                            fs.renameSync(path.join(location, content[i]), path.join(location, newName));
                            localStorage.setItem('file', path.join(location, newName));
                            document.querySelector('.rename').classList.remove('visible');
                        }
                        ipcRenderer.send('reload')
                    })
                })
                li.title = path.join(location, content[i])
            } else {
                const li = document.createElement('li');
                const el = `<img src="./folder.png" alt="folder" id="icon"><span id="name">${content[i]}</span>`;
                li.innerText = el;
                parent.appendChild(li);
                li.addEventListener('click', () => {
                    // Open folder again
                    localStorage.setItem('folder', path.join(location, content[i]))
                    openFolder(path.join(location, content[i]));
                })
                li.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    document.querySelector('.context-menu').classList.add('visible');
                    document.querySelector('.context-menu').style.top = e.clientY + 'px';
                    document.querySelector('.context-menu').style.left = e.clientX + 'px';

                    document.getElementById('rename').addEventListener('click', () => {
                        document.querySelector('.rename').classList.add('visible');
                        document.querySelector('.context-menu').classList.remove('visible');
                    })

                    document.getElementById('delete').addEventListener('click', () => {
                        if (confirm('Are you sure to delete this folder?')) {
                            fs.rmdirSync(path.join(location, content[i]));
                        }
                        document.querySelector('.context-menu').classList.remove('visible');
                        ipcRenderer.send('reload')
                    })

                    document.getElementById("newName").addEventListener('submit', (e) => {
                        e.preventDefault();
                        const newName = document.getElementById('newfilename').value;
                        if (newName.length != 0) {
                            fs.renameSync(path.join(location, content[i]), path.join(location, newName));
                            document.querySelector('.rename').classList.remove('visible');
                        }
                        ipcRenderer.send('reload')
                    })
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

// Toggle Sidebar 
ipcRenderer.on('sidebar', () => {
    document.querySelector('.left').classList.toggle('unvisible');
})

// Add visible class to new file form
ipcRenderer.on('newFile', () => {
    if (localStorage.getItem('folder') != null) {
        if (document.querySelector('.newFolder').classList.contains('visible')) {
            document.querySelector('.newFolder').classList.remove('visible')
        }
        document.querySelector('.newFile').classList.add('visible')
        document.getElementById('filename').focus();
    } else {
        alert('Please open any folder for creating new file.')
    }
})

// Add visible class to new folder form
ipcRenderer.on('newFolder', () => {
    if (localStorage.getItem('folder') != null) {
        if (document.querySelector('.newFile').classList.contains('visible')) {
            document.querySelector('.newFile').classList.remove('visible')
        }
        document.querySelector('.newFolder').classList.add('visible')
        document.getElementById('foldername').focus();
    } else {
        alert('Please open any folder for creating new folder.')
    }
})

ipcRenderer.on('openFolder', (event, location) => {
    openFolder(location)
})

// Save File
ipcRenderer.on('save', () => {
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
                try {
                    fs.writeFileSync(path.join(localStorage.getItem('folder'), document.getElementById('filename').value), ' ');
                    localStorage.setItem('file', path.join(localStorage.getItem('folder'), document.getElementById('filename').value));
                    editor.setValue(' ')
                    ipcRenderer.send('reload')
                } catch (err) {
                    alert("Error!");
                    console.log(err)
                }
            }
        } else {
            alert('You should write valid file name.')
        }
    } else {
        alert('You should select location for file.')
    }
})
// Create new folder
document.getElementById('nwFolder').addEventListener('submit', (e) => {
    e.preventDefault();
    // Check folder is empty or not
    if (localStorage.getItem('folder') != null) {
        // Check filename length
        if (document.getElementById('foldername').value.length > 1) {
            // Check file is exists or not
            if (fs.existsSync(path.join(localStorage.getItem('folder'), document.getElementById('foldername').value))) {
                alert('Folder exists. Please change location or folder name.')
            } else {
                document.querySelector('.newFolder').classList.remove('visible');
                try {
                    fs.mkdirSync(path.join(localStorage.getItem('folder'), document.getElementById('foldername').value))
                    ipcRenderer.send('reload')
                } catch (err) {
                    alert("Error!");
                    console.log(err);
                }
            }
        } else {
            alert('You should write valid folder name.')
        }
    } else {
        alert('You should select location for folder.')
    }
})

window.addEventListener('load', () => {
    // Open file automatically
    if (localStorage.getItem('file') != null) {
        if (fs.existsSync(localStorage.getItem('file'))) {
            editor.setValue(fs.readFileSync(localStorage.getItem('file'), 'utf-8'));
            ipcRenderer.send('setWindowTitle', localStorage.getItem('file') + ' - Text Editor');
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
