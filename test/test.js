const {BrowserWindow} = require('../index.js');
const {app} = require('electron');
const os = require("os");

let win;

function isWindows10() {
    if (process.platform !== 'win32') return false;
    return os.release().split('.')[0] === '10';
}

function createWindow() {
    let vibrancyOp;
    if (isWindows10()) vibrancyOp = {
        theme: '#661237cc',
        effect: 'acrylic',
        useCustomWindowRefreshMethod: true,
        disableOnBlur: true,
        debug: true
    };
    else vibrancyOp = 'dark';
    win = new BrowserWindow({
        width: 800,
        height: 600,
        frame: false,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true
        },
        vibrancy: vibrancyOp
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
