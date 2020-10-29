import * as electron from 'electron'
import {_setVibrancy, getConfigFromOptions, rgbToHex, Vibrancy, VibrancyConfig} from './vibrancy';
import {isWindows10} from './os';
import win10refresh from './win10refresh'

/**
 * Allow modifying default BrowserWindowConstructorOptions
 * to change vibrancy to VibrancyOptions.
 */
type Modify<T, R> = Omit<T, keyof R> & R;

type _AcrylicBrowserWindowConstructorOptions = Modify<electron.BrowserWindowConstructorOptions, {
	/**
	 * The vibrancy settings for the window. Can be
	 * a VibrancyTheme or the VibrancyOptions object.
	 */
	vibrancy?: Vibrancy
}>;

/**
 * The options of the BrowserWindow constructor including the vibrancy options.
 */
// The intelisense of type _AcrylicBrowserWindowConstructorOptions is shown as the raw type, instead of the actual type name.
// tslint:disable-next-line
export interface AcrylicBrowserWindowConstructorOptions extends _AcrylicBrowserWindowConstructorOptions {
}

export interface WindowConfig {
	vibrancyActivated: boolean
	vibrnacyConfig: VibrancyConfig

	/**
	 * Property designed to control the transparency of the focus.
	 * TargetOpacity is the opacity that Windows should have.
	 */
	targetOpacity: number

	/**
	 * user-set opacity
	 */
	opacity: number

	/**
	 * Property designed to control the transparency of the focus.
	 * The id of the interval for smooth transition of currentOpacity to targetOpacity when focus changes.
	 * The reason for saving this is to call clearInterval after the conversion is complete.
	 */
	opacityInterval: NodeJS.Timeout | undefined

	/**
	 * Property designed to control the transparency of the focus.
	 * CurrentOpacity is the transparency value that Windows actually has currently.
	 */
	currentOpacity: number

	/**
	 * Property designed to control the movement of the window
	 * The id of the interval for tracking window movement
	 * The reason for saving this is to call clearInterval after the conversion is complete.
	 */
	moveTimeout: NodeJS.Timeout | undefined
}

/**
 * Class wrapper for `electron.BrowserWindow`.
 * The class handles the vibrancy effects.
 */
export class BrowserWindow extends electron.BrowserWindow {
	/**
	 * Set the vibrancy for the specified window.
	 *
	 * @param options
	 */
	// https://github.com/microsoft/TypeScript/issues/30071
	// @ts-ignore
	setVibrancy(options?: Vibrancy) {
		if (options) {
			this.#winconfig.vibrnacyConfig = getConfigFromOptions(options);
			_setVibrancy(this, this.#winconfig.vibrnacyConfig);
		} else {
			// If disabling vibrancy, turn off then save
			_setVibrancy(this)
			this.#winconfig.vibrnacyConfig = getConfigFromOptions(undefined);
		}
	}

	#vibconfig = getConfigFromOptions(this.options?.vibrancy)

	#winconfig: WindowConfig = {
		targetOpacity: 0,
		vibrancyActivated: false,
		vibrnacyConfig: this.#vibconfig,
		opacity: 0,
		currentOpacity: 0,
		opacityInterval: undefined,
		moveTimeout: undefined
	}

	get __electron_acrylic_window__(): WindowConfig {
		return this.#winconfig;
	}

	set __electron_acrylic_window__(v: WindowConfig) {
		this.#winconfig = v;
	}

	constructor(private options?: AcrylicBrowserWindowConstructorOptions) {
		super(Object.assign(options, {vibrancy: undefined}))

		void this.__electron_acrylic_window__

		let config = getConfigFromOptions(options?.vibrancy);

		if (isWindows10 && options && options.vibrancy !== undefined)
			options.vibrancy = undefined

		if (isWindows10 && config) {
			if (config.colors.base)
				this.setBackgroundColor(rgbToHex(config.colors.base))
		}

		if (isWindows10 && config && config.useCustomWindowRefreshMethod) win10refresh(this, config.maximumRefreshRate)

		if (config && config.disableOnBlur) {
			this.#winconfig.opacity = 0

			this.on('blur', () => {
				if (isWindows10 && this.#winconfig) {
					this.#winconfig.targetOpacity = 255
					if (!this.#winconfig.opacityInterval)
						this.#winconfig.opacityInterval = setInterval(() => {
							try {
								let colorDiff = (255 - this.#winconfig.vibrnacyConfig.colors.a) / 3.5
								if (Math.abs(this.#winconfig.currentOpacity - this.#winconfig.targetOpacity) < colorDiff) {
									this.#winconfig.currentOpacity = this.#winconfig.targetOpacity
									if (this.#winconfig.opacityInterval)
										clearInterval(this.#winconfig.opacityInterval)
									this.#winconfig.opacityInterval = undefined
								} else if (this.#winconfig.currentOpacity > this.#winconfig.targetOpacity) this.#winconfig.currentOpacity -= colorDiff
								else this.#winconfig.currentOpacity += colorDiff
								this.#winconfig.vibrnacyConfig.currentOpacity = this.#winconfig.currentOpacity
								_setVibrancy(this, this.#winconfig.vibrnacyConfig)
							} catch (e) {

							}
						}, 1000 / 30)
				}
			})

			this.on('focus', () => {
				if (isWindows10 && this.#winconfig) {
					this.#winconfig.targetOpacity = this.#winconfig.vibrnacyConfig.colors.a
					if (!this.#winconfig.opacityInterval)
						this.#winconfig.opacityInterval = setInterval(() => {
							try {
								let colorDiff = (255 - this.#winconfig.vibrnacyConfig.colors.a) / 3.5
								if (Math.abs(this.#winconfig.currentOpacity - this.#winconfig.targetOpacity) < colorDiff) {
									this.#winconfig.currentOpacity = this.#winconfig.targetOpacity
									if (this.#winconfig.opacityInterval)
										clearInterval(this.#winconfig.opacityInterval)
									this.#winconfig.opacityInterval = undefined
								} else if (this.#winconfig.currentOpacity > this.#winconfig.targetOpacity) this.#winconfig.currentOpacity -= colorDiff
								else this.#winconfig.currentOpacity += colorDiff
								this.#winconfig.vibrnacyConfig.currentOpacity = this.#winconfig.currentOpacity
								_setVibrancy(this, this.#winconfig.vibrnacyConfig)
							} catch (e) {

							}
						}, 1000 / 30)
				}
			})

			this.webContents.on('devtools-closed', () => {
				_setVibrancy(this)
				setTimeout(() => {
					_setVibrancy(this, this.#winconfig.vibrnacyConfig)
				}, 100)
			})
		}
	}
}
