import * as os from 'os'

export const isWindows10 = process.platform === 'win32' && os.release().split('.')[0] === '10'

export const isRS4OrGreater = isWindows10 && (!(os.release().split('.')[1] === '0' && parseInt(os.release().split('.')[2]) < 17134))
