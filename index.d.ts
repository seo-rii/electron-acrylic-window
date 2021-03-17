declare module 'electron-acrylic-window' {
	import {
		BrowserWindow as EBrowserWindow,
		BrowserWindowConstructorOptions,
	} from 'electron'

	class BrowserWindow extends EBrowserWindow {
		constructor(options?: AcrylicBrowserWindowConstructorOptions)
	}

	/**
	 * Set the vibrancy for the specified window.
	 *
	 * @param window
	 * @param options
	 */
	function setVibrancy(
		window: EBrowserWindow,
		options: AcrylicBrowserWindowConstructorOptions | null
	): void

	/**
	 * Allow modifying default BrowserWindowConstructorOptions
	 * to change vibrancy to VibrancyOptions.
	 */
	type Modify<T, R> = Omit<T, keyof R> & R

	/**
	 * The new options of the BrowserWindow with the VibrancyOptions.
	 */
	type AcrylicBrowserWindowConstructorOptions = Modify<
		BrowserWindowConstructorOptions,
		{
			/**
			 * The vibrancy settings for the window. Can be
			 * a VibrancyTheme or the VibrancyOptions object.
			 */
			vibrancy?: VibrancyTheme | VibrancyOptions
		}
	>

	/**
	 * The vibrancy object
	 */
	interface VibrancyOptions {
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
		 * If true, log will printed to console.
		 */
		debug?: boolean
	}

	/**
	 * The theme to apply to the vibrancy. Can be 'light',
	 * 'dark', 'appearance-based' or a custom HEX color
	 * with alpha.
	 */
	type VibrancyTheme = 'light' | 'dark' | 'appearance-based' | 0xff
	/**
	 * The effect to apply. Can be 'acrylic' or 'blur'.
	 */
	type VibrancyEffect = 'acrylic' | 'blur'
}
