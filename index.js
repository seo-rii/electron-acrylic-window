const wrapper = require('bindings')('vibrancy-wrapper');
const os = require("os");

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


function setVibrancy(win) {
    if (process.platform !== 'win32') throw new Error('NOT_MATCHING_PLATFORM');
    wrapper.setVibrancy(getHwnd(win));
}

function disableVibrancy(win) {
    if (process.platform !== 'win32') throw new Error('NOT_MATCHING_PLATFORM');
    wrapper.disableVibrancy(getHwnd(win));
}

exports.setVibrancy = setVibrancy;
exports.disableVibrancy = disableVibrancy;