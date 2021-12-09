import * as os from 'os'

export const isWindows10OrGreater =
	process.platform === 'win32' && os.release().split('.')[0] === '10'

export const isWindows11OrGreater =
	process.platform === 'win32' &&
	parseInt(os.release().split('.')[2]) >= 22000

export const isRS4OrGreater =
	isWindows10OrGreater &&
	!(
		os.release().split('.')[1] === '0' &&
		parseInt(os.release().split('.')[2], 10) < 17134
	)
