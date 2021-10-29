const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        title: 'Text Editor',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            devTools: true
        }
    })

    mainWindow.loadFile(path.join(__dirname, 'index.html'))

    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Open File',
                    accelerator: 'Ctrl+O',
                    click: async () => {
                        const { filePaths } = await dialog.showOpenDialog(
                            { properties: ['openFile']}
                        );
                        const location = filePaths[0];
                        mainWindow.webContents.send('file', location)
                    }
                },
                { type: 'separator' },
                {
                    label: 'Save File',
                    accelerator: 'Ctrl+S',
                    click: ()=>{
                        mainWindow.webContents.send('save')
                    }
                }
            ]
        },
        { role: 'editMenu' },
        { role: 'viewMenu' },
        { role: 'windowMenu' }
    ]

    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
}

app.whenReady().then(() => {
    createWindow();
}).catch(err => console.log(err))