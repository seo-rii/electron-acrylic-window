const wrapper = require('bindings')('vibrancy-wrapper');
const os = require("os");

function getHwnd(win) {
    if (!win) throw new TypeError('WINDOW_NOT_GIVEN');
    try {
        let hbuf = win.getNativeWindowHandle();
        if (os.endianness() == "LE") {
            return hbuf.readInt32LE();
        } else {
            return hbuf.readInt32BE();
        }
    } catch (e) {
        throw new TypeError('NOT_VALID_WINDOW');
    }
}


function setVibrancy(win) {
    wrapper.setVibrancy(getHwnd(win));
}

function disableVibrancy(win) {
    wrapper.setVibrancy(getHwnd(win));
}

exports.setVibrancy = setVibrancy;
exports.disableVibrancy = disableVibrancy;