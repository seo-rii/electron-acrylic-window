import { BrowserWindow, Vibrancy } from '../dist'
import { toggleDebugging as debug } from '../dist/debug'
import { app } from 'electron'
import * as os from 'os'
import * as path from 'path'

let win: BrowserWindow

const isWindows10 =
	process.platform === 'win32' && os.release().split('.')[0] === '10'

function createWindow() {
	// activate debugging
	debug(true)

	let vibrancyOp: Vibrancy

	if (isWindows10)
		vibrancyOp = {
			theme: '#661237cc',
			effect: 'acrylic',
			useCustomWindowRefreshMethod: true,
			disableOnBlur: true,
			debug: false,
		}
	else vibrancyOp = 'dark'

	win = new BrowserWindow({
		width: 800,
		height: 600,
		frame: false,
		webPreferences: {
			nodeIntegration: true,
			enableRemoteModule: true,
			contextIsolation: false,
		},
		vibrancy: vibrancyOp,
	})

	win.loadFile(path.join(__dirname, 'test.html'))
	win.webContents.openDevTools({ mode: 'detach' })

	win.show()
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
	if (win === null) createWindow()
})
