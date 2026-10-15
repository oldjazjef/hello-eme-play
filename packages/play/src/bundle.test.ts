/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(import.meta.dirname, '..');
const manifest: { scripts: { build: string }; exports: Record<string, unknown> } = JSON.parse(
	readFileSync(join(root, 'package.json'), 'utf8')
);

describe('the drop-in bundle', () => {
	it('does not overwrite the compiled module of the same name', () => {
		// `tsc` writes dist/<module>.js for every src/<module>.ts; the bundle must not use one of those
		// names, or `import { createPlay } from '@hello-eme/play'` loses its export.
		const outfile = /--outfile=dist\/([\w.-]+)\.js/.exec(manifest.scripts.build)?.[1];
		expect(outfile).toBeDefined();
		expect(existsSync(join(root, 'src', `${outfile}.ts`))).toBe(false);
	});

	it('is what the "./play.js" export points to', () => {
		const outfile = /--outfile=(dist\/[\w.-]+\.js)/.exec(manifest.scripts.build)?.[1];
		expect(manifest.exports['./play.js']).toBe(`./${outfile}`);
	});
});
