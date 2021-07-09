module.exports = {
	env: {
		node: true,
		es6: true,
	},
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint'],
	extends: ['prettier'],
	globals: {
		__PATH_PREFIX__: true,
		Atomics: `readonly`,
		SharedArrayBuffer: `readonly`,
	},
	parserOptions: {
		ecmaVersion: 2018,
		sourceType: `module`,
	},
	ignorePatterns: ['node_modules/', 'build/'],
}
