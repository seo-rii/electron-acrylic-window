const blurLink = document.getElementById('blur-link'),
	devtoolsLink = document.getElementById('devtools-link')

devtoolsLink.addEventListener('click', () => {
	window.browser.webContents.openDevTools({
		mode: 'detach',
		activate: true,
	})
})

blurLink.addEventListener('click', () => {
	window.browser.blur()
})
