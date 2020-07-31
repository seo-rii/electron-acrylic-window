const {setVibrancy: wSetVibrancy, disableVibrancy: wDisableVibrancy} = require("bindings")("vibrancy-wrapper");
const os = require("os");
const eBrowserWindow = require("electron").BrowserWindow;
const {nativeTheme, screen} = require("electron");
const { VerticalRefreshRateContext } = require("win32-displayconfig");
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

function sleep(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

const billion = 1000 * 1000 * 1000;

class vBrowserWindow extends eBrowserWindow {
    constructor(props) {
        props.backgroundColor = '#00000000';
        props.show = false;
        const win = new eBrowserWindow(props);
        // Unfortunately, we have to re-implement moving and resizing.
        // Enabling vibrancy slows down the window's event handling loop to the
        // point building a mouse event backlog. If you just handle these events
        // in the backlog without taking the time difference into consideration,
        // you end up with visible movement lag.
        //
        // We tried pairing 'will-resize' with 'resize' and 'will-move' with 'move',
        // but Electron actually sends the 'resize' and 'move' events _before_ Windows
        // actually commits to the operation. There's likely some queuing going on
        // that's getting backed up.
        //
        // The ideal rate of moving and resizing is based on the vertical sync
        // rate: if your display is only fully updating at 120 Hz, we shouldn't
        // be attempting to reset positions or sizes any faster than 120 Hz.
        // If we were doing this in a browser context, we would just use
        // requestAnimationFrame and call it a day. But we're not inside of a
        // browser context here, so we have to resort to clever hacks.
        //
        // This VerticalRefreshRateContext maps a point in screen space to the
        // vertical sync rate of the display(s) actually handing that point.
        // It handles multiple displays with varying vertical sync rates,
        // and changes to the display configuration while this process is running.
        const refreshCtx = new VerticalRefreshRateContext();

        function getRefreshRateAtCursor(cursor) {
            cursor = cursor || screen.getCursorScreenPoint();
            return refreshCtx.findVerticalRefreshRateForDisplayPoint(cursor.x, cursor.y);
        }

        vBrowserWindow._bindAndReplace(win, vBrowserWindow.setVibrancy);

        // Ensure all movement operation is serialized, by setting up a continuous promise chain
        // All movement operation will take the form of
        //
        //     boundsPromise = boundsPromise.then(() => { /* work */ })
        //
        // So that there are no asynchronous race conditions.
        let pollingRate;
        let doFollowUpQuery = false;
        let boundsPromise = Promise.race([
            getRefreshRateAtCursor().then(rate => {
                pollingRate = rate || 30;
                doFollowUpQuery = true;
            }),
            // Establishing the display configuration can fail; we can't
            // just block forever if that happens. Instead, establish
            // a fallback polling rate and hope for the best.
            sleep(2000).then(() => {
                pollingRate = pollingRate || 30;
            })
        ]);

        async function doFollowUpQueryIfNecessary(cursor) {
            if (doFollowUpQuery) {
                const rate = await getRefreshRateAtCursor(cursor);
                pollingRate = rate || 30;
            }
        }

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
                win._moveLastUpdate = BigInt(0)
                win._moveStartBounds = win.getBounds()
                win._moveStartCursor = screen.getCursorScreenPoint()

                // Handle polling at a slower interval than the setInterval handler
                function handleIntervalTick(moveInterval) {
                    if (win._moveInterval !== moveInterval) {
                        // If the intervals aren't equal, then _this_ invocation is finished.
                        // Another one may or may not be going on instead.
                        return;
                    }

                    boundsPromise = boundsPromise.then(() => {
                        const now = process.hrtime.bigint();
                        if (now >= win._moveLastUpdate + BigInt(Math.ceil(billion / pollingRate))) {
                            win._moveLastUpdate = now;
                            const cursor = screen.getCursorScreenPoint();

                            // Set new position
                            win.setBounds({
                                x: win._moveStartBounds.x + (cursor.x - win._moveStartCursor.x),
                                y: win._moveStartBounds.y + (cursor.y - win._moveStartCursor.y),
                                width: win._moveStartBounds.width,
                                height: win._moveStartBounds.height
                            });
                            return doFollowUpQueryIfNecessary(cursor);
                        }
                    })
                }

                // Poll at 600hz while moving window
                const moveInterval = setInterval(() => handleIntervalTick(moveInterval), 1000 / 600);
                win._moveInterval = moveInterval;
            }
        })

        win.on('will-resize', (e, newBounds) => {
            e.preventDefault();
            if (!win._resizeLastUpdate) win._resizeLastUpdate = BigInt(0);
            win._lastRequestedBounds = newBounds;

            boundsPromise = boundsPromise
                .then(doFollowUpQueryIfNecessary)
                .then(() => {
                    const now = process.hrtime.bigint();
                    if (now >= win._resizeLastUpdate + BigInt(Math.ceil(billion / pollingRate))) {
                        win._resizeLastUpdate = now;
                        win.setBounds(win._lastRequestedBounds);
                    }
                });
        })

        // Close the VerticalRefreshRateContext so Node can exit cleanly
        win.on("closed", refreshCtx.close);

        if (isWindows10() && props.hasOwnProperty('vibrancy')) win.once('ready-to-show', () => {
            setTimeout(() => {
                win.show();
                win.setVibrancy(props.vibrancy);
            }, 100);
        });

        return win;
    }

    static setVibrancy(op = null) {
        if (op) this.setVibrancy(null);
        if (!isWindows10()) super.setVibrancy(op);
        else {
            if (op && supportedType.indexOf(op) === -1) op = 'appearance-based';
            if (op === 'appearance-based') {
                if (nativeTheme.shouldUseDarkColors) op = 'dark';
                else op = 'light';
            }
            if (op) wSetVibrancy(getHwnd(this), op === 'light' ? 0 : 1, isRS4OrGreater() ? 1 : 0);
            else wDisableVibrancy(getHwnd(this));
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
    if (op) setVibrancy(win, null);
    if (!isWindows10()) win.setVibrancy(op);
    else {
        if (op && supportedType.indexOf(op) === -1) op = 'appearance-based';
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