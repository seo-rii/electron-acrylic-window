const {wSetVibrancy, wDisalbeVibrancy} = {setVibrancy, disableVibrancy} = require('bindings')('vibrancy-wrapper');
const os = require("os");
const eBrowserWindow = require('electron').BrowserWindow;

function isWindows10() {
    if (process.platform !== 'win32') return false;
    return os.release().split('.')[0] === '10';
}

function getHwnd(win) {
    if (!win) throw new TypeError('WINDOW_NOT_GIVEN');
    try {
        const hbuf = win.getNativeWindowHandle();
        if (os.endianness() === "LE") {
            return hbuf.readInt32LE();
        } else {
            return hbuf.readInt32BE();
        }
    } catch (e) {
        throw new TypeError('NOT_VALID_WINDOW');
    }
}

class vBrowserWindow extends eBrowserWindow {
    constructor(props) {
        super(props);
        if (isWindows10() && props.hasOwnProperty('vibrancy')) wSetVibrancy(getHwnd(this));
    }

    setVibrancy(type = null) {
        if (!isWindows10()) super.setVibrancy(type);
        else {
            if (type) wSetVibrancy(getHwnd(this));
            else wDisalbeVibrancy.disableVibrancy(getHwnd(this));
        }
    }
}

function setVibrancy(win, op = null) {
    if (!isWindows10()) win.setVibrancy(op);
    else wSetVibrancy(getHwnd(win));
}

function disableVibrancy(win) {
    if (!isWindows10()) win.setVibrancy(null);
    else wDisalbeVibrancy(getHwnd(win));
}

exports.setVibrancy = setVibrancy;
exports.disableVibrancy = disableVibrancy;
exports.BrowserWindow = vBrowserWindow;