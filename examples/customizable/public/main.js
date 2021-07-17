import './carbon.min.js'
import './browser.js'
import './controls.js'
import './footer.js'

const updateForm = document.getElementById('update-form'),
	colorInput = document.getElementById('color')

function isDark(hex) {
	hex =
		typeof hex == 'string'
			? hex.charAt(0) == '#'
				? parseInt(hex.substring(1), 16)
				: parseInt(hex, 16)
			: hex
	return (
		0.2126 * ((hex >> 16) & 0xff) +
			0.7152 * ((hex >> 8) & 0xff) +
			0.0722 * ((hex >> 0) & 0xff) <
		40
	)
}

function setWindowTheme(theme) {
	document.documentElement.setAttribute('data-theme', theme)
}

// Set color theme immediately
setWindowTheme(isDark(12345678) ? 'dark' : 'light')

colorInput.addEventListener('input', () => {
	let color = colorInput.value

	// Add # to start if not exists
	colorInput.value = color = (!color.startsWith('#') ? '#' : '') + color

	// Replace not octo digit char with void
	colorInput.value = color = '#' + color.substr(1).replace(/[^a-f\d]/gi, '')

	// Check if color is valid hex format
	colorInput.invalid = !/^#[a-f\d]{8}$/i.test(color)
})

function update(sync) {
	const { customRefresh, disableOnBlur, effect, color, appTheme } =
		Object.fromEntries(new FormData(updateForm).entries())

	if (appTheme === 'auto') {
		setWindowTheme(isDark(color) ? 'dark' : 'light')
	} else {
		setWindowTheme(appTheme)
	}

	// Set global css variable "--window-border-color" to color
	document.body.style.setProperty('--window-border-color', color)

	// Update vibrancy
	window.browser.setVibrancy({
		theme: color,
		effect: effect,
		useCustomWindowRefreshMethod: customRefresh === 'on',
		disableOnBlur: disableOnBlur === 'on',
	})

	if (sync) {
		localStorage.setItem('out-of-sync', 'true')
	}
}

updateForm.addEventListener('submit', (event) => {
	event.preventDefault()
	update(false)
	return false
})
