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

describe('the arsenal preset', () => {
	it('has bombs, rocks and mines, and three kinds of vehicle that handle differently', () => {
		const config = resolveConfig(PRESETS.arsenal?.config);
		expect(Object.keys(config.throwables).sort()).toEqual(['bomb', 'mine', 'rock']);
		const vehicles = Object.values(config.entities).filter((entity) => entity.kind === 'vehicle');
		expect(vehicles).toHaveLength(3);
		expect(new Set(vehicles.map((vehicle) => JSON.stringify(vehicle.drive))).size).toBe(3);
	});

	it('plays: bombs thrown at a crowd of blobs clear it and cost ammo', () => {
		const config = resolveConfig(PRESETS.arsenal?.config);
		const standing = { ...config.entities.blob, behavior: 'stand' as const };
		const world = createWorld(
			{ ...config, entities: { ...config.entities, blob: standing } },
			{ seed: 3, host: createStaticHost() }
		);
		world.player.angle = 0;
		for (let i = 0; i < 4; i++) world.spawn('blob', world.player.x + 120 + i * 10, world.player.y);
		const ammo = world.ammoOf('bomb');
		expect(world.throwItem('bomb')).toBe(true);
		for (let time = 0; time < 3; time += 1 / 30) world.step(1 / 30);
		expect(world.ammoOf('bomb')).toBe(ammo - 1);
		expect(world.stats.kills).toBeGreaterThan(0);
	});
});
