import { resolveConfig } from '@hello-eme/play-schema';
import { describe, expect, it, vi } from 'vitest';
import { createEventBus } from './events.js';
import { createRandom } from './random.js';
import { createWorld } from './world.js';

describe('createRandom', () => {
	it('gives the same numbers for the same seed, all in [0, 1)', () => {
		const a = createRandom(42);
		const b = createRandom(42);
		const numbers = Array.from({ length: 5 }, () => a());
		expect(numbers).toEqual(Array.from({ length: 5 }, () => b()));
		expect(numbers.every((n) => n >= 0 && n < 1)).toBe(true);
		expect(createRandom(43)()).not.toBe(numbers[0]);
	});
});

describe('createEventBus', () => {
	it('calls listeners until they unsubscribe', () => {
		const bus = createEventBus<{ hit: { damage: number } }>();
		const listener = vi.fn();
		const off = bus.on('hit', listener);
		bus.emit('hit', { damage: 3 });
		off();
		bus.emit('hit', { damage: 5 });
		expect(listener).toHaveBeenCalledTimes(1);
		expect(listener).toHaveBeenCalledWith({ damage: 3 });
	});
});

describe('createWorld', () => {
	const config = resolveConfig({ entities: { blob: { stats: { hp: 20 } } } });

	it('spawns entities with their start stats and tells the listeners', () => {
		const world = createWorld(config, { seed: 1 });
		const spawned = vi.fn();
		world.events.on('entity.spawned', spawned);
		const blob = world.spawn('blob', 10, 20);
		expect(blob).toMatchObject({ id: 1, x: 10, y: 20, stats: { hp: 20 } });
		expect(world.entities).toHaveLength(1);
		expect(spawned).toHaveBeenCalledOnce();
		expect(world.spawn('ghost', 0, 0)).toBeUndefined();
	});

	it('removes entities and runs the systems in order', () => {
		const order: string[] = [];
		const world = createWorld(config, {
			seed: 1,
			systems: [() => order.push('first'), (_world, dt) => order.push(`second ${dt}`)]
		});
		const blob = world.spawn('blob', 0, 0);
		world.remove(blob?.id ?? -1);
		world.step(0.5);
		expect(world.entities).toEqual([]);
		expect(order).toEqual(['first', 'second 0.5']);
	});
});
