'use strict'
var __createBinding =
	(this && this.__createBinding) ||
	(Object.create
		? function (o, m, k, k2) {
				if (k2 === undefined) k2 = k
				Object.defineProperty(o, k2, {
					enumerable: true,
					get: function () {
						return m[k]
					},
				})
		  }
		: function (o, m, k, k2) {
				if (k2 === undefined) k2 = k
				o[k2] = m[k]
		  })
var __setModuleDefault =
	(this && this.__setModuleDefault) ||
	(Object.create
		? function (o, v) {
				Object.defineProperty(o, 'default', {
					enumerable: true,
					value: v,
				})
		  }
		: function (o, v) {
				o['default'] = v
		  })
var __importStar =
	(this && this.__importStar) ||
	function (mod) {
		if (mod && mod.__esModule) return mod
		var result = {}
		if (mod != null)
			for (var k in mod)
				if (
					k !== 'default' &&
					Object.prototype.hasOwnProperty.call(mod, k)
				)
					__createBinding(result, mod, k)
		__setModuleDefault(result, mod)
		return result
	}
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod }
	}
Object.defineProperty(exports, '__esModule', { value: true })
exports.setVibrancy = exports._setVibrancy = exports.getConfigFromOptions = exports.rgbToHex = exports._8bitToHex = exports.hexTo255 = void 0
const bindings_1 = __importDefault(require('./bindings'))
const debug_1 = __importDefault(require('./debug'))
const os_1 = require('./os')
const electron = __importStar(require('electron'))
function getHwnd(win) {
	if (!win) throw new TypeError('WINDOW_NOT_GIVEN')
	try {
		return win.getNativeWindowHandle().readInt32LE(0)
	} catch (e) {
		throw new TypeError('NOT_VALID_WINDOW')
	}
}
const supportedType = ['light', 'dark', 'appearance-based']
const _lightThemeColor = [221, 221, 221, 136]
const _darkThemeColor = [34, 34, 34, 136]
function hexTo255(hex) {
	const result = /^#?([a-f\d]{2})$/i.exec(hex)
	return result ? parseInt(result[1], 16) : undefined
}
exports.hexTo255 = hexTo255
function _8bitToHex(c) {
	var hex = c.toString(16)
	return hex.length == 1 ? '0' + hex : hex
}
exports._8bitToHex = _8bitToHex
function rgbToHex(rgb) {
	return '#' + _8bitToHex(rgb.r) + _8bitToHex(rgb.g) + _8bitToHex(rgb.b)
}
exports.rgbToHex = rgbToHex
function getColorsFromTheme(theme) {
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
function getConfigFromOptions(vibrancyOptions) {
	const defaultSettings = {
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
	let config = {
		disableOnBlur: options.disableOnBlur,
		effect: 0,
		maximumRefreshRate: options.maximumRefreshRate,
		useCustomWindowRefreshMethod: options.useCustomWindowRefreshMethod,
		colors: getColorsFromTheme(options.theme),
		currentOpacity: 0,
	}
	// Set blur type
	if (options.effect === 'acrylic' && os_1.isRS4OrGreater) config.effect = 1
	return config
}
exports.getConfigFromOptions = getConfigFromOptions
function _setVibrancy(win, config) {
	if (config && config.colors) {
		debug_1.default('Vibrancy On', config)
		bindings_1.default.setVibrancy(
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
		debug_1.default(
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
					bindings_1.default.disableVibrancy(getHwnd(win))
			} catch (e) {}
		}, 10)
	}
}
exports._setVibrancy = _setVibrancy
/**
 * Set the vibrancy for the specified window.
 *
 * @param options
 */
function setVibrancy(win, vibrancy = 'appearance-based') {
	// only .vibrnacyConfig is used
	win.__electron_acrylic_window__ = win.__electron_acrylic_window__ || {}
	if (vibrancy) {
		win.__electron_acrylic_window__.vibrnacyConfig = getConfigFromOptions(
			vibrancy
		)
		_setVibrancy(win, win.__electron_acrylic_window__.vibrnacyConfig)
	} else {
		// If disabling vibrancy, turn off then save
		_setVibrancy(win)
		win.__electron_acrylic_window__.vibrnacyConfig = getConfigFromOptions(
			undefined
		)
	}
}
exports.setVibrancy = setVibrancy
//# sourceMappingURL=vibrancy.js.map
