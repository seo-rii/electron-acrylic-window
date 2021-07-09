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
var __classPrivateFieldGet =
	(this && this.__classPrivateFieldGet) ||
	function (receiver, state, kind, f) {
		if (kind === 'a' && !f)
			throw new TypeError('Private accessor was defined without a getter')
		if (
			typeof state === 'function'
				? receiver !== state || !f
				: !state.has(receiver)
		)
			throw new TypeError(
				'Cannot read private member from an object whose class did not declare it'
			)
		return kind === 'm'
			? f
			: kind === 'a'
			? f.call(receiver)
			: f
			? f.value
			: state.get(receiver)
	}
var __classPrivateFieldSet =
	(this && this.__classPrivateFieldSet) ||
	function (receiver, state, value, kind, f) {
		if (kind === 'm') throw new TypeError('Private method is not writable')
		if (kind === 'a' && !f)
			throw new TypeError('Private accessor was defined without a setter')
		if (
			typeof state === 'function'
				? receiver !== state || !f
				: !state.has(receiver)
		)
			throw new TypeError(
				'Cannot write private member to an object whose class did not declare it'
			)
		return (
			kind === 'a'
				? f.call(receiver, value)
				: f
				? (f.value = value)
				: state.set(receiver, value),
			value
		)
	}
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod }
	}
var _BrowserWindow_vibconfig, _BrowserWindow_winconfig
Object.defineProperty(exports, '__esModule', { value: true })
exports.BrowserWindow = void 0
const electron = __importStar(require('electron'))
const vibrancy_1 = require('./vibrancy')
const os_1 = require('./os')
const win10refresh_1 = __importDefault(require('./win10refresh'))
const debug_1 = require('./debug')
/**
 * Class wrapper for `electron.BrowserWindow`.
 * The class handles the vibrancy effects.
 */
class BrowserWindow extends electron.BrowserWindow {
	constructor(options) {
		var _a, _b
		super(
			Object.assign(Object.assign({}, options), {
				vibrancy: undefined,
				show: false,
			})
		)
		this.options = options
		_BrowserWindow_vibconfig.set(
			this,
			vibrancy_1.getConfigFromOptions(
				(_a = this.options) === null || _a === void 0
					? void 0
					: _a.vibrancy
			)
		)
		_BrowserWindow_winconfig.set(this, {
			targetOpacity: 0,
			vibrancyActivated: false,
			vibrnacyConfig: __classPrivateFieldGet(
				this,
				_BrowserWindow_vibconfig,
				'f'
			),
			opacity: 0,
			currentOpacity: 0,
			opacityInterval: undefined,
			moveTimeout: undefined,
			debug: false,
		})
		void this.__electron_acrylic_window__
		let config = vibrancy_1.getConfigFromOptions(
			options === null || options === void 0 ? void 0 : options.vibrancy
		)
		let opShowOriginal =
			(_b =
				options === null || options === void 0
					? void 0
					: options.show) !== null && _b !== void 0
				? _b
				: true
		if (os_1.isWindows10 && config) {
			if (config.colors.base)
				this.setBackgroundColor(vibrancy_1.rgbToHex(config.colors.base))
			__classPrivateFieldGet(
				this,
				_BrowserWindow_winconfig,
				'f'
			).opacity = __classPrivateFieldGet(
				this,
				_BrowserWindow_winconfig,
				'f'
			).vibrnacyConfig.colors.a
			__classPrivateFieldGet(
				this,
				_BrowserWindow_winconfig,
				'f'
			).targetOpacity = __classPrivateFieldGet(
				this,
				_BrowserWindow_winconfig,
				'f'
			).vibrnacyConfig.colors.a
			__classPrivateFieldGet(
				this,
				_BrowserWindow_winconfig,
				'f'
			).currentOpacity = __classPrivateFieldGet(
				this,
				_BrowserWindow_winconfig,
				'f'
			).vibrnacyConfig.colors.a
			__classPrivateFieldGet(
				this,
				_BrowserWindow_winconfig,
				'f'
			).vibrnacyConfig.currentOpacity = __classPrivateFieldGet(
				this,
				_BrowserWindow_winconfig,
				'f'
			).vibrnacyConfig.colors.a
			this.webContents.on('devtools-closed', () => {
				vibrancy_1._setVibrancy(this)
				setTimeout(() => {
					vibrancy_1._setVibrancy(
						this,
						__classPrivateFieldGet(
							this,
							_BrowserWindow_winconfig,
							'f'
						).vibrnacyConfig
					)
				}, 100)
			})
			this.once('ready-to-show', () => {
				setTimeout(() => {
					if (opShowOriginal) this.show()
					vibrancy_1._setVibrancy(
						this,
						__classPrivateFieldGet(
							this,
							_BrowserWindow_winconfig,
							'f'
						).vibrnacyConfig
					)
				}, 100)
			})
			if (
				__classPrivateFieldGet(this, _BrowserWindow_winconfig, 'f')
					.debug
			)
				debug_1.toggleDebugging(
					__classPrivateFieldGet(this, _BrowserWindow_winconfig, 'f')
						.debug
				)
			if (config.useCustomWindowRefreshMethod)
				win10refresh_1.default(this, config.maximumRefreshRate || 60)
			if (config.disableOnBlur) {
				__classPrivateFieldGet(
					this,
					_BrowserWindow_winconfig,
					'f'
				).opacity = 0
				this.on('blur', () => {
					if (
						os_1.isWindows10 &&
						__classPrivateFieldGet(
							this,
							_BrowserWindow_winconfig,
							'f'
						)
					) {
						__classPrivateFieldGet(
							this,
							_BrowserWindow_winconfig,
							'f'
						).targetOpacity = 255
						if (
							!__classPrivateFieldGet(
								this,
								_BrowserWindow_winconfig,
								'f'
							).opacityInterval
						)
							__classPrivateFieldGet(
								this,
								_BrowserWindow_winconfig,
								'f'
							).opacityInterval = setInterval(() => {
								try {
									let colorDiff =
										(255 -
											__classPrivateFieldGet(
												this,
												_BrowserWindow_winconfig,
												'f'
											).vibrnacyConfig.colors.a) /
										3.5
									if (
										Math.abs(
											__classPrivateFieldGet(
												this,
												_BrowserWindow_winconfig,
												'f'
											).currentOpacity -
												__classPrivateFieldGet(
													this,
													_BrowserWindow_winconfig,
													'f'
												).targetOpacity
										) < colorDiff
									) {
										__classPrivateFieldGet(
											this,
											_BrowserWindow_winconfig,
											'f'
										).currentOpacity = __classPrivateFieldGet(
											this,
											_BrowserWindow_winconfig,
											'f'
										).targetOpacity
										if (
											__classPrivateFieldGet(
												this,
												_BrowserWindow_winconfig,
												'f'
											).opacityInterval
										)
											clearInterval(
												__classPrivateFieldGet(
													this,
													_BrowserWindow_winconfig,
													'f'
												).opacityInterval
											)
										__classPrivateFieldGet(
											this,
											_BrowserWindow_winconfig,
											'f'
										).opacityInterval = undefined
									} else if (
										__classPrivateFieldGet(
											this,
											_BrowserWindow_winconfig,
											'f'
										).currentOpacity >
										__classPrivateFieldGet(
											this,
											_BrowserWindow_winconfig,
											'f'
										).targetOpacity
									)
										__classPrivateFieldGet(
											this,
											_BrowserWindow_winconfig,
											'f'
										).currentOpacity -= colorDiff
									else
										__classPrivateFieldGet(
											this,
											_BrowserWindow_winconfig,
											'f'
										).currentOpacity += colorDiff
									__classPrivateFieldGet(
										this,
										_BrowserWindow_winconfig,
										'f'
									).vibrnacyConfig.currentOpacity = __classPrivateFieldGet(
										this,
										_BrowserWindow_winconfig,
										'f'
									).currentOpacity
									vibrancy_1._setVibrancy(
										this,
										__classPrivateFieldGet(
											this,
											_BrowserWindow_winconfig,
											'f'
										).vibrnacyConfig
									)
								} catch (e) {}
							}, 1000 / 30)
					}
				})
				this.on('focus', () => {
					if (
						os_1.isWindows10 &&
						__classPrivateFieldGet(
							this,
							_BrowserWindow_winconfig,
							'f'
						)
					) {
						__classPrivateFieldGet(
							this,
							_BrowserWindow_winconfig,
							'f'
						).targetOpacity = __classPrivateFieldGet(
							this,
							_BrowserWindow_winconfig,
							'f'
						).vibrnacyConfig.colors.a
						if (
							!__classPrivateFieldGet(
								this,
								_BrowserWindow_winconfig,
								'f'
							).opacityInterval
						)
							__classPrivateFieldGet(
								this,
								_BrowserWindow_winconfig,
								'f'
							).opacityInterval = setInterval(() => {
								try {
									let colorDiff =
										(255 -
											__classPrivateFieldGet(
												this,
												_BrowserWindow_winconfig,
												'f'
											).vibrnacyConfig.colors.a) /
										3.5
									if (
										Math.abs(
											__classPrivateFieldGet(
												this,
												_BrowserWindow_winconfig,
												'f'
											).currentOpacity -
												__classPrivateFieldGet(
													this,
													_BrowserWindow_winconfig,
													'f'
												).targetOpacity
										) < colorDiff
									) {
										__classPrivateFieldGet(
											this,
											_BrowserWindow_winconfig,
											'f'
										).currentOpacity = __classPrivateFieldGet(
											this,
											_BrowserWindow_winconfig,
											'f'
										).targetOpacity
										if (
											__classPrivateFieldGet(
												this,
												_BrowserWindow_winconfig,
												'f'
											).opacityInterval
										)
											clearInterval(
												__classPrivateFieldGet(
													this,
													_BrowserWindow_winconfig,
													'f'
												).opacityInterval
											)
										__classPrivateFieldGet(
											this,
											_BrowserWindow_winconfig,
											'f'
										).opacityInterval = undefined
									} else if (
										__classPrivateFieldGet(
											this,
											_BrowserWindow_winconfig,
											'f'
										).currentOpacity >
										__classPrivateFieldGet(
											this,
											_BrowserWindow_winconfig,
											'f'
										).targetOpacity
									)
										__classPrivateFieldGet(
											this,
											_BrowserWindow_winconfig,
											'f'
										).currentOpacity -= colorDiff
									else
										__classPrivateFieldGet(
											this,
											_BrowserWindow_winconfig,
											'f'
										).currentOpacity += colorDiff
									__classPrivateFieldGet(
										this,
										_BrowserWindow_winconfig,
										'f'
									).vibrnacyConfig.currentOpacity = __classPrivateFieldGet(
										this,
										_BrowserWindow_winconfig,
										'f'
									).currentOpacity
									vibrancy_1._setVibrancy(
										this,
										__classPrivateFieldGet(
											this,
											_BrowserWindow_winconfig,
											'f'
										).vibrnacyConfig
									)
								} catch (e) {}
							}, 1000 / 30)
					}
				})
			}
		}
	}
	get __electron_acrylic_window__() {
		return __classPrivateFieldGet(this, _BrowserWindow_winconfig, 'f')
	}
	set __electron_acrylic_window__(v) {
		__classPrivateFieldSet(this, _BrowserWindow_winconfig, v, 'f')
	}
	/**
	 * Set the vibrancy for the specified window.
	 *
	 * @param options
	 */
	// https://github.com/microsoft/TypeScript/issues/30071
	// @ts-ignore
	setVibrancy(options) {
		if (options) {
			__classPrivateFieldGet(
				this,
				_BrowserWindow_winconfig,
				'f'
			).vibrnacyConfig = vibrancy_1.getConfigFromOptions(options)
			__classPrivateFieldGet(
				this,
				_BrowserWindow_winconfig,
				'f'
			).opacity = __classPrivateFieldGet(
				this,
				_BrowserWindow_winconfig,
				'f'
			).vibrnacyConfig.colors.a
			__classPrivateFieldGet(
				this,
				_BrowserWindow_winconfig,
				'f'
			).targetOpacity = __classPrivateFieldGet(
				this,
				_BrowserWindow_winconfig,
				'f'
			).vibrnacyConfig.colors.a
			__classPrivateFieldGet(
				this,
				_BrowserWindow_winconfig,
				'f'
			).currentOpacity = __classPrivateFieldGet(
				this,
				_BrowserWindow_winconfig,
				'f'
			).vibrnacyConfig.colors.a
			__classPrivateFieldGet(
				this,
				_BrowserWindow_winconfig,
				'f'
			).vibrnacyConfig.currentOpacity = __classPrivateFieldGet(
				this,
				_BrowserWindow_winconfig,
				'f'
			).vibrnacyConfig.colors.a
			vibrancy_1._setVibrancy(
				this,
				__classPrivateFieldGet(this, _BrowserWindow_winconfig, 'f')
					.vibrnacyConfig
			)
		} else {
			// If disabling vibrancy, turn off then save
			vibrancy_1._setVibrancy(this)
			__classPrivateFieldGet(
				this,
				_BrowserWindow_winconfig,
				'f'
			).vibrnacyConfig = vibrancy_1.getConfigFromOptions(undefined)
			__classPrivateFieldGet(
				this,
				_BrowserWindow_winconfig,
				'f'
			).opacity = __classPrivateFieldGet(
				this,
				_BrowserWindow_winconfig,
				'f'
			).vibrnacyConfig.colors.a
			__classPrivateFieldGet(
				this,
				_BrowserWindow_winconfig,
				'f'
			).targetOpacity = __classPrivateFieldGet(
				this,
				_BrowserWindow_winconfig,
				'f'
			).vibrnacyConfig.colors.a
			__classPrivateFieldGet(
				this,
				_BrowserWindow_winconfig,
				'f'
			).currentOpacity = __classPrivateFieldGet(
				this,
				_BrowserWindow_winconfig,
				'f'
			).vibrnacyConfig.colors.a
			__classPrivateFieldGet(
				this,
				_BrowserWindow_winconfig,
				'f'
			).vibrnacyConfig.currentOpacity = __classPrivateFieldGet(
				this,
				_BrowserWindow_winconfig,
				'f'
			).vibrnacyConfig.colors.a
		}
	}
}
exports.BrowserWindow = BrowserWindow
;(_BrowserWindow_vibconfig = new WeakMap()),
	(_BrowserWindow_winconfig = new WeakMap())
//# sourceMappingURL=browserWindow.js.map
