/**
 * Bundles the editor for pages without a bundler: `dist/editor.iife.js` (the `editor.js` of a release,
 * `window.PlayEditor`) and `dist/editor.mjs` (`import { mount } from '@hello-eme/play-editor'`). React, the
 * schema and the bot are inside, and so is the game's drop-in script: the built-in preview plays on it.
 * Run after `tsc` and after the play package is built.
 */
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';

const play = readFileSync(new URL('../../play/dist/play.iife.js', import.meta.url), 'utf8');

const shared = {
	bundle: true,
	minify: true,
	target: 'es2022',
	jsx: 'automatic',
	logLevel: 'warning',
	define: {
		'process.env.NODE_ENV': '"production"',
		__PLAY_BUNDLE__: JSON.stringify(play)
	}
};

await build({
	...shared,
	entryPoints: ['src/vanilla.tsx'],
	format: 'iife',
	outfile: 'dist/editor.iife.js'
});
await build({
	...shared,
	entryPoints: ['src/index.ts'],
	format: 'esm',
	outfile: 'dist/editor.mjs'
});
