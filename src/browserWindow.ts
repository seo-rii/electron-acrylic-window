import * as electron from 'electron'

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

export interface WindowConfig {
    vibrancyActivated: boolean
    vibrnacyConfig: VibrancyConfig
}

interface VibrancyConfig {
    colors: { r: number, g: number, b: number, a: number, /*unknown*/base?: unknown }
    effect: 0 | 1;
    useCustomWindowRefreshMethod?: boolean;
    maximumRefreshRate?: number;
    disableOnBlur?: boolean;
    debug: boolean
    currentOpacity: number
}

const windowConfigs: Record<number, WindowConfig> = {}

export class BrowserWindow extends electron.BrowserWindow {
    constructor(options?: AcrylicBrowserWindowConstructorOptions) {
        super(Object.assign(options, { vibrancy: undefined }))

        let oShow = options?.show ?? true;

        if (typeof options?.vibrancy === 'object' && 'debug' in options.vibrancy && options.vibrancy.debug)
            _vibrancyDebug = true;


        let config = opFormatter(options?.vibrancy);

        if (isWindows10() && config) {
            options.vibrancy = null;
            if (config.theme)
                options.backgroundColor = (config.colors ? config.colors.base?.substring(0, 7) : false);
            options.show = false;
        }


        if (isWindows10())
            BrowserWindow._bindAndReplace(win, BrowserWindow.setVibrancy);

        const winConf = windowConfigs[this.id] = {
            vibrnacyConfig: config,
            vibrancyActivated: false
        }

        if (isWindows10() && config && config.useCustomWindowRefreshMethod) {}

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

        if (isWindows10() && options.hasOwnProperty('vibrancy')) win.once('ready-to-show', () => {
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