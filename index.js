const {setVibrancy: wSetVibrancy, disableVibrancy: wDisableVibrancy} = require("bindings")("vibrancy-wrapper");
const os = require("os");
const eBrowserWindow = require("electron").BrowserWindow;
const {nativeTheme} = require("electron");
const supportedType = ['light', 'dark', 'appearance-based'];

function isWindows10() {
    if (process.platform !== 'win32') return false;
    return os.release().split('.')[0] === '10';
}

function isRS4OrGreater() {
    if (!isWindows10()) return false;
    return !(os.release().split('.')[1] === '0' && parseInt(os.release().split('.')[2]) < 17134);
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
        if (isWindows10() && props.hasOwnProperty('vibrancy')) this.setVibrancy(props.vibrancy);
    }

    setVibrancy(op = null) {
        if (op) this.setVibrancy(null);
        if (!isWindows10()) super.setVibrancy(op);
        else {
            if (!op in supportedType) op = 'appearance-based';
            if (op === 'appearance-based') {
                if (nativeTheme.shouldUseDarkColors) op = 'dark';
                else op = 'light';
            }
            if (op) wSetVibrancy(getHwnd(this), op === 'light' ? 0 : 1, isRS4OrGreater() ? 1 : 0);
            else wDisableVibrancy(getHwnd(this));
        }
    }
}

function setVibrancy(win, op = 'appearance-based') {
    if (op) setVibrancy(win, null);
    if (!isWindows10()) win.setVibrancy(op);
    else {
        if (!op in supportedType) op = 'appearance-based';
        if (op === 'appearance-based') {
            if (nativeTheme.shouldUseDarkColors) op = 'dark';
            else op = 'light';
        }
        if (op) wSetVibrancy(getHwnd(this), op === 'light' ? 0 : 1, isRS4OrGreater() ? 1 : 0);
        else wDisableVibrancy(getHwnd(this));
    }
}

function disableVibrancy(win) {
    setVibrancy(win, null);
}

exports.setVibrancy = setVibrancy;
exports.disableVibrancy = disableVibrancy;
exports.BrowserWindow = vBrowserWindow;