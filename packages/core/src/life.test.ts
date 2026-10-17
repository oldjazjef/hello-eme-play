import { describe, expect, it, vi } from 'vitest';
import { sizeOf } from './space.js';
import { createWorld } from './world.js';

const quiet = (extra: Record<string, unknown> = {}) =>
	createWorld({ spawns: [], visits: { enabled: false }, ...extra }, { seed: 1 });

function run(world: ReturnType<typeof createWorld>, seconds: number): void {
	for (let t = 0; t < seconds; t += 0.05) world.step(0.05);
}

const still = { behavior: 'stand', moves: [] };

describe('breeding', () => {
	const make = (breed: Record<string, unknown>, extra: Record<string, unknown> = {}) =>
		quiet({
			entities: {
				blob: { ...still, stats: { hp: 3, attack: 0, speed: 50 }, breed },
				...extra
			}
		});

	it('has young now and then, never above the maximum', () => {
		const world = make({ every: { min: 1, max: 1 }, count: { min: 2, max: 2 }, max: 5 });
		const born = vi.fn();
		world.events.on('breed', born);
		world.spawn('blob', world.player.x + 300, world.player.y);
		run(world, 20);
		const blobs = world.bodies.filter((body) => body.def === 'blob');
		expect(blobs).toHaveLength(5);
		expect(born).toHaveBeenCalled();
	});

	it('does nothing without an interval', () => {
		const world = make({});
		world.spawn('blob', world.player.x + 300, world.player.y);
		run(world, 20);
		expect(world.bodies).toHaveLength(1);
	});

	it('the young can be another kind', () => {
		const world = make(
			{ every: { min: 1, max: 1 }, max: 3, into: 'pup' },
			{ pup: { ...still, stats: { hp: 1 } } }
		);
		world.spawn('blob', world.player.x + 300, world.player.y);
		run(world, 10);
		expect(world.bodies.filter((body) => body.def === 'pup')).toHaveLength(3);
		expect(world.bodies.filter((body) => body.def === 'blob')).toHaveLength(1);
	});

	it('young appear next to the parent', () => {
		const world = make({ every: { min: 1, max: 1 }, max: 2 });
		const parent = world.spawn('blob', world.player.x + 300, world.player.y);
		run(world, 1.2);
		const child = world.bodies.find((body) => body !== parent);
		expect(child && parent && Math.hypot(child.x - parent.x, child.y - parent.y)).toBeLessThan(120);
	});
});

describe('evolving', () => {
	const make = (evolve: Record<string, unknown>, extra: Record<string, unknown> = {}) =>
		quiet({
			entities: {
				blob: { ...still, size: 40, stats: { hp: 4, attack: 1, speed: 50 }, evolve },
				...extra
			}
		});

	it('gains levels over time: stats, health and size grow, up to the top level', () => {
		const world = make({ every: 2, maxLevel: 3, stats: { hp: 5, attack: 2 }, size: 10 });
		const levels = vi.fn();
		world.events.on('evolve', levels);
		const blob = world.spawn('blob', world.player.x + 300, world.player.y);
		run(world, 30);
		expect(blob?.level).toBe(3);
		expect(blob?.stats).toMatchObject({ hp: 19, attack: 7 });
		expect(blob?.hp).toBe(19);
		expect(levels).toHaveBeenCalledTimes(3);
		expect(blob && sizeOf(world, blob)).toBe(70);
	});

	it('gains a level by hitting the figure', () => {
		const world = quiet({
			entities: {
				hero: { kind: 'figure', stats: { hp: 1000, speed: 220 } },
				blob: {
					stats: { hp: 4, attack: 1, speed: 50 },
					moves: ['bite'],
					evolve: { hits: 2, maxLevel: 5, stats: { attack: 1 } }
				}
			}
		});
		const blob = world.spawn('blob', world.player.x + 20, world.player.y);
		run(world, 6);
		expect(blob?.level).toBeGreaterThan(0);
		expect(blob?.stats.attack).toBeGreaterThan(1);
	});

	it('turns into another kind at the top level, at full health', () => {
		const world = make(
			{ every: 1, maxLevel: 2, into: 'beast' },
			{ beast: { ...still, stats: { hp: 50, attack: 9 } } }
		);
		const blob = world.spawn('blob', world.player.x + 300, world.player.y);
		run(world, 3);
		expect(blob?.def).toBe('beast');
		expect(blob?.hp).toBe(50);
		expect(blob?.level).toBe(0);
	});
});
