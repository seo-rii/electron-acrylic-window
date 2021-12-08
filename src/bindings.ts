export interface Bindings {
	setVibrancy(
		hwnd: number,
		effect: number,
		red: number,
		green: number,
		blue: number,
		opacity: number
	): void
	disableVibrancy(hwnd: number): void
}

let _bindings: Bindings | undefined
export default function bindings(): Bindings {
	return (_bindings ??= require('bindings')('vibrancy-wrapper'))
}
