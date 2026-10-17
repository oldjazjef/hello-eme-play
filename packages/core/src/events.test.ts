import { describe, expect, it } from 'vitest';
import { createWorld } from './world.js';

const quiet = (extra: Record<string, unknown> = {}) =>
	createWorld({ spawns: [], visits: { enabled: false }, ...extra }, { seed: 1 });

function run(world: ReturnType<typeof createWorld>, seconds: number): void {
	for (let t = 0; t < seconds; t += 0.05) world.step(0.05);
}

const points = (amount: number) => [{ do: 'points', amount }];
const bomb = { speed: 0, fuse: 0.2, radius: 60, power: 1, ammo: 5, cooldown: 0 };

describe('trigger events for the newer things', () => {
	it('throw and explode, for one throwable only', () => {
		const world = quiet({
			throwables: { bomb, other: { ...bomb, ammo: 2 } },
			triggers: [
				{ on: 'throw', only: 'bomb', do: points(1) },
				{ on: 'explode', only: 'bomb', do: points(10) },
				{ on: 'throw', only: 'other', do: points(1000) }
			]
		});
		world.throwItem('bomb');
		run(world, 0.5);
		expect(world.score).toBe(11);
	});

	it('breed, for the parent', () => {
		const world = quiet({
			entities: { blob: { behavior: 'stand', breed: { every: { min: 1, max: 1 }, max: 3 } } },
			triggers: [{ on: 'breed', only: 'blob', do: points(5) }]
		});
		world.spawn('blob', world.player.x + 300, world.player.y);
		run(world, 1.5);
		expect(world.score).toBeGreaterThanOrEqual(5);
	});

	it('wreck, and summon', () => {
		const world = quiet({
			entities: {
				car: {
					kind: 'vehicle',
					absorbs: true,
					stats: { hp: 5, speed: 400, accel: 500, handling: 3 }
				},
				pet: { stats: { hp: 10 }, moves: [] }
			},
			triggers: [
				{ on: 'wreck', only: 'car', do: points(100) },
				{ on: 'summon', only: 'pet', do: points(7) }
			]
		});
		world.recruit('pet');
		world.cycleParty();
		expect(world.score).toBe(7);
		const car = world.spawn('car', world.player.x, world.player.y);
		if (car) car.pilot = undefined;
		world.use();
		if (car) world.wreck(car);
		expect(world.score).toBe(107);
	});

	it('touch: an object runs its effect when the figure touches it, not more often than every', () => {
		const world = quiet({
			items: { door: { pickup: 'none', lifetime: 0, size: 60, every: 2, do: points(10) } },
			triggers: [{ on: 'touch', only: 'door', do: points(1) }]
		});
		world.dropItem('door', world.player.x, world.player.y);
		run(world, 0.5);
		expect(world.score).toBe(11);
		run(world, 2);
		expect(world.score).toBe(22);
		world.player.x += 400;
		run(world, 3);
		expect(world.score).toBe(22);
	});
});

describe('conditions for the newer things', () => {
	const gated = (conditions: unknown[]) =>
		quiet({
			throwables: { bomb },
			entities: { pet: { stats: { hp: 10 }, moves: [] } },
			triggers: [{ on: 'start', conditions, do: points(1) }]
		});

	it('ammo, team and riding', () => {
		expect(gated([{ if: 'ammo', throwable: 'bomb', min: 5 }]).score).toBe(1);
		expect(gated([{ if: 'ammo', throwable: 'bomb', min: 6 }]).score).toBe(0);
		expect(gated([{ if: 'team', min: 1 }]).score).toBe(0);
		expect(gated([{ if: 'team', min: 0 }]).score).toBe(1);
		expect(gated([{ if: 'riding' }]).score).toBe(0);
	});

	it('riding holds in a vehicle, for a named one only when it is that one', () => {
		const world = quiet({
			triggers: [
				{ on: 'enterVehicle', conditions: [{ if: 'riding' }], do: points(1) },
				{ on: 'enterVehicle', conditions: [{ if: 'riding', entity: 'car' }], do: points(10) },
				{ on: 'enterVehicle', conditions: [{ if: 'riding', entity: 'tank' }], do: points(100) }
			]
		});
		const car = world.spawn('car', world.player.x, world.player.y);
		if (car) car.pilot = undefined;
		world.use();
		expect(world.score).toBe(11);
	});
});

describe('actions for the newer things', () => {
	it('callTeam sends out a team member', () => {
		const world = quiet({
			entities: { pet: { stats: { hp: 10 }, moves: [] } },
			triggers: [{ on: 'key', keys: ['KeyP'], do: [{ do: 'callTeam' }] }]
		});
		world.recruit('pet');
		world.press('KeyP');
		expect(world.ally?.def).toBe('pet');
	});

	it('hazard sets off a throwable as a trap that hurts the figure and spares monsters', () => {
		const world = quiet({
			entities: {
				hero: { kind: 'figure', stats: { hp: 100, attack: 1, speed: 220 } },
				blob: { stats: { hp: 5, speed: 0 }, behavior: 'stand', moves: [] }
			},
			throwables: { trap: { speed: 0, fuse: 0.3, radius: 120, power: 20 } },
			triggers: [
				{ on: 'start', do: [{ do: 'hazard', throwable: 'trap', where: 'figure', count: 1 }] }
			]
		});
		const blob = world.spawn('blob', world.player.x + 30, world.player.y);
		run(world, 0.8);
		expect(world.player.hp).toBeLessThan(100);
		expect(blob?.hp).toBe(5);
		expect(world.projectiles).toHaveLength(0);
	});
});
