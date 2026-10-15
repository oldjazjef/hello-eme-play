import type { Config } from 'payload';
import { describe, expect, it } from 'vitest';
import { playPlugin, validateConfig } from './index.js';

describe('playPlugin', () => {
	it('adds the global next to the existing ones', async () => {
		const config = await playPlugin()({
			globals: [{ slug: 'other', fields: [] }]
		} as unknown as Config);
		expect(config.globals?.map((global) => global.slug)).toEqual(['other', 'play']);
	});
});

describe('validateConfig', () => {
	it('accepts a good or empty configuration and explains a bad one', () => {
		expect(validateConfig({ view: { mode: 'side' } })).toBe(true);
		expect(validateConfig(null)).toBe(true);
		expect(validateConfig({ view: { mode: 'x' } })).toBe(
			'"view.mode" must be "topdown" or "side".'
		);
	});
});
