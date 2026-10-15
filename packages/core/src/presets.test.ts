import { PRESETS, resolveConfig } from '@hello-eme/play-schema';
import { describe, expect, it } from 'vitest';
import { createStaticHost } from './index.js';
import { createWorld } from './world.js';

const calm = ['explore', 'navigate', 'tour'] as const;

function play(id: (typeof calm)[number], seconds: number) {
	const config = resolveConfig(PRESETS[id]?.config);
	const world = createWorld(config, { seed: 1, host: createStaticHost() });
	for (let time = 0; time < seconds; time += 1 / 30) world.step(1 / 30);
	return world;
}

describe('the calm presets (just look around, navigate, car tour)', () => {
	it.each(calm)('%s: no monsters ever, and the figure keeps all its health', (id) => {
		const world = play(id, 60);
		expect(world.bodies.filter((body) => body.kind === 'monster')).toHaveLength(0);
		expect(world.player.hp).toBe(world.maxHp(world.player));
		expect(world.phase).toBe('playing');
	});

	it.each(calm)('%s: the figure has nothing to punch with', (id) => {
		expect(resolveConfig(PRESETS[id]?.config).entities.hero?.moves).toEqual([]);
	});

	it('navigate starts in the side view, the others from above', () => {
		expect(resolveConfig(PRESETS.navigate?.config).view.mode).toBe('side');
		expect(resolveConfig(PRESETS.explore?.config).view.mode).toBe('topdown');
	});

	it('the tour sends a car by itself, and nothing is run over', () => {
		const world = play('tour', 30);
		expect(world.bodies.some((body) => body.kind === 'vehicle')).toBe(true);
		expect(resolveConfig(PRESETS.tour?.config).game.overrunSpeed).toBe(5000);
	});
});
