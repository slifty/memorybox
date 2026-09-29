import biffud from '@biffud/eslint-config';
import eslintReact from '@eslint-react/eslint-plugin';
import reactNative from '@react-native/eslint-plugin';
import { defineConfig } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import { flatConfigs as importX } from 'eslint-plugin-import-x';
import reactHooks from 'eslint-plugin-react-hooks';

const sourceFiles = ['**/*.{ts,tsx}'];

export default defineConfig([
	...biffud,
	importX.recommended,
	importX.typescript,
	{
		files: sourceFiles,
		extends: [
			eslintReact.configs['recommended-type-checked'],
			reactHooks.configs.flat.recommended,
		],
		plugins: {
			'@react-native': reactNative,
		},
		languageOptions: {
			parserOptions: {
				// The project service arrives with `...biffud`; all this adds is a
				// root to resolve from, so a lint run started anywhere in the tree
				// finds the same tsconfig.
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			'@react-native/no-deep-imports': 'error',
			'@react-native/platform-colors': 'error',
		},
	},
	{
		rules: {
			// Unlike some code bases we explicitly do not want default exports.
			'import-x/prefer-default-export': 'off',
			'import-x/no-default-export': 'error',

			'import-x/order': [
				'error',
				{
					groups: [
						'builtin',
						'external',
						'internal',
						'parent',
						'sibling',
						'index',
						'object',
						'type',
					],
					'newlines-between': 'never',
					alphabetize: {
						order: 'asc',
						caseInsensitive: true,
					},
				},
			],
		},
	},
	{
		// ESLint requires a default export here.
		files: ['eslint.config.mjs'],
		rules: {
			'import-x/no-default-export': 'off',
		},
	},
	prettier,
]);
