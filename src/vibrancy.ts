import * as bindings from './bindings'
import { BrowserWindow } from './browserWindow'

const supportedType = ['light', 'dark', 'appearance-based']

const _lightThemeColor: [221, 221, 221, 136] = [221, 221, 221, 136]
const _darkThemeColor: [34, 34, 34, 136] = [34, 34, 34, 136]

let _vibrancyDebug = false;

function getHwnd(win: BrowserWindow) {
    if (!win) throw new TypeError('WINDOW_NOT_GIVEN')
    try {
        const hbuf = win.getNativeWindowHandle()
        if (os.endianness() === "LE") {
            return hbuf.readInt32LE(0)
        } else {
            return hbuf.readInt32BE(0)
        }
    } catch (e) {
        throw new TypeError('NOT_VALID_WINDOW')
    }
}

function _setVibrancy(win: BrowserWindow, config: VibrancyConfig) {
    const winConfig = windowConfigs[win.id]

    if (config && config.colors) {
        if (_vibrancyDebug) console.log("Vibrancy On", config)
        bindings.setVibrancy(getHwnd(win), config.effect, config.colors.r, config.colors.g, config.colors.b, winConfig.vibrnacyConfig.currentOpacity);
        winConfig.vibrancyActivated = true;
        setTimeout(() => {
            try {
                if (winConfig.vibrancyActivated) win.setBackgroundColor('#00000000');
            } catch (e) {

            }
        }, 50);
    } else {
        if (_vibrancyDebug) console.log("Vibrancy Off", config, winConfig.vibrnacyConfig)
        winConfig.vibrancyActivated = false;
        if (winConfig.vibrnacyConfig) {
            win.setBackgroundColor((winConfig.vibrnacyConfig && winConfig.vibrnacyConfig.colors ? "#FE" + winConfig.vibrnacyConfig.colors.r + winConfig.vibrnacyConfig.colors.g + winConfig.vibrnacyConfig.colors.b : "#000000"));
        }
        setTimeout(() => {
            try {
                if (!winConfig.vibrancyActivated) bindings.disableVibrancy(getHwnd(win));
            } catch (e) {

            }
         }, 10);
    }
}

function SetVibrancy(win, op = 'appearance-based') {
    // If disabling vibrancy, turn off then save
    if (!op) {
        _setVibrancy(this, null);
        win._vibrancyOp = opFormatter(op);
    } else {
        win._vibrancyOp = opFormatter(op);
        if (!isWindows10()) win.setVibrancy(win._vibrancyOp);
        else {
            if (!op) _setVibrancy(this, null);
            else _setVibrancy(this, win._vibrancyOp);
        }
    }
}