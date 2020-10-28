namespace wrapper {
    export interface Bindings {
        setVibrancy(hwnd: number, effect: number, red: number, green: number, blue: number, opacity: number): void
        disableVibrancy(hwnd: number): void
    }
}

const wrapper: wrapper.Bindings = require("bindings")("vibrancy-wrapper")

export = wrapper