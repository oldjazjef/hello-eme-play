import { describe, expect, it, vi } from 'vitest';
import { createWorld } from './world.js';

const quiet = (extra: Record<string, unknown> = {}) =>
	createWorld({ spawns: [], visits: { enabled: false }, ...extra }, { seed: 1 });

function run(world: ReturnType<typeof createWorld>, seconds: number): void {
	for (let t = 0; t < seconds; t += 0.05) world.step(0.05);
}

/** Gets the figure into a freshly placed vehicle. */
function ride(world: ReturnType<typeof createWorld>, def: string) {
	const vehicle = world.spawn(def, world.player.x, world.player.y);
	if (!vehicle) throw new Error('no such vehicle');
	vehicle.pilot = undefined;
	world.use();
	expect(world.riding).toBe(vehicle);
	return vehicle;
}

describe('vehicles that handle differently', () => {
	it('reverse speed, braking and rolling out come from the vehicle', () => {
		const make = (drive: Record<string, number>) => {
			const world = quiet({
				entities: {
					car: { kind: 'vehicle', stats: { speed: 400, accel: 800, handling: 3 }, drive }
				}
			});
			const vehicle = ride(world, 'car');
			world.controls.axis.y = 1;
			run(world, 2);
			const reversing = vehicle.speed;
			world.controls.axis.y = 0;
			run(world, 0.5);
			return { reversing, rolled: vehicle.speed };
		};
		const light = make({ reverse: 60, roll: 5000 });
		const heavy = make({ reverse: 300, roll: 50 });
		expect(light.reversing).toBeCloseTo(-60, 0);
		expect(heavy.reversing).toBeCloseTo(-300, 0);
		expect(light.rolled).toBeCloseTo(0, 0);
		expect(Math.abs(heavy.rolled)).toBeGreaterThan(200);
	});

	it('grip decides how far the car slides sideways in a turn', () => {
		const drift = (grip: number) => {
			const world = quiet({
				entities: {
					car: { kind: 'vehicle', stats: { speed: 400, accel: 2000, handling: 3 }, drive: { grip } }
				}
			});
			const vehicle = ride(world, 'car');
			world.controls.axis.y = -1;
			run(world, 1.5);
			world.controls.axis.x = 1;
			let widest = 0;
			for (let t = 0; t < 1; t += 0.05) {
				world.step(0.05);
				widest = Math.max(widest, Math.abs(vehicle.drift));
			}
			return widest;
		};
		expect(drift(0.5)).toBeGreaterThan(drift(60));
	});

	it('the same vehicle without a drive setting keeps the old car physics', () => {
		const world = quiet();
		const vehicle = ride(world, 'car');
		world.controls.axis.y = 1;
		run(world, 3);
		expect(vehicle.speed).toBeCloseTo(-160, 0);
	});
});

describe('ramming', () => {
	const setup = (ram: Record<string, number>) => {
		const world = quiet({
			game: { overrunSpeed: 100 },
			entities: {
				car: {
					kind: 'vehicle',
					size: 90,
					stats: { speed: 500, accel: 5000, handling: 3, attack: 4 },
					ram
				},
				blob: { stats: { hp: 100, attack: 0, speed: 1 }, behavior: 'stand' }
			}
		});
		const vehicle = ride(world, 'car');
		vehicle.angle = 0;
		const blob = world.spawn('blob', vehicle.x + 80, vehicle.y);
		world.controls.axis.y = -1;
		run(world, 0.6);
		return blob;
	};

	it('a stronger ram does more damage', () => {
		const weak = setup({ power: 1 });
		const strong = setup({ power: 5 });
		expect(strong?.hp ?? 0).toBeLessThan(weak?.hp ?? 0);
	});

	it('a vehicle can ask for more speed before it hurts anyone', () => {
		const gentle = setup({ minSpeed: 5000 });
		expect(gentle?.hp).toBe(100);
	});
});

describe('a vehicle that takes the hits', () => {
	const setup = (absorbs: boolean) => {
		const world = quiet({
			entities: {
				hero: { kind: 'figure', stats: { hp: 100, speed: 220 } },
				car: { kind: 'vehicle', stats: { hp: 30, speed: 400, accel: 500, handling: 3 }, absorbs },
				blob: { stats: { hp: 100, attack: 10, speed: 70 }, moves: ['bite'] }
			}
		});
		const vehicle = ride(world, 'car');
		world.spawn('blob', vehicle.x + 20, vehicle.y);
		return { world, vehicle };
	};

	it('by default the figure is hurt, not the vehicle', () => {
		const { world, vehicle } = setup(false);
		run(world, 1.5);
		expect(vehicle.hp).toBe(30);
		expect(world.player.hp).toBeLessThan(100);
	});

	it('with absorbs the vehicle loses health and the figure is spared', () => {
		const { world, vehicle } = setup(true);
		run(world, 1.5);
		expect(vehicle.hp).toBeLessThan(30);
		expect(world.player.hp).toBe(100);
	});

	it('is wrecked at 0: it is gone and the figure gets out', () => {
		const { world, vehicle } = setup(true);
		const wreck = vi.fn();
		world.events.on('wreck', wreck);
		run(world, 6);
		expect(wreck).toHaveBeenCalledOnce();
		expect(world.bodies.includes(vehicle)).toBe(false);
		expect(world.riding).toBeUndefined();
		expect(world.phase).toBe('playing');
	});
});
