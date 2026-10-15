// Shared ESLint config for every package.
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';

export default defineConfig(
	{ ignores: ['**/node_modules/', '**/dist/', '**/coverage/'] },
	js.configs.recommended,
	ts.configs.strict,
	prettier,
	{ languageOptions: { globals: { ...globals.browser, ...globals.node } } },
	{
		rules: {
			// TypeScript already reports undefined identifiers.
			'no-undef': 'off',
			'@typescript-eslint/consistent-type-imports': 'error',
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/no-non-null-assertion': 'error',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
			]
		}
	}
);
