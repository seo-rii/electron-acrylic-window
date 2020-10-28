let _debug = false

export default function debug(...msgs: (string | unknown)[]) {
	if (!_debug) return
	console.log(...msgs)
}

export function toggleDebugging(debug: boolean) {
	_debug = debug
}
