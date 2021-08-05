const closeControlEl = document.getElementById('close-control'),
	maximizeControlEl = document.getElementById('maximize-control'),
	restoreControlEl = document.getElementById('restore-control'),
	minimizeControlEl = document.getElementById('minimize-control')

function updateWindowMaximizeState() {
	if (window.browser.isMaximized()) {
		document.body.classList.add('maximized')
	} else {
		document.body.classList.remove('maximized')
	}
}

window.browser.on('maximize', updateWindowMaximizeState)
window.browser.on('unmaximize', updateWindowMaximizeState)

closeControlEl.addEventListener('click', () => {
	if (window.browser.isClosable()) {
		window.browser.close()
	}
})

maximizeControlEl.addEventListener('click', () => {
	if (window.browser.isMaximizable() && !window.browser.isMaximized()) {
		window.browser.maximize()
	}

	updateWindowMaximizeState()
})

restoreControlEl.addEventListener('click', () => {
	if (window.browser.isMaximized()) {
		window.browser.unmaximize()
	}

	updateWindowMaximizeState()
})

minimizeControlEl.addEventListener('click', () => {
	if (window.browser.isMinimizable() && !window.browser.isMinimized()) {
		window.browser.minimize()
	}
})
