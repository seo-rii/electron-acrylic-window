/// <reference types="node" />
import * as electron from 'electron';
import { Vibrancy, VibrancyConfig } from './vibrancy';
/**
 * Allow modifying default BrowserWindowConstructorOptions
 * to change vibrancy to VibrancyOptions.
 */
declare type Modify<T, R> = Omit<T, keyof R> & R;
declare type _AcrylicBrowserWindowConstructorOptions = Modify<electron.BrowserWindowConstructorOptions, {
    /**
     * The vibrancy settings for the window. Can be
     * a VibrancyTheme or the VibrancyOptions object.
     */
    vibrancy?: Vibrancy;
}>;
/**
 * The options of the BrowserWindow constructor including the vibrancy options.
 */
export interface AcrylicBrowserWindowConstructorOptions extends _AcrylicBrowserWindowConstructorOptions {
}
export interface WindowConfig {
    vibrancyActivated: boolean;
    vibrnacyConfig: VibrancyConfig;
    /**
     * Property designed to control the transparency of the focus.
     * TargetOpacity is the opacity that Windows should have.
     */
    targetOpacity: number;
    /**
     * user-set opacity
     */
    opacity: number;
    /**
     * Property designed to control the transparency of the focus.
     * The id of the interval for smooth transition of currentOpacity to targetOpacity when focus changes.
     * The reason for saving this is to call clearInterval after the conversion is complete.
     */
    opacityInterval: NodeJS.Timeout | undefined;
    /**
     * Property designed to control the transparency of the focus.
     * CurrentOpacity is the transparency value that Windows actually has currently.
     */
    currentOpacity: number;
    /**
     * Property designed to control the movement of the window
     * The id of the interval for tracking window movement
     * The reason for saving this is to call clearInterval after the conversion is complete.
     */
    moveTimeout: NodeJS.Timeout | undefined;
    debug: boolean;
}
/**
 * Class wrapper for `electron.BrowserWindow`.
 * The class handles the vibrancy effects.
 */
export declare class BrowserWindow extends electron.BrowserWindow {
    #private;
    private options?;
    constructor(options?: AcrylicBrowserWindowConstructorOptions | undefined);
    get __electron_acrylic_window__(): WindowConfig;
    set __electron_acrylic_window__(v: WindowConfig);
    /**
     * Set the vibrancy for the specified window.
     *
     * @param options
     */
    setVibrancy(options?: Vibrancy): void;
}
export {};
