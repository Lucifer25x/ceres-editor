const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');
const os = require('os');
const fs = require('fs');
const configLocations = require('../config/configLocations.json');
let keybindings;

function loadKeybindings(){
    let keybindingConfig = configLocations.keybindings.replace("$HOME", os.homedir);
    if(fs.existsSync(keybindingConfig)){
        keybindings = require(keybindingConfig);
    } else {
        keybindings = require('../config/keybindings.json');
    }
}

loadKeybindings();

const win = {
    width: 1000,
    height: 800,
    minWidth: 1000,
    minHeight: 600
}

let mainWindow;

// Menu Template
const template = [
    {
        label: 'File',
        submenu: [
            {
                label: 'New File',
                accelerator: keybindings.newFile,
                click: () => {
                    mainWindow.webContents.send('newFile')
                }
            },
            {
                label: 'New Folder',
                accelerator: keybindings.newFolder,
                click: () => {
                    mainWindow.webContents.send('newFolder')
                }
            },
            {
                label: 'Open Folder',
                accelerator: keybindings.openFolder,
                click: async () => {
                    const { filePaths } = await dialog.showOpenDialog(
                        { properties: ['openDirectory'] }
                    )
                    const location = filePaths[0];
                    mainWindow.webContents.send('openFolder', location)
                }
            },
            {
                label: 'Open File',
                accelerator: keybindings.openFile,
                click: async () => {
                    const { filePaths } = await dialog.showOpenDialog(
                        { properties: ['openFile'] }
                    );
                    const location = filePaths[0];
                    mainWindow.webContents.send('file', location)
                }
            },
            {
                label: 'Open Command Prompt',
                accelerator: keybindings.commandPrompt,
                click: async() => {
                    mainWindow.webContents.send('commandPrompt');
                }
            },
            { type: 'separator' },
            {
                label: 'Toggle Sidebar',
                accelerator: keybindings.toggleSidebar,
                click: () => {
                    mainWindow.webContents.send('sidebar')
                }
            },
            { type: 'separator' },
            {
                label: 'Save File',
                accelerator: keybindings.saveFile,
                click: () => {
                    mainWindow.webContents.send('save')
                }
            }
        ]
    },
    {
        label: 'Editor',
        submenu: [
            {
                label: 'Home Page',
                accelerator: keybindings.homePage,
                click: () => {
                    mainWindow.loadFile(path.join(path.dirname(__dirname), 'public', 'index.html'));
                }
            },
            {
                label: 'Theme List',
                accelerator: keybindings.themeList,
                click: () => {
                    mainWindow.loadFile(path.join(path.dirname(__dirname), 'public', 'themeList.html'));
                }
            }
        ]
    },
    { role: 'editMenu' },
    { role: 'windowMenu' },
]


function createWindow() {
    // Create new BrowserWindow
    mainWindow = new BrowserWindow({
        width: win.width,
        height: win.height,
        minWidth: win.minWidth,
        minHeight: win.minHeight,
        title: 'Ceres Editor',
        icon: 'icons/icon.png',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            devTools: isDev
        }
    })

    // Load file
    mainWindow.loadFile('public/index.html');

    if (isDev) {
        template.push({ role: 'viewMenu' })
    }

    // Create custom Menu
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
}

ipcMain.on('reload', () => {
    mainWindow.webContents.reload();
})

ipcMain.on('close', () => {
    mainWindow.close();
})

ipcMain.on('setWindowTitle', (event, title) => {
    mainWindow.setTitle(title)
})

// Create window
app.whenReady().then(() => {
    createWindow();
}).catch(err => console.log(err))
