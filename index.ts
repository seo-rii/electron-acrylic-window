import * as bindings from './bindings'
import { VerticalRefreshRateContext } from 'win32-displayconfig'
import * as os from 'os'
import * as electron from 'electron'

const supportedType = ['light', 'dark', 'appearance-based']

const _lightThemeColor: [221, 221, 221, 136] = [221, 221, 221, 136]
const _darkThemeColor: [34, 34, 34, 136] = [34, 34, 34, 136]

let _vibrancyDebug = false;

function _getIsWindows10() {
    if (process.platform !== 'win32') return false
    return os.release().split('.')[0] === '10'
}

const _isWindows10 = _getIsWindows10()
const isWindows10 = () => _isWindows10;

function isRS4OrGreater() {
    if (!isWindows10()) return false;
    return !(os.release().split('.')[1] === '0' && parseInt(os.release().split('.')[2]) < 17134);
}

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

function sleep(duration: number) {
    return new Promise(resolve => setTimeout(resolve, duration));
}

function areBoundsEqual(left: any, right: any) {
    return left.height === right.height
        && left.width === right.width
        && left.x === right.x
        && left.y === right.y;
}

const billion = 1000 * 1000 * 1000;

function hrtimeDeltaForFrequency(freq: number) {
    return BigInt(Math.ceil(billion / freq));
}

let disableJitterFix = false

// Detect if cursor is near the screen edge. Used to disable the jitter fix in 'move' event.
function isInSnapZone() {
    const point = electron.screen.getCursorScreenPoint()
    const display = electron.screen.getDisplayNearestPoint(point)

    // Check if cursor is near the left/right edge of the active display
    if ((point.x > display.bounds.x - 20 && point.x < display.bounds.x + 20) || (point.x > display.bounds.x + display.bounds.width - 20 && point.x < display.bounds.x + display.bounds.width + 20)) {
        return true
    }
    return false
}

interface VibrancyConfig {
    colors: { r: number, g: number, b: number, a: number }
    effect: 0 | 1;
    useCustomWindowRefreshMethod?: boolean;
    maximumRefreshRate?: number;
    disableOnBlur?: boolean;
    debug: boolean
    currentOpacity: number
}

function dbHexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})$/i.exec(hex);
    return result ? parseInt(result[1], 16) : undefined;
}

function getColorsFromTheme(theme: VibrancyOptions['theme']): VibrancyConfig['colors'] {
    const unkownTheme = typeof theme === 'string' && supportedType.indexOf(theme) === -1

    const dark = {
        r: _darkThemeColor[0],
        g: _darkThemeColor[1],
        b: _darkThemeColor[2],
        a: _darkThemeColor[3]
    };

    const light = {
        r: _lightThemeColor[0],
        g: _lightThemeColor[1],
        b: _lightThemeColor[2],
        a: _lightThemeColor[3]
    };

    if (unkownTheme || theme === 'appearance-based') {
        if (electron.nativeTheme.shouldUseDarkColors)
            // dark
            return dark
        else
            return light
    }

    if (theme === 'light')
        return light

    if (theme === 'dark')
        return dark

    if (typeof theme === 'object') {
        if ('hex' in theme) {
            const r = dbHexToRgb(theme.hex.slice(0, 2));
            const g = dbHexToRgb(theme.hex.slice(2, 4));
            const b = dbHexToRgb(theme.hex.slice(4, 6));
            const a = dbHexToRgb(theme.hex.slice(6, 8));

            if (!(r && g && b && a))
                return light

            return { r, g, b, a }
        } else if ('rgba' in theme) {
            return {
                r: theme.rgba[0],
                g: theme.rgba[1],
                b: theme.rgba[2],
                a: theme.rgba[3]
            }
        }
    }

    return light
}

function opFormatter(vibrancyOptions: Vibrancy | undefined): VibrancyConfig {
    const defaultSettings: VibrancyOptions = {
        theme: undefined,
        effect: 'acrylic',
        useCustomWindowRefreshMethod: true,
        maximumRefreshRate: 60,
        disableOnBlur: true,
        debug: false
    }

    const options = Object.assign(defaultSettings, typeof vibrancyOptions === "object" ? vibrancyOptions : { theme: vibrancyOptions })

    // Merge provided settings into defaults
    let config: VibrancyConfig = {
        debug: options.debug ?? false,
        disableOnBlur: options.disableOnBlur,
        effect: 0,
        maximumRefreshRate: options.maximumRefreshRate,
        useCustomWindowRefreshMethod: options.useCustomWindowRefreshMethod,
        colors: getColorsFromTheme(options.theme),
        currentOpacity: 0
    }

    // Set blur type
    if (options.effect === 'acrylic' && isRS4OrGreater())
        config.effect = 1;

    // Debug output
    if (_vibrancyDebug)
        console.log(config)

    return config;
}

/**
 * The theme to apply to the vibrancy. Can be 'light',
 * 'dark', 'appearance-based' or a custom HEX color
 * with alpha.
 */
type VibrancyTheme = 'light' | 'dark' | 'appearance-based' | { hex: string } | { rgba: [number, number, number, number] };

/**
 * The effect to apply. Can be 'acrylic' or 'blur'.
 */
type VibrancyEffect = 'acrylic' | 'blur';

/**
 * The vibrancy object
 */
interface VibrancyOptions {
    /**
     * The theme to use.
     */
    theme?: VibrancyTheme;

    /**
     * The effect to use.
     */
    effect?: VibrancyEffect;

    /**
     * If enabled, we use a custom window resize/move
     * handler for performance.
     */
    useCustomWindowRefreshMethod?: boolean;

    /**
     * Maximum value to refresh application screen
     * in seconds.
     */
    maximumRefreshRate?: number;

    /**
     * If true, acrylic effect will be disabled whe
     * window lost focus.
     */
    disableOnBlur?: boolean;

    debug?: boolean
}

type Vibrancy = VibrancyTheme | VibrancyOptions

/**
 * Allow modifying default BrowserWindowConstructorOptions
 * to change vibrancy to VibrancyOptions.
 */
type Modify<T, R> = Omit<T, keyof R> & R;

/**
 * The new options of the BrowserWindow with the VibrancyOptions.
 */
type AcrylicBrowserWindowConstructorOptions = Modify<electron.BrowserWindowConstructorOptions, {

    /**
     * The vibrancy settings for the window. Can be
     * a VibrancyTheme or the VibrancyOptions object.
     */
    vibrancy?: Vibrancy
}>;

interface WindowConfig {
    vibrancyActivated: boolean
    vibrnacyConfig: VibrancyConfig
}

const windowConfigs: Record<number, WindowConfig> = {}

class BrowserWindow extends electron.BrowserWindow {    
    constructor(options?: AcrylicBrowserWindowConstructorOptions) {
        super(Object.assign(options, { vibrancy: undefined }))

        let oShow = options?.show ?? true;

        if (typeof options?.vibrancy === 'object' && 'debug' in options.vibrancy && options.vibrancy.debug)
            _vibrancyDebug = true;


        let config = opFormatter(options?.vibrancy);

        if (isWindows10() && config) {
            props.vibrancy = null;
            if (config.theme)
                props.backgroundColor = (config.colors ? config.colors.base.substring(0, 7) : false);
            props.show = false;
        }


        if (isWindows10())
            BrowserWindow._bindAndReplace(win, BrowserWindow.setVibrancy);

        const winConf = windowConfigs[this.id] = {
            vibrnacyConfig: config,
            vibrancyActivated: false
        }

        if (isWindows10() && config && config.useCustomWindowRefreshMethod) {

            // Unfortunately, we have to re-implement moving and resizing.
            // Enabling vibrancy slows down the window's event handling loop to the
            // point building a mouse event backlog. If you just handle these events
            // in the backlog without taking the time difference into consideration,
            // you end up with visible movement lag.
            //
            // We tried pairing 'will-move' with 'move', but Electron actually sends the
            // 'move' events _before_ Windows actually commits to the operation. There's
            // likely some queuing going on that's getting backed up. This is not the case
            // with 'will-resize' and 'resize', which need to use the default behavior
            // for compatibility with soft DPI scaling.
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

            // Ensure all movement operation is serialized, by setting up a continuous promise chain
            // All movement operation will take the form of
            //
            //     boundsPromise = boundsPromise.then(() => { /* work */ })
            //
            // So that there are no asynchronous race conditions.
            let pollingRate;
            let doFollowUpQuery = false, isMoving = false, shouldMove = false;
            let moveLastUpdate = BigInt(0), resizeLastUpdate = BigInt(0);
            let lastWillMoveBounds, lastWillResizeBounds, desiredMoveBounds;
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
                    if (_vibrancyDebug && rate != pollingRate) console.log(`New polling rate: ${rate}`)
                    pollingRate = rate || 30;
                }
            }

            function setWindowBounds(bounds) {
                if (win.isDestroyed()) {
                    return;
                }
                win.setBounds(bounds);
                desiredMoveBounds = win.getBounds();
            }

            function currentTimeBeforeNextActivityWindow(lastTime, forceFreq) {
                return process.hrtime.bigint() <
                    lastTime + hrtimeDeltaForFrequency(forceFreq || pollingRate || 30);
            }

            function guardingAgainstMoveUpdate(fn) {
                if (pollingRate === undefined || !currentTimeBeforeNextActivityWindow(moveLastUpdate)) {
                    moveLastUpdate = process.hrtime.bigint();
                    fn();
                    return true;
                } else {
                    return false;
                }
            }

            win.on('will-move', (e, newBounds) => {
                if (win._vibrancyOp.opacityInterval) return;
                // We get a _lot_ of duplicate bounds sent to us in this event.
                // This messes up our timing quite a bit.
                if (lastWillMoveBounds !== undefined && areBoundsEqual(lastWillMoveBounds, newBounds)) {
                    e.preventDefault();
                    return;
                }
                if (lastWillMoveBounds) {
                    newBounds.width = lastWillMoveBounds.width;
                    newBounds.height = lastWillMoveBounds.height;
                }
                lastWillMoveBounds = newBounds;
                // If we're asked to perform some move update and it's under
                // the refresh speed limit, we can just do it immediately.
                // This also catches moving windows with the keyboard.
                const didOptimisticMove = !isMoving && guardingAgainstMoveUpdate(() => {
                    // Do nothing, the default behavior of the event is exactly what we want.
                    desiredMoveBounds = undefined;
                });
                if (didOptimisticMove) {
                    boundsPromise = boundsPromise.then(doFollowUpQueryIfNecessary);
                    return;
                }
                e.preventDefault();

                // Track if the user is moving the window
                if (win._moveTimeout) clearTimeout(win._moveTimeout);
                win._moveTimeout = setTimeout(() => {
                    shouldMove = false;
                }, 1000 / Math.min(pollingRate, config.maximumRefreshRate));

                // Disable next event ('move') if cursor is near the screen edge
                disableJitterFix = isInSnapZone()

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
                                if (lastWillResizeBounds && lastWillResizeBounds.width) setWindowBounds({
                                    x: Math.floor(basisBounds.x + (cursor.x - basisCursor.x)),
                                    y: Math.floor(basisBounds.y + (cursor.y - basisCursor.y)),
                                    width: Math.floor(lastWillResizeBounds.width / screen.getDisplayMatching(basisBounds).scaleFactor),
                                    height: Math.floor(lastWillResizeBounds.height / screen.getDisplayMatching(basisBounds).scaleFactor)
                                });
                                else setWindowBounds({
                                    x: Math.floor(basisBounds.x + (cursor.x - basisCursor.x)),
                                    y: Math.floor(basisBounds.y + (cursor.y - basisCursor.y)),
                                    width: Math.floor(lastWillMoveBounds.width / screen.getDisplayMatching(basisBounds).scaleFactor),
                                    height: Math.floor(lastWillMoveBounds.height / screen.getDisplayMatching(basisBounds).scaleFactor)
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
            });

            win.on('move', (e) => {
                if (disableJitterFix) {
                    return false;
                }
                if (isMoving || win.isDestroyed()) {
                    e.preventDefault();
                    return false;
                }
                // As insane as this sounds, Electron sometimes reacts to prior
                // move events out of order. Specifically, if you have win.setBounds()
                // twice, then for some reason, when you exit the move state, the second
                // call to win.setBounds() gets reverted to the first call to win.setBounds().
                //
                // Again, it's nuts. But what we can do in this circumstance is thwack the
                // window back into place just to spite Electron. Yes, there's a shiver.
                // No, there's not much we can do about it until Electron gets their act together.
                if (desiredMoveBounds !== undefined) {
                    const forceBounds = desiredMoveBounds;
                    desiredMoveBounds = undefined;
                    win.setBounds({
                        x: Math.floor(forceBounds.x),
                        y: Math.floor(forceBounds.y),
                        width: Math.floor(forceBounds.width),
                        height: Math.floor(forceBounds.height)
                    });
                }
            });

            win.on('will-resize', (e, newBounds) => {
                if (lastWillResizeBounds !== undefined && areBoundsEqual(lastWillResizeBounds, newBounds)) {
                    e.preventDefault();
                    return;
                }

                lastWillResizeBounds = newBounds;

                // 60 Hz ought to be enough... for resizes.
                // Some systems have trouble going 120 Hz, so we'll just take the lower
                // of the current pollingRate and 60 Hz.
                if (pollingRate !== undefined &&
                    currentTimeBeforeNextActivityWindow(resizeLastUpdate, Math.min(pollingRate, config.maximumRefreshRate))) {
                    e.preventDefault();
                    return false;
                }
                // We have to count this twice: once before the resize,
                // and once after the resize. We actually don't have any
                // timing control around _when_ the resize happened, so
                // we have to be pessimistic.
                resizeLastUpdate = process.hrtime.bigint();
            });

            win.on('resize', () => {
                resizeLastUpdate = process.hrtime.bigint();
                boundsPromise = boundsPromise.then(doFollowUpQueryIfNecessary);
            });

            // Close the VerticalRefreshRateContext so Node can exit cleanly
            win.on('closed', refreshCtx.close);
        }

        if (config && config.disableOnBlur) {
            win._vibrancyOp.opacity = 0

            win.on('blur', () => {
                if (isWindows10() && win._vibrancyOp) {
                    win._vibrancyOp.targetOpacity = 255
                    if (!win._vibrancyOp.opacityInterval)
                        win._vibrancyOp.opacityInterval = setInterval(() => {
                            try {
                                let colorDiff = (255 - win._vibrancyOp.colors.a) / 3.5
                                if (Math.abs(win._vibrancyOp.currentOpacity - win._vibrancyOp.targetOpacity) < colorDiff) {
                                    win._vibrancyOp.currentOpacity = win._vibrancyOp.targetOpacity
                                    clearInterval(win._vibrancyOp.opacityInterval)
                                    win._vibrancyOp.opacityInterval = 0
                                } else if (win._vibrancyOp.currentOpacity > win._vibrancyOp.targetOpacity) win._vibrancyOp.currentOpacity -= colorDiff
                                else win._vibrancyOp.currentOpacity += colorDiff
                                _setVibrancy(win, win._vibrancyOp)
                            } catch (e) {

                            }
                        }, 1000 / 30)
                }
            })

            win.on('focus', () => {
                if (isWindows10() && win._vibrancyOp) {
                    win._vibrancyOp.targetOpacity = win._vibrancyOp.colors.a
                    if (!win._vibrancyOp.opacityInterval)
                        win._vibrancyOp.opacityInterval = setInterval(() => {
                            try {
                                let colorDiff = (255 - win._vibrancyOp.colors.a) / 3.5
                                if (Math.abs(win._vibrancyOp.currentOpacity - win._vibrancyOp.targetOpacity) < colorDiff) {
                                    win._vibrancyOp.currentOpacity = win._vibrancyOp.targetOpacity
                                    clearInterval(win._vibrancyOp.opacityInterval)
                                    win._vibrancyOp.opacityInterval = 0
                                } else if (win._vibrancyOp.currentOpacity > win._vibrancyOp.targetOpacity) win._vibrancyOp.currentOpacity -= colorDiff
                                else win._vibrancyOp.currentOpacity += colorDiff
                                _setVibrancy(win, win._vibrancyOp)
                            } catch (e) {

                            }
                        }, 1000 / 30)
                }
            })
        }

        if (isWindows10() && props.hasOwnProperty('vibrancy')) win.once('ready-to-show', () => {
            setTimeout(() => {
                if (oShow) win.show();
                win.setVibrancy(win._vibrancyOp);
            }, 100);
        });

        return win;
    }

    static setVibrancy(op = null) {
        if (!op) {
            // If disabling vibrancy, turn off then save
            _setVibrancy(this, null)
            this._vibrancyOp = opFormatter(op);
        } else {
            this._vibrancyOp = opFormatter(op);
            if (!isWindows10()) this.setVibrancy(this._vibrancyOp.theme);
            else {
                if (!op) _setVibrancy(this, null);
                else _setVibrancy(this, this._vibrancyOp);
            }
        }

    }

    static _bindAndReplace(object, method) {
        const boundFunction = method.bind(object);
        Object.defineProperty(object, method.name, {
            get: () => boundFunction
        });
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

exports.setVibrancy = SetVibrancy;
exports.BrowserWindow = BrowserWindow;
