"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleDebugging = void 0;
let _debug = false;
function debug(...msgs) {
    if (!_debug)
        return;
    console.log(...msgs);
}
exports.default = debug;
function toggleDebugging(debug) {
    _debug = debug;
}
exports.toggleDebugging = toggleDebugging;
//# sourceMappingURL=debug.js.map