import { describe, expect, it, vi } from 'vitest';
import { createStaticHost } from './space.js';
import { createWorld } from './world.js';

/** A world without waves of its own, so tests place what they need. */
const quiet = (extra: Record<string, unknown> = {}, host = createStaticHost()) =>
	createWorld({ spawns: [], visits: { enabled: false }, ...extra }, { seed: 1, host });

function run(world: ReturnType<typeof createWorld>, seconds: number): void {
	for (let t = 0; t < seconds; t += 0.05) world.step(0.05);
}

const bomb = {
	speed: 0,
	fuse: 1,
	radius: 100,
	power: 5,
	push: 0,
	ammo: 3,
	maxAmmo: 5,
	cooldown: 0
};
const standing = { blob: { stats: { hp: 4, attack: 0, speed: 70 }, behavior: 'stand' } };

describe('throwables', () => {
	it('a dropped bomb goes off after its fuse, hurts monsters in the radius and spares those outside', () => {
		const world = quiet({ throwables: { bomb }, entities: standing });
		const near = world.spawn('blob', world.player.x + 60, world.player.y);
		const far = world.spawn('blob', world.player.x + 300, world.player.y);
		const exploded = vi.fn();
		world.events.on('explode', exploded);
		expect(world.throwItem('bomb')).toBe(true);
		run(world, 0.5);
		expect(exploded).not.toHaveBeenCalled();
		run(world, 0.7);
		expect(exploded).toHaveBeenCalledOnce();
		expect(near && world.bodies.includes(near)).toBe(false);
		expect(far?.hp).toBe(4);
		expect(world.projectiles).toHaveLength(0);
	});

	it('uses up its ammo, waits for the cooldown and can be refilled up to the maximum', () => {
		const world = quiet({ throwables: { bomb: { ...bomb, cooldown: 1 } } });
		expect(world.ammoOf('bomb')).toBe(3);
		expect(world.throwItem('bomb')).toBe(true);
		expect(world.throwItem('bomb')).toBe(false);
		run(world, 1.1);
		expect(world.throwItem('bomb')).toBe(true);
		expect(world.ammoOf('bomb')).toBe(1);
		world.run([{ do: 'ammo', throwable: 'bomb', amount: 99 }]);
		expect(world.ammoOf('bomb')).toBe(5);
		world.run([{ do: 'ammo', throwable: 'bomb', amount: -99 }]);
		expect(world.ammoOf('bomb')).toBe(0);
		run(world, 1.1);
		expect(world.throwItem('bomb')).toBe(false);
	});

	it('unlimited throwables never run out', () => {
		const world = quiet({ throwables: { rock: { ...bomb, unlimited: true, ammo: 0 } } });
		for (let i = 0; i < 4; i++) expect(world.throwItem('rock')).toBe(true);
		expect(world.ammoOf('rock')).toBe(Infinity);
	});

	it('is only usable where it says: on foot or in a vehicle', () => {
		const world = quiet({
			throwables: { bomb: { ...bomb, where: 'vehicle' }, rock: { ...bomb, where: 'foot' } }
		});
		expect(world.throwItem('bomb')).toBe(false);
		expect(world.throwItem('rock')).toBe(true);
		const car = world.spawn('car', world.player.x, world.player.y);
		if (car) car.pilot = undefined;
		world.use();
		expect(world.riding).toBeDefined();
		expect(world.throwItem('bomb')).toBe(true);
		expect(world.throwItem('rock')).toBe(false);
	});

	it('a thrown rock without a fuse goes off on the first monster it touches', () => {
		const world = quiet({
			throwables: {
				rock: { speed: 600, fuse: 0, radius: 0, power: 20, push: 0, ammo: 1, size: 20 }
			},
			entities: standing
		});
		world.player.angle = 0;
		const blob = world.spawn('blob', world.player.x + 150, world.player.y);
		expect(world.throwItem('rock')).toBe(true);
		run(world, 1);
		expect(blob && world.bodies.includes(blob)).toBe(false);
	});

	it('flies about speed ÷ 3 pixels from above and then goes off where it lies', () => {
		const world = quiet({
			throwables: { rock: { speed: 600, fuse: 0, radius: 40, power: 1, ammo: 1 } }
		});
		world.player.angle = 0;
		const start = world.player.x;
		const hit = vi.fn();
		world.events.on('explode', hit);
		world.throwItem('rock');
		run(world, 3);
		expect(hit).toHaveBeenCalledOnce();
		const { x } = hit.mock.calls[0]?.[0] as { x: number };
		expect(x - start).toBeGreaterThan(120);
		expect(x - start).toBeLessThan(260);
	});

	it('a mine dropped on the spot waits and only a monster sets it off', () => {
		const world = quiet({
			throwables: { mine: { speed: 0, fuse: 0, radius: 60, power: 20, push: 0, ammo: 1 } },
			entities: standing
		});
		const hit = vi.fn();
		world.events.on('explode', hit);
		world.throwItem('mine');
		run(world, 3);
		expect(hit).not.toHaveBeenCalled();
		world.player.x += 300;
		const blob = world.spawn('blob', world.projectiles[0]?.x ?? 0, world.projectiles[0]?.y ?? 0);
		run(world, 0.2);
		expect(hit).toHaveBeenCalledOnce();
		expect(blob && world.bodies.includes(blob)).toBe(false);
	});

	it('only hurts the figure when it is told to', () => {
		const make = (hurtsFigure: boolean) => {
			const world = quiet({
				entities: { hero: { kind: 'figure', stats: { hp: 100, speed: 220, attack: 1 } } },
				throwables: { bomb: { ...bomb, fuse: 0.2, hurtsFigure, power: 10 } }
			});
			world.throwItem('bomb');
			run(world, 0.5);
			return world.player.hp;
		};
		expect(make(false)).toBe(100);
		expect(make(true)).toBeLessThan(100);
	});

	it('the blast cracks page elements through the strike event', () => {
		const world = quiet({ throwables: { bomb: { ...bomb, fuse: 0.1 } } });
		const strikes = vi.fn();
		world.events.on('strike', strikes);
		world.throwItem('bomb');
		run(world, 0.3);
		expect(strikes).toHaveBeenCalled();
		const quietWorld = quiet({ throwables: { bomb: { ...bomb, fuse: 0.1, breaks: false } } });
		const none = vi.fn();
		quietWorld.events.on('strike', none);
		quietWorld.throwItem('bomb');
		run(quietWorld, 0.3);
		expect(none).not.toHaveBeenCalled();
	});

	it('in the side view it falls to the ground, and bounces with a fuse', () => {
		const host = createStaticHost();
		const world = quiet(
			{
				view: { mode: 'side' },
				throwables: { bomb: { ...bomb, speed: 400, fuse: 5, bounce: 0.5 } }
			},
			host
		);
		world.player.angle = 0;
		world.throwItem('bomb');
		const bomber = world.projectiles[0];
		let bounced = false;
		for (let t = 0; t < 2; t += 0.02) {
			world.step(0.02);
			if (bomber && bomber.grounded === false && bomber.fall < 0 && t > 0.3) bounced = true;
		}
		expect(bounced).toBe(true);
		expect(bomber?.y).toBeLessThanOrEqual(680 + 1);
		expect(bomber?.x ?? 0).toBeGreaterThan(world.player.x);
	});

	it('from a vehicle it can be dropped out of the back', () => {
		const world = quiet({
			throwables: {
				mine: { speed: 0, fuse: 0, direction: 'back', where: 'vehicle', ammo: 2, radius: 50 }
			}
		});
		const car = world.spawn('car', world.player.x, world.player.y);
		if (car) car.pilot = undefined;
		world.use();
		const riding = world.riding;
		expect(riding).toBeDefined();
		if (riding) riding.angle = 0;
		world.throwItem('mine');
		const mine = world.projectiles[0];
		expect(mine && riding && mine.x < riding.x).toBe(true);
	});

	it('counts what was thrown in the summary', () => {
		const world = quiet({ throwables: { bomb: { ...bomb, cooldown: 0 } } });
		world.throwItem('bomb');
		world.throwItem('bomb');
		expect(world.summary()).toMatchObject({ thrown: 2, bomb: 2 });
	});

	it('is thrown by the controls too', () => {
		const world = quiet({ throwables: { bomb } });
		world.controls.throws.add('bomb');
		world.step(0.05);
		expect(world.projectiles).toHaveLength(1);
		expect(world.controls.throws.size).toBe(0);
	});
});

describe('monsters that throw', () => {
	const thrower = {
		kind: 'monster',
		stats: { hp: 5, attack: 3, speed: 70 },
		behavior: 'stand',
		moves: [],
		throws: [{ throwable: 'bomb', range: 500, cooldown: 2 }]
	};
	const bombs = { bomb: { ...bomb, speed: 500, fuse: 0.5, radius: 90, power: 10 } };
	const make = () =>
		quiet({
			entities: {
				hero: { kind: 'figure', stats: { hp: 100, attack: 1, speed: 220 } },
				thrower,
				blob: standing.blob
			},
			throwables: bombs
		});

	it('throws at the figure when it is in range, then waits for the cooldown', () => {
		const world = make();
		world.spawn('thrower', world.player.x + 300, world.player.y);
		const thrown = vi.fn();
		world.events.on('throw', thrown);
		run(world, 2.2);
		expect(thrown).toHaveBeenCalledOnce();
		run(world, 1);
		expect(thrown).toHaveBeenCalledOnce();
		run(world, 1.5);
		expect(thrown.mock.calls.length).toBeGreaterThan(1);
	});

	it('does not throw from beyond its range', () => {
		const world = make();
		world.spawn('thrower', world.player.x + 600, world.player.y);
		run(world, 3);
		expect(world.projectiles).toHaveLength(0);
	});

	it("the blast hurts the figure and spares other monsters, with the thrower's attack", () => {
		const world = make();
		world.spawn('thrower', world.player.x + 150, world.player.y);
		const other = world.spawn('blob', world.player.x + 20, world.player.y);
		run(world, 3);
		expect(world.player.hp).toBeLessThan(100);
		expect(other?.hp).toBe(4);
	});

	it("is not counted as the figure's own throws", () => {
		const world = make();
		world.spawn('thrower', world.player.x + 150, world.player.y);
		const thrown = vi.fn();
		world.events.on('throw', thrown);
		run(world, 2.5);
		expect(thrown).toHaveBeenCalled();
		expect(world.stats.thrown).toBe(0);
		expect(world.ammoOf('bomb')).toBe(3);
	});
});
