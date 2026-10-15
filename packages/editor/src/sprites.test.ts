import { configProblems, resolveConfig } from '@hello-eme/play-schema';
import { describe, expect, it } from 'vitest';
import { guessSprite, HEAVY_BYTES, idFromFilename } from './sprites.js';

const png = (width: number, height: number, bytes = 5_000) => ({
	width,
	height,
	bytes,
	type: 'image/png'
});

describe('idFromFilename', () => {
	it('makes a tidy id', () => {
		expect(idFromFilename('Hero Walk (2).PNG')).toBe('hero-walk-2');
		expect(idFromFilename('!!!.png')).toBe('sprite');
	});
});

describe('guessSprite', () => {
	it('takes a single picture as it is', () => {
		const guess = guessSprite('blob.png', png(64, 48), '/m/blob.png', {});
		expect(guess).toEqual({ id: 'blob', sprite: { url: '/m/blob.png', size: 64 }, warnings: [] });
	});

	it('reads a horizontal strip of square frames as a sheet', () => {
		const guess = guessSprite('hero.png', png(256, 64), '/m/hero.png', {});
		expect(guess.sprite).toEqual({ url: '/m/hero.png', size: 64, columns: 4 });
	});

	it('reads a vertical strip too', () => {
		const guess = guessSprite('hero.png', png(32, 96), '/m/hero.png', {});
		expect(guess.sprite).toEqual({ url: '/m/hero.png', size: 32, rows: 3 });
	});

	it('does not invent a sheet for a square picture', () => {
		const guess = guessSprite('a.png', png(128, 128), '/m/a.png', {});
		expect(guess.sprite).not.toHaveProperty('columns');
		expect(guess.sprite).not.toHaveProperty('rows');
	});

	it('warns about big, tiny and heavy pictures and keeps the size in the schema bounds', () => {
		expect(guessSprite('a.png', png(1000, 800), '/a', {}).warnings).toContain('tooBig');
		expect(guessSprite('a.png', png(1000, 800), '/a', {}).sprite.size).toBe(400);
		expect(guessSprite('a.png', png(4, 4), '/a', {}).warnings).toContain('tiny');
		expect(guessSprite('a.png', png(4, 4), '/a', {}).sprite.size).toBe(8);
		expect(guessSprite('a.png', png(64, 64, HEAVY_BYTES + 1), '/a', {}).warnings).toContain(
			'heavy'
		);
	});

	it('warns about files that are no usable image', () => {
		expect(
			guessSprite('a.pdf', { ...png(1, 1), type: 'application/pdf' }, '/a', {}).warnings
		).toContain('notImage');
		expect(
			guessSprite('a.bmp', { ...png(64, 64), type: 'image/bmp' }, '/a', {}).warnings
		).toContain('unsupported');
	});

	it('leaves the size alone when it is unknown (SVG without a size)', () => {
		const guess = guessSprite(
			'a.svg',
			{ width: 0, height: 0, bytes: 300, type: 'image/svg+xml' },
			'/a.svg',
			{}
		);
		expect(guess.warnings).toEqual(['noSize']);
		expect(guess.sprite).toEqual({ url: '/a.svg' });
	});

	it('picks a free id', () => {
		expect(guessSprite('blob.png', png(64, 64), '/a', { blob: {}, 'blob-2': {} }).id).toBe(
			'blob-3'
		);
	});

	it('produces a sprite the schema accepts as it is', () => {
		const guess = guessSprite('hero.png', png(256, 64), '/m/hero.png', {});
		const json = { sprites: { [guess.id]: guess.sprite } };
		expect(configProblems(json)).toEqual([]);
		expect(resolveConfig(json).sprites.hero).toMatchObject({ size: 64, columns: 4, rows: 1 });
	});
});
