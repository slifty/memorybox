// The plugin ships CommonJS with no declarations of its own.
declare module '@react-native/eslint-plugin' {
	import type { ESLint } from 'eslint';

	const plugin: ESLint.Plugin;
	export = plugin;
}
