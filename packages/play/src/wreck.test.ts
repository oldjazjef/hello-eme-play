import { describe, expect, it } from 'vitest';
import { burst, fly, hitsToBreak, SHARDS, SMALL_AREA } from './wreck.js';

describe('hitsToBreak', () => {
	it('breaks small things with one hit, text with two, media and cards with three', () => {
		expect(hitsToBreak({ sturdy: false, area: SMALL_AREA - 1 })).toBe(1);
		expect(hitsToBreak({ sturdy: false, area: SMALL_AREA * 10 })).toBe(2);
		expect(hitsToBreak({ sturdy: true, area: 100 })).toBe(3);
	});
});

describe('shards', () => {
	const box = { x: 10, y: 20, width: 100, height: 40 };

	it('burst out of the broken element', () => {
		let seed = 0;
		const shards = burst(box, 3, () => (seed = (seed * 9301 + 49297) % 233280) / 233280);
		expect(shards).toHaveLength(SHARDS.count);
		for (const shard of shards) {
			expect(shard.x).toBeGreaterThanOrEqual(box.x);
			expect(shard.x).toBeLessThanOrEqual(box.x + box.width);
			expect(shard.color).toBeLessThan(3);
		}
	});

	it('fall and burn out', () => {
		const shards = burst(box, 1, () => 0.5);
		const later = fly(shards, 0.1);
		expect(later[0]?.vy).toBeGreaterThan(shards[0]?.vy ?? 0);
		expect(fly(shards, SHARDS.life + 0.1)).toHaveLength(0);
	});

	it('keep only the newest when there are too many', () => {
		const many = Array.from({ length: 20 }, () => burst(box, 1)).flat();
		expect(fly(many, 0.01).length).toBeLessThanOrEqual(SHARDS.max);
	});
});
