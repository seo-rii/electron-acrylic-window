import * as electron from 'electron'
import { VibrancyOptions } from 'electron-acrylic-window';
import debug from './debug';
import { isRS4OrGreater, isWindows10 } from './os';
import { getConfigFromOptions, rgbToHex, Vibrancy, VibrancyConfig, WindowConfig, windowConfigs, _setVibrancy } from './vibrancy';

/**
 * Allow modifying default BrowserWindowConstructorOptions
 * to change vibrancy to VibrancyOptions.
 */
type Modify<T, R> = Omit<T, keyof R> & R;

/**
 * The new options of the BrowserWindow with the VibrancyOptions.
 */
export type AcrylicBrowserWindowConstructorOptions = Modify<electron.BrowserWindowConstructorOptions, {

    /**
     * The vibrancy settings for the window. Can be
     * a VibrancyTheme or the VibrancyOptions object.
     */
    vibrancy?: Vibrancy
}>;

export class BrowserWindow extends electron.BrowserWindow {
    // https://github.com/microsoft/TypeScript/issues/30071
    // @ts-ignore
    setVibrancy(options?: Vibrancy) {
        if (options) {
            if (windowConfigs[this.id]) {
                windowConfigs[this.id].vibrnacyConfig = getConfigFromOptions(options);
            } else {
                windowConfigs[this.id] = {
                    vibrancyActivated: false,
                    vibrnacyConfig: getConfigFromOptions(options)
                }
            }
            
            _setVibrancy(this, windowConfigs[this.id].vibrnacyConfig);
        } else {
            // If disabling vibrancy, turn off then save
            _setVibrancy(this)

            if (windowConfigs[this.id]) {
                windowConfigs[this.id].vibrnacyConfig = getConfigFromOptions(undefined);
            } else {
                windowConfigs[this.id] = {
                    vibrancyActivated: false,
                    vibrnacyConfig: getConfigFromOptions(undefined)
                }
            }
        }
    }

    constructor(options?: AcrylicBrowserWindowConstructorOptions) {
        super(Object.assign(options, { vibrancy: undefined }))

        let oShow = options?.show ?? true;

        let config = getConfigFromOptions(options?.vibrancy);

        if (isWindows10 && config) {
            if (config.colors.base)
                this.setBackgroundColor(rgbToHex(config.colors.base))
            this.hide()
        }

        const id = this.id
        const winConf: WindowConfig = new class {
            private _vibrnacyConfig = config
            public get vibrnacyConfig(): VibrancyConfig {
                return this._vibrnacyConfig;
            }
            public set vibrnacyConfig(v: VibrancyConfig) {
                this._vibrnacyConfig = windowConfigs[id].vibrnacyConfig = v;
            }


            private _vibrancyActivated = false
            public get vibrancyActivated(): boolean {
                return this._vibrancyActivated;
            }
            public set vibrancyActivated(v: boolean) {
                this._vibrancyActivated = windowConfigs[id].vibrancyActivated = v;
            }

            constructor() {
                windowConfigs[id] = {
                    vibrancyActivated: this.vibrancyActivated,
                    vibrnacyConfig: this.vibrnacyConfig
                }
            }
        }

        if (isWindows10 && config && config.useCustomWindowRefreshMethod) { }

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
    static _bindAndReplace(object, method) {
        const boundFunction = method.bind(object);
        Object.defineProperty(object, method.name, {
            get: () => boundFunction
        });
    }
}