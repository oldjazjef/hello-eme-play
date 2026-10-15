import { ITEM_LOOKS, LOOKS } from '@hello-eme/play-schema';
import { describe, expect, it } from 'vitest';
import { ITEM_LOOK_PATHS, LOOK_ROWS, SPRITE_COLORS } from './looks.js';

describe('looks', () => {
	it('has a rectangular picture for every look, made of known parts', () => {
		for (const look of LOOKS) {
			const rows = LOOK_ROWS[look];
			expect(rows.length, look).toBeGreaterThan(0);
			expect(new Set(rows.map((row) => row.length)).size, look).toBe(1);
			for (const char of rows.join('')) {
				expect(char === '.' || char in SPRITE_COLORS, `${look}: ${char}`).toBe(true);
			}
		}
	});

	it('has an outline for every item look, closed and inside the 100 × 100 box', () => {
		for (const look of ITEM_LOOKS) {
			const path = ITEM_LOOK_PATHS[look];
			expect(path, look).toMatch(/^M.*Z$/);
			const numbers = [...path.matchAll(/-?\d+(?:\.\d+)?/g)].map((match) =>
				Math.abs(Number(match[0]))
			);
			expect(Math.max(...numbers), look).toBeLessThanOrEqual(70);
		}
	});
});
