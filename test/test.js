const {BrowserWindow} = require('../index.js');
const {app} = require('electron');

let win;

function createWindow() {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        frame: false,
        webPreferences: {
            nodeIntegration: true
        },
        vibrancy: 'dark',
    });
    win.loadURL(`file://${__dirname}/test.html`);
    //win.webContents.openDevTools({mode: "detach"});
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (win === null) {
        createWindow();
    }
});