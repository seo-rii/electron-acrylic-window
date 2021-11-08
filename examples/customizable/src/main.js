const { BrowserWindow } = require('../../../dist')
const { toggleDebugging: debug } = require('../../../dist/debug')
const { app, shell } = require('electron')
const os = require('os')
const path = require('path')

function isVibrancySupported() {
	// Windows 10 or greater
	return (
		process.platform === 'win32' &&
		parseInt(os.release().split('.')[0]) >= 10
	)
}

let window
function createWindow() {
	// activate debugging
	debug(true)

	let vibrancy = 'dark'

	if (isVibrancySupported()) {
		vibrancy = {
			theme: '#12345678',
			effect: 'acrylic',
			useCustomWindowRefreshMethod: true,
			disableOnBlur: true,
			debug: false,
		}
	}

	window = new BrowserWindow({
		width: 800,
		height: 600,
		minWidth: 800,
		minHeight: 600,
		frame: false,
		webPreferences: {
			nodeIntegration: true,
			enableRemoteModule: true,
			contextIsolation: false,
		},
		vibrancy: vibrancy,
	})
	require('@electron/remote/main').initialize()
	require('@electron/remote/main').enable(window.webContents)

	window.loadFile(path.resolve('public/index.html'))
	window.webContents.openDevTools({ mode: 'detach' })

	// Open links in browser
	window.webContents.setWindowOpenHandler((details) => {
		shell.openExternal(details.url)
		return { action: 'deny' }
	})

	window.show()
}

function init() {
	createWindow()
}

app.on('ready', init)

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
	if (window === null) {
		createWindow()
	}
})
