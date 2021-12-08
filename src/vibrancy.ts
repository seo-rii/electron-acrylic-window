import bindings from './bindings'
import { BrowserWindow, WindowConfig } from './browserWindow'
import debug from './debug'
import { isRS4OrGreater } from './os'
import * as electron from 'electron'

function getHwnd(win: BrowserWindow) {
	if (!win) throw new TypeError('WINDOW_NOT_GIVEN')
	try {
		return win.getNativeWindowHandle().readInt32LE(0)
	} catch (e) {
		throw new TypeError('NOT_VALID_WINDOW')
	}
}

const supportedType = ['light', 'dark', 'appearance-based']

const _lightThemeColor: [221, 221, 221, 136] = [221, 221, 221, 136]
const _darkThemeColor: [34, 34, 34, 136] = [34, 34, 34, 136]

/**
 * Red, green, blue and alpha
 */
export interface RGBA extends RGB {
	a: number
}

/**
 * Red, green and blue
 */
export interface RGB {
	r: number
	g: number
	b: number
}

export interface VibrancyConfig {
	colors: RGBA & { base?: RGBA }
	effect: 0 | 1
	useCustomWindowRefreshMethod?: boolean
	maximumRefreshRate?: number
	disableOnBlur?: boolean
	currentOpacity: number
}

export function hexTo255(hex: string) {
	const result = /^#?([a-f\d]{2})$/i.exec(hex)
	return result ? parseInt(result[1], 16) : undefined
}

export function _8bitToHex(c: number) {
	var hex = c.toString(16)
	return hex.length == 1 ? '0' + hex : hex
}

export function rgbToHex(rgb: RGB | RGBA) {
	return '#' + _8bitToHex(rgb.r) + _8bitToHex(rgb.g) + _8bitToHex(rgb.b)
}

function getColorsFromTheme(
	theme: VibrancyOptions['theme']
): VibrancyConfig['colors'] {
	const dark = {
		r: _darkThemeColor[0],
		g: _darkThemeColor[1],
		b: _darkThemeColor[2],
		a: _darkThemeColor[3],
	}

	const light = {
		r: _lightThemeColor[0],
		g: _lightThemeColor[1],
		b: _lightThemeColor[2],
		a: _lightThemeColor[3],
	}

	if (theme === 'light') return light

	if (theme === 'dark') return dark

	if (typeof theme === 'string') {
		const r = hexTo255(theme.slice(1, 3))
		const g = hexTo255(theme.slice(3, 5))
		const b = hexTo255(theme.slice(5, 7))
		const a = hexTo255(theme.slice(7, 9))

		if (
			r === undefined ||
			g === undefined ||
			b === undefined ||
			a === undefined
		)
			return light

		return { r: r, g: g, b: b, a: a }
	}

	if (electron.nativeTheme.shouldUseDarkColors) return dark
	else return light
}

/**
 * The theme to apply to the vibrancy. Can be 'light',
 * 'dark', 'appearance-based' or a custom HEX color
 * with alpha.
 */
export type VibrancyTheme = 'light' | 'dark' | 'appearance-based' | string

/**
 * The effect to apply. Can be 'acrylic' or 'blur'.
 */
export type VibrancyEffect = 'acrylic' | 'blur'

/**
 * Options to apply to the vibrancy
 */
export interface VibrancyOptions {
	/**
	 * The theme to use.
	 */
	theme?: VibrancyTheme

	/**
	 * The effect to use.
	 */
	effect?: VibrancyEffect

	/**
	 * If enabled, we use a custom window resize/move
	 * handler for performance.
	 */
	useCustomWindowRefreshMethod?: boolean

	/**
	 * Maximum value to refresh application screen
	 * in seconds.
	 */
	maximumRefreshRate?: number

	/**
	 * If true, acrylic effect will be disabled whe
	 * window lost focus.
	 */
	disableOnBlur?: boolean
	/**
	 * If true, log will be printed to console.
	 */
	debug?: boolean
}

export type Vibrancy = VibrancyTheme | VibrancyOptions

export function getConfigFromOptions(
	vibrancyOptions: Vibrancy | undefined
): VibrancyConfig {
	const defaultSettings: VibrancyOptions = {
		theme: undefined,
		effect: 'acrylic',
		useCustomWindowRefreshMethod: true,
		maximumRefreshRate: 60,
		disableOnBlur: true,
	}

	const options = Object.assign(
		defaultSettings,
		typeof vibrancyOptions === 'object'
			? vibrancyOptions
			: { theme: vibrancyOptions }
	)

	// Merge provided settings into defaults
	let config: VibrancyConfig = {
		disableOnBlur: options.disableOnBlur,
		effect: 0,
		maximumRefreshRate: options.maximumRefreshRate,
		useCustomWindowRefreshMethod: options.useCustomWindowRefreshMethod,
		colors: getColorsFromTheme(options.theme),
		currentOpacity: 0,
	}

	// Set blur type
	if (options.effect === 'acrylic' && isRS4OrGreater) config.effect = 1

	return config
}

export function _setVibrancy(win: BrowserWindow, config?: VibrancyConfig) {
	if (config && config.colors) {
		debug('Vibrancy On', config)
		bindings().setVibrancy(
			getHwnd(win),
			config.effect,
			config.colors.r,
			config.colors.g,
			config.colors.b,
			win.__electron_acrylic_window__.vibrnacyConfig.currentOpacity
		)
		win.__electron_acrylic_window__.vibrancyActivated = true
		setTimeout(() => {
			try {
				if (win.__electron_acrylic_window__.vibrancyActivated)
					win.setBackgroundColor('#00000000')
			} catch (e) {}
		}, 50)
	} else {
		debug(
			'Vibrancy Off',
			config,
			win.__electron_acrylic_window__.vibrnacyConfig
		)
		win.__electron_acrylic_window__.vibrancyActivated = false
		if (win.__electron_acrylic_window__.vibrnacyConfig) {
			win.setBackgroundColor(
				win.__electron_acrylic_window__.vibrnacyConfig &&
					win.__electron_acrylic_window__.vibrnacyConfig.colors
					? '#FE' +
							win.__electron_acrylic_window__.vibrnacyConfig
								.colors.r +
							win.__electron_acrylic_window__.vibrnacyConfig
								.colors.g +
							win.__electron_acrylic_window__.vibrnacyConfig
								.colors.b
					: '#000000'
			)
		}
		setTimeout(() => {
			try {
				if (!win.__electron_acrylic_window__.vibrancyActivated)
					bindings().disableVibrancy(getHwnd(win))
			} catch (e) {}
		}, 10)
	}
}

/**
 * Set the vibrancy for the specified window.
 *
 * @param options
 */
export function setVibrancy(
	win: BrowserWindow,
	vibrancy: Vibrancy = 'appearance-based'
) {
	// only .vibrnacyConfig is used
	win.__electron_acrylic_window__ =
		win.__electron_acrylic_window__ || ({} as WindowConfig)

	if (vibrancy) {
		win.__electron_acrylic_window__.vibrnacyConfig =
			getConfigFromOptions(vibrancy)

		_setVibrancy(win, win.__electron_acrylic_window__.vibrnacyConfig)
	} else {
		// If disabling vibrancy, turn off then save
		_setVibrancy(win)

		win.__electron_acrylic_window__.vibrnacyConfig =
			getConfigFromOptions(undefined)
	}
}
