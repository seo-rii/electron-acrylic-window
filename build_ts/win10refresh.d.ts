import { BrowserWindow } from './browserWindow';
/**
 * Unfortunately, we have to re-implement moving and resizing.
 * Enabling vibrancy slows down the window's event handling loop to the
 * point building a mouse event backlog. If you just handle these events
 * in the backlog without taking the time difference into consideration,
 * you end up with visible movement lag.
 * We tried pairing 'will-move' with 'move', but Electron actually sends the
 * 'move' events _before_ Windows actually commits to the operation. There's
 * likely some queuing going on that's getting backed up. This is not the case
 * with 'will-resize' and 'resize', which need to use the default behavior
 * for compatibility with soft DPI scaling.
 * The ideal rate of moving and resizing is based on the vertical sync
 * rate: if your display is only fully updating at 120 Hz, we shouldn't
 * be attempting to reset positions or sizes any faster than 120 Hz.
 * If we were doing this in a browser context, we would just use
 * requestAnimationFrame and call it a day. But we're not inside of a
 * browser context here, so we have to resort to clever hacks.
 * This VerticalRefreshRateContext maps a point in screen space to the
 * vertical sync rate of the display(s) actually handing that point.
 * It handles multiple displays with varying vertical sync rates,
 * and changes to the display configuration while this process is running.
 */
export default function win10refresh(win: BrowserWindow, maximumRefreshRate: number): void;
