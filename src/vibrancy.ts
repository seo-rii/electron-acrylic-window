import bindings from './bindings'
import { BrowserWindow } from './browserWindow'
import debug from './debug'
import { isRS4OrGreater, isWindows10 } from './os'
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

export interface RGBA extends RGB {
	a: number
}

export interface RGB {
	r: number
	g: number
	b: number
}

export interface VibrancyConfig {
	colors: RGBA & { base?: RGBA }
	effect: 0 | 1;
	useCustomWindowRefreshMethod?: boolean;
	maximumRefreshRate?: number;
	disableOnBlur?: boolean;
	currentOpacity: number
}

export function hexTo255(hex: string) {
	const result = /^#?([a-f\d]{2})$/i.exec(hex);
	return result ? parseInt(result[1], 16) : undefined;
}

export function _8bitToHex(c: number) {
	var hex = c.toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}

export function rgbToHex(rgb: RGB | RGBA) {
	return "#" + _8bitToHex(rgb.r) + _8bitToHex(rgb.g) + _8bitToHex(rgb.b);
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
			const r = hexTo255(theme.hex.slice(0, 2));
			const g = hexTo255(theme.hex.slice(2, 4));
			const b = hexTo255(theme.hex.slice(4, 6));
			const a = hexTo255(theme.hex.slice(6, 8));

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

/**
 * The theme to apply to the vibrancy. Can be 'light',
 * 'dark', 'appearance-based' or a custom HEX color
 * with alpha.
 */
export type VibrancyTheme = 'light' | 'dark' | 'appearance-based' | { hex: string } | { rgba: [number, number, number, number] };

/**
 * The effect to apply. Can be 'acrylic' or 'blur'.
 */
export type VibrancyEffect = 'acrylic' | 'blur';

/**
 * The vibrancy object
 */
export interface VibrancyOptions {
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
}

export type Vibrancy = VibrancyTheme | VibrancyOptions

export function getConfigFromOptions(vibrancyOptions: Vibrancy | undefined): VibrancyConfig {
	const defaultSettings: VibrancyOptions = {
		theme: undefined,
		effect: 'acrylic',
		useCustomWindowRefreshMethod: true,
		maximumRefreshRate: 60,
		disableOnBlur: true
	}

	const options = Object.assign(defaultSettings, typeof vibrancyOptions === "object" ? vibrancyOptions : { theme: vibrancyOptions })

	// Merge provided settings into defaults
	let config: VibrancyConfig = {
		disableOnBlur: options.disableOnBlur,
		effect: 0,
		maximumRefreshRate: options.maximumRefreshRate,
		useCustomWindowRefreshMethod: options.useCustomWindowRefreshMethod,
		colors: getColorsFromTheme(options.theme),
		currentOpacity: 0
	}

	// Set blur type
	if (options.effect === 'acrylic' && isRS4OrGreater)
		config.effect = 1;

	// Debug output
	if (debug)
		console.log(config)

	return config;
}

export function _setVibrancy(win: BrowserWindow, config?: VibrancyConfig) {
	if (config && config.colors) {
		if (debug) console.log("Vibrancy On", config)
		bindings.setVibrancy(getHwnd(win), config.effect, config.colors.r, config.colors.g, config.colors.b, win.__electron_acrylic_window__.vibrnacyConfig.currentOpacity);
		win.__electron_acrylic_window__.vibrancyActivated = true;
		setTimeout(() => {
			try {
				if (win.__electron_acrylic_window__.vibrancyActivated) win.setBackgroundColor('#00000000');
			} catch (e) {

			}
		}, 50);
	} else {
		if (debug) console.log("Vibrancy Off", config, win.__electron_acrylic_window__.vibrnacyConfig)
		win.__electron_acrylic_window__.vibrancyActivated = false;
		if (win.__electron_acrylic_window__.vibrnacyConfig) {
			win.setBackgroundColor((win.__electron_acrylic_window__.vibrnacyConfig && win.__electron_acrylic_window__.vibrnacyConfig.colors ? "#FE" + win.__electron_acrylic_window__.vibrnacyConfig.colors.r + win.__electron_acrylic_window__.vibrnacyConfig.colors.g + win.__electron_acrylic_window__.vibrnacyConfig.colors.b : "#000000"));
		}
		setTimeout(() => {
			try {
				if (!win.__electron_acrylic_window__.vibrancyActivated) bindings.disableVibrancy(getHwnd(win));
			} catch (e) {

			}
		}, 10);
	}
}

/**
 * Set the vibrancy for the specified window.
 *
 * @param options
 */
export function setVibrancy(win: BrowserWindow, vibrancy: Vibrancy = 'appearance-based') {
	if (vibrancy) {
		win.__electron_acrylic_window__.vibrnacyConfig = getConfigFromOptions(vibrancy);

		_setVibrancy(win, win.__electron_acrylic_window__.vibrnacyConfig)
	} else {
		// If disabling vibrancy, turn off then save
		_setVibrancy(win)

		win.__electron_acrylic_window__.vibrnacyConfig = getConfigFromOptions(undefined);
	}
}