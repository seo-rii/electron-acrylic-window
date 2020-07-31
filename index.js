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

function areBoundsEqual(left, right) {
    return left.height === right.height
        && left.width === right.width
        && left.x === right.x
        && left.y === right.y;
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
        let doFollowUpQuery = false, isMoving = false, shouldMove = false;
        let moveStartBounds, moveStartCursor;
        let moveLastUpdate = BigInt(0);
        let lastWillMoveBounds, lastWillResizeBounds;
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

        function setWindowBounds(bounds) {
            if (win.isDestroyed() || areBoundsEqual(bounds, win.getBounds())) {
                return;
            }
            win.setBounds(bounds);
        }

        function guardingAgainstMoveUpdate(fn) {
            const timeDelta = process.hrtime.bigint() - moveLastUpdate;
            if (pollingRate === undefined || timeDelta >= BigInt(Math.ceil(billion / pollingRate))) {
                fn();
                moveLastUpdate = process.hrtime.bigint();
                return true;
            } else {
                return false;
            }
        }

        win.on('will-move', (e, newBounds) => {
            // We get a _lot_ of duplicate bounds sent to us in this event.
            // This messes up our timing quite a bit.
            if (lastWillMoveBounds !== undefined && areBoundsEqual(lastWillMoveBounds, newBounds)) {
                e.preventDefault();
                return;
            }
            lastWillMoveBounds = newBounds;
            // If we're asked to perform some move update and it's under
            // the refresh speed limit, we can just do it immediately.
            // This also catches moving windows with the keyboard.
            const didOptimisticMove = !isMoving && guardingAgainstMoveUpdate(() => setWindowBounds(newBounds));
            if (didOptimisticMove) {
                boundsPromise = boundsPromise.then(doFollowUpQueryIfNecessary);
                return;
            }
            e.preventDefault();

            // Track if the user is moving the window
            if (win._moveTimeout) clearTimeout(win._moveTimeout);
            win._moveTimeout = setTimeout(() => {
                shouldMove = false;
            }, 1000 / 60);

            // Start new behavior if not already
            if (!shouldMove) {
                shouldMove = true;

                if (isMoving) return false;
                isMoving = true;

                // Get start positions
                const basisBounds = win.getBounds();
                const basisCursor = screen.getCursorScreenPoint();

                // Handle polling at a slower interval than the setInterval handler
                function handleIntervalTick(moveInterval) {
                    boundsPromise = boundsPromise.then(() => {
                        if (!shouldMove) {
                            isMoving = false;
                            clearInterval(moveInterval);
                            return;
                        }

                        const cursor = screen.getCursorScreenPoint();
                        const didIt = guardingAgainstMoveUpdate(() => {
                            // Set new position
                            setWindowBounds({
                                x: basisBounds.x + (cursor.x - basisCursor.x),
                                y: basisBounds.y + (cursor.y - basisCursor.y),
                                width: basisBounds.width,
                                height: basisBounds.height
                            });
                        });
                        if (didIt) {
                            return doFollowUpQueryIfNecessary(cursor);
                        }
                    });
                }

                // Poll at 600hz while moving window
                const moveInterval = setInterval(() => handleIntervalTick(moveInterval), 1000 / 600);
            }
        })

        win.on('will-resize', (e, newBounds) => {
            e.preventDefault();
            if (lastWillResizeBounds !== undefined && areBoundsEqual(lastWillResizeBounds, newBounds)) {
                return;
            }

            lastWillResizeBounds = newBounds;
            if (!win._resizeLastUpdate) win._resizeLastUpdate = BigInt(0);

            boundsPromise = boundsPromise.then(() => {
                if (process.hrtime.bigint() >= win._resizeLastUpdate + BigInt(Math.ceil(billion / pollingRate))) {
                    setWindowBounds(lastWillResizeBounds);
                    win._resizeLastUpdate = process.hrtime.bigint();
                }
                return doFollowUpQueryIfNecessary();
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