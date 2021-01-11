import { BrowserWindow } from './browserWindow';
/**
 * Red, green, blue and alpha
 */
export interface RGBA extends RGB {
    a: number;
}
/**
 * Red, green and blue
 */
export interface RGB {
    r: number;
    g: number;
    b: number;
}
export interface VibrancyConfig {
    colors: RGBA & {
        base?: RGBA;
    };
    effect: 0 | 1;
    useCustomWindowRefreshMethod?: boolean;
    maximumRefreshRate?: number;
    disableOnBlur?: boolean;
    currentOpacity: number;
}
export declare function hexTo255(hex: string): number | undefined;
export declare function _8bitToHex(c: number): string;
export declare function rgbToHex(rgb: RGB | RGBA): string;
/**
 * The theme to apply to the vibrancy. Can be 'light',
 * 'dark', 'appearance-based' or a custom HEX color
 * with alpha.
 */
export declare type VibrancyTheme = 'light' | 'dark' | 'appearance-based' | string;
/**
 * The effect to apply. Can be 'acrylic' or 'blur'.
 */
export declare type VibrancyEffect = 'acrylic' | 'blur';
/**
 * Options to apply to the vibrancy
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
    /**
     * If true, log will be printed to console.
     */
    debug?: boolean;
}
export declare type Vibrancy = VibrancyTheme | VibrancyOptions;
export declare function getConfigFromOptions(vibrancyOptions: Vibrancy | undefined): VibrancyConfig;
export declare function _setVibrancy(win: BrowserWindow, config?: VibrancyConfig): void;
/**
 * Set the vibrancy for the specified window.
 *
 * @param options
 */
export declare function setVibrancy(win: BrowserWindow, vibrancy?: Vibrancy): void;
