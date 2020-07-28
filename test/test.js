const {BrowserWindow} = require('../index.js');
const {app} = require('electron');

let win;

function createWindow() {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        frame: false,
        transparent: true,
        vibrancy: 'dark'
    });
    win.loadURL(`file://${__dirname}/test.html`);
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