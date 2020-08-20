const {setVibrancy: wSetVibrancy, disableVibrancy: wDisableVibrancy} = require("bindings")("vibrancy-wrapper");
const os = require("os");
const eBrowserWindow = require("electron").BrowserWindow;
const {nativeTheme, screen} = require("electron");
const supportedType = ['light', 'dark', 'appearance-based'];
const {getMonitorInfo} = require('display-info');

const _lightThemeColor = '#FFFFFF40', _darkThemeColor = '#44444480';

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

function _setVibrancy(win, op = null) {
    if (op && supportedType.indexOf(op) === -1 && op[0] !== '#') op = 'appearance-based';
    if (op === 'appearance-based') {
        if (nativeTheme.shouldUseDarkColors) op = 'dark';
        else op = 'light';
    }
    let redValue, greenValue, blueValue, alphaValue;
    if (op === 'light') op = _lightThemeColor;
    else if (op === 'dark') op = _darkThemeColor;
    if (op) redValue = parseInt(op.substring(1, 3), 16), greenValue = parseInt(op.substring(3, 5), 16), blueValue = parseInt(op.substring(5, 7), 16), alphaValue = parseInt(op.substring(7, 9), 16);
    if (op) {
        wSetVibrancy(getHwnd(win), isRS4OrGreater() ? 1 : 0, redValue, greenValue, blueValue, alphaValue);
        win._vibrancyActivated = true;
        setTimeout(() => {
            if (win._vibrancyActivated) win.setBackgroundColor('#00000000');
        }, 50);
    } else {
        win._ignoreBlurFocusEvent = 2;
        win._vibrancyActivated = false;
        let bOp = win._vibrancyOp;
        if (bOp === 'light') bOp = _lightThemeColor;
        else if (bOp === 'dark') bOp = _darkThemeColor;
        win.setBackgroundColor('#99' + bOp.substring(1, 7));
        setTimeout(() => {
            if (!win._vibrancyActivated) wDisableVibrancy(getHwnd(win));
        }, 10);
    }
}

class vBrowserWindow extends eBrowserWindow {
    constructor(props) {
        if (props.vibrancy) {
            let bOp = props.vibrancy;
            if (bOp === 'light') bOp = _lightThemeColor;
            else if (bOp === 'dark') bOp = _darkThemeColor;
            props.backgroundColor = bOp.substring(0, 7);
            props.show = false;
        }
        const win = new eBrowserWindow(props);
        vBrowserWindow._bindAndReplace(win, vBrowserWindow.setVibrancy);
        win._vibrancyOp = props.vibrancy;

        let pollingRate = 0;
        let monitorInfo = getMonitorInfo();

        for (let i of monitorInfo) {
            if (i.frameRate > pollingRate) pollingRate = i.frameRate;
        }
        if (!pollingRate) pollingRate = 60;

        // Replace window moving behavior to fix mouse polling rate bug
        win.on('will-move', (e) => {
            e.preventDefault()

            // Track if the user is moving the window
            if (win._moveTimeout) clearTimeout(win._moveTimeout);
            win._moveTimeout = setTimeout(
                () => {
                    win._isMoving = false
                    clearInterval(win._moveInterval)
                    win._moveInterval = null
                }, 1000 / 60)

            // Start new behavior if not already
            if (!win._isMoving) {
                win._isMoving = true
                if (win._moveInterval) return false;

                // Get start positions
                win._moveLastUpdate = 0
                win._moveStartBounds = win.getBounds()
                win._moveStartCursor = screen.getCursorScreenPoint()

                // Poll at 600hz while moving window
                win._moveInterval = setInterval(() => {
                    const now = Date.now()
                    if (now >= win._moveLastUpdate + (1000 / pollingRate)) {
                        win._moveLastUpdate = now
                        const cursor = screen.getCursorScreenPoint()

                        // Set new position
                        win.setBounds({
                            x: win._moveStartBounds.x + (cursor.x - win._moveStartCursor.x),
                            y: win._moveStartBounds.y + (cursor.y - win._moveStartCursor.y),
                            width: win._moveStartBounds.width,
                            height: win._moveStartBounds.height
                        })
                    }
                }, 1000 / 600)
            }
        })

        // Replace window resizing behavior to fix mouse polling rate bug
        win.on('will-resize', (e, newBounds) => {
            const now = Date.now()
            if (!win._resizeLastUpdate) win._resizeLastUpdate = 0;
            if (now >= win._resizeLastUpdate + (1000 / pollingRate)) {
                win._resizeLastUpdate = now
            } else {
                e.preventDefault()
            }
        })

        win.on('blur', () => {
            if (win._vibrancyOp) _setVibrancy(win, null);
        })

        win.on('focus', () => {
            if (win._vibrancyOp) _setVibrancy(win, win._vibrancyOp);
        })

        if (isWindows10() && props.hasOwnProperty('vibrancy')) win.once('ready-to-show', () => {
            setTimeout(() => {
                win.show();
                win.setVibrancy(props.vibrancy);
            }, 100);
        });

        return win;
    }

    static setVibrancy(op = null) {
        this._vibrancyOp = op;
        if (!isWindows10()) super.setVibrancy(op);
        else {
            if (op) _setVibrancy(this, null);
            _setVibrancy(this, op);
        }
    }

    static _bindAndReplace(object, method) {
        const boundFunction = method.bind(object);
        Object.defineProperty(object, method.name, {
            get: () => boundFunction
        });
    }
}

function setVibrancy(win, op = 'appearance-based') {
    win._vibrancyOp = op;
    if (!isWindows10()) win.setVibrancy(op);
    else {
        if (op) _setVibrancy(this, null);
        else _setVibrancy(this, op);
    }
}

function disableVibrancy(win) {
    setVibrancy(win, null);
}

exports.setVibrancy = setVibrancy;
exports.disableVibrancy = disableVibrancy;
exports.BrowserWindow = vBrowserWindow;