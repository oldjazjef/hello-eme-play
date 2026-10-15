import { describe, expect, it, vi } from 'vitest';
import { createStaticHost } from './space.js';
import { createWorld } from './world.js';

/** A world without waves of its own, so tests place what they need. */
const quiet = (extra: Record<string, unknown> = {}) =>
	createWorld({ spawns: [], visits: { enabled: false }, ...extra }, { seed: 1 });

function run(world: ReturnType<typeof createWorld>, seconds: number): void {
	for (let t = 0; t < seconds; t += 0.05) world.step(0.05);
}

describe('createWorld', () => {
	it('is deterministic for a seed', () => {
		const play = (seed: number) => {
			const world = createWorld({}, { seed });
			run(world, 60);
			return world.bodies.map((body) => [body.def, Math.round(body.x), Math.round(body.y)]);
		};
		expect(play(7)).toEqual(play(7));
		expect(play(7)).not.toEqual(play(8));
	});

	it('spawns waves of blobs by the spawn rules, never above max', () => {
		const world = createWorld(
			{
				spawns: [{ entity: 'blob', every: { min: 1, max: 1 }, count: { min: 3, max: 3 }, max: 5 }],
				visits: { enabled: false }
			},
			{ seed: 2 }
		);
		run(world, 30);
		const blobs = world.bodies.filter((body) => body.def === 'blob');
		expect(blobs.length).toBeGreaterThan(0);
		expect(blobs.length).toBeLessThanOrEqual(5);
	});
});

describe('moves and damage', () => {
	it('beats a blob with two punches, like the classic game, and gives its points', () => {
		const world = quiet();
		const blob = world.spawn('blob', world.player.x + 30, world.player.y);
		world.player.angle = 0;
		const kills = vi.fn();
		world.events.on('kill', kills);
		world.controls.held.add('punch');
		run(world, 1);
		expect(blob && world.bodies.includes(blob)).toBe(false);
		expect(kills).toHaveBeenCalledOnce();
		expect(world.score).toBe(100);
	});

	it('a kick takes more than a punch and pushes harder', () => {
		const world = quiet({
			entities: {
				hero: {
					kind: 'figure',
					stats: { hp: 100, attack: 1, speed: 220 },
					moves: ['punch', 'kick']
				},
				blob: { stats: { hp: 3 }, behavior: 'stand' }
			}
		});
		const blob = world.spawn('blob', world.player.x + 30, world.player.y);
		world.player.angle = 0;
		world.controls.held.add('kick');
		world.step(0.05);
		expect(blob?.hp).toBe(1);
		expect(blob?.vx).toBeGreaterThan(300);
	});

	it('blobs hurt the figure by their attack stat, and defense softens it', () => {
		const world = quiet({
			entities: {
				hero: { kind: 'figure', stats: { hp: 100, defense: 100, speed: 220 } },
				blob: { stats: { hp: 2, attack: 10, speed: 70 }, moves: ['bite'] }
			}
		});
		world.spawn('blob', world.player.x + 20, world.player.y);
		run(world, 1.5);
		expect(world.player.hp).toBe(95);
	});

	it('ends the game when the last life is gone', () => {
		const world = quiet({
			entities: {
				hero: { kind: 'figure', stats: { hp: 5, speed: 220 } },
				blob: { stats: { hp: 2, attack: 50, speed: 70 }, moves: ['bite'] }
			}
		});
		const over = vi.fn();
		world.events.on('over', over);
		world.spawn('blob', world.player.x + 20, world.player.y);
		run(world, 3);
		expect(world.phase).toBe('over');
		expect(over).toHaveBeenCalledWith({ won: false });
	});

	it('lets the figure strike page elements through the strike event', () => {
		const world = quiet();
		const strike = vi.fn();
		world.events.on('strike', strike);
		world.controls.held.add('punch');
		world.step(0.05);
		expect(strike).toHaveBeenCalledWith(expect.objectContaining({ move: 'punch', breaks: true }));
		world.broke();
		expect(world.score).toBe(10);
	});
});

describe('vehicles', () => {
	it('gets in, drives and runs monsters over', () => {
		const world = quiet();
		const car = world.spawn('car', world.player.x + 30, world.player.y);
		if (car) car.pilot = undefined;
		world.controls.pressed.add('use');
		world.step(0.05);
		expect(world.riding).toBe(car);
		const blob = world.spawn('blob', world.player.x + 150, world.player.y);
		if (blob) blob.stats.speed = 0;
		world.controls.axis.y = -1;
		run(world, 2);
		expect(world.stats.overrun).toBe(1);
		expect(world.score).toBe(100);
		world.controls.axis.y = 0;
		world.controls.pressed.add('use');
		world.step(0.05);
		expect(world.riding).toBeUndefined();
	});

	it('a visiting vehicle parks and the figure starts inside it', () => {
		const world = createWorld({ spawns: [] }, { seed: 3, lobby: true });
		const car = world.visit();
		run(world, 20);
		expect(car?.parked).toBe(true);
		world.begin();
		expect(world.phase).toBe('playing');
		expect(world.riding).toBe(car);
	});

	it('can be sent away', () => {
		const world = createWorld({ spawns: [] }, { seed: 3, lobby: true });
		world.visit();
		run(world, 20);
		world.dismissVisit();
		run(world, 20);
		expect(world.bodies).toEqual([]);
	});

	it('a stronger engine upgrade raises the top speed of vehicles', () => {
		const world = quiet({
			upgrades: { engine: { cost: 0, max: 2, stats: { speed: 60 }, vehicle: true } }
		});
		const car = world.spawn('car', 100, 100);
		world.score = 0;
		expect(world.buy('engine')).toBe(true);
		expect(car && world.stat(car, 'speed')).toBe(480);
		expect(world.spawn('car', 0, 0)?.stats.speed).toBe(480);
	});
});

describe('items, upgrades and triggers', () => {
	const config = {
		items: {
			heart: { look: 'heart', do: [{ do: 'heal', amount: 30 }] },
			rage: { do: [{ do: 'stat', stat: 'attack', amount: 3, target: 'figure', seconds: 2 }] }
		},
		upgrades: { muscles: { cost: 100, max: 2, stats: { attack: 1 } } }
	};

	it('picks items up by walking over them and runs their actions', () => {
		const world = quiet(config);
		world.player.hp = 50;
		world.dropItem('heart', world.player.x, world.player.y);
		world.step(0.05);
		expect(world.player.hp).toBe(80);
		expect(world.pickups).toEqual([]);
	});

	it('temporary stat changes run out', () => {
		const world = quiet(config);
		world.dropItem('rage', world.player.x, world.player.y);
		world.step(0.05);
		expect(world.stat(world.player, 'attack')).toBe(4);
		run(world, 2.5);
		expect(world.stat(world.player, 'attack')).toBe(1);
	});

	it('items vanish after their lifetime', () => {
		const world = quiet({ items: { star: { lifetime: 1 } } });
		world.dropItem('star', world.player.x + 400, world.player.y);
		run(world, 1.5);
		expect(world.pickups).toEqual([]);
	});

	it('buys upgrades with points, price rising per level', () => {
		const world = quiet(config);
		expect(world.buy('muscles')).toBe(false);
		world.score = 500;
		expect(world.buy('muscles')).toBe(true);
		expect(world.score).toBe(400);
		expect(world.buy('muscles')).toBe(true);
		expect(world.score).toBe(200);
		expect(world.buy('muscles')).toBe(false);
		expect(world.stat(world.player, 'attack')).toBe(3);
	});

	it('runs a trigger: a beaten monster spawns more monsters and switches the view', () => {
		const world = quiet({
			triggers: [
				{
					on: 'kill',
					only: 'blob',
					once: true,
					do: [
						{ do: 'spawn', entity: 'blob', count: 3, where: 'edge' },
						{ do: 'setView', mode: 'side' }
					]
				}
			]
		});
		const blob = world.spawn('blob', 300, 300);
		if (blob) world.damage(blob, 99, world.player);
		expect(world.bodies.filter((body) => body.def === 'blob')).toHaveLength(3);
		expect(world.view).toBe('side');
		const another = world.bodies[0];
		if (another) world.damage(another, 99, world.player);
		expect(world.bodies.filter((body) => body.def === 'blob')).toHaveLength(2);
	});

	it('respects conditions and interval triggers', () => {
		const world = quiet({
			triggers: [
				{
					on: 'interval',
					every: 5,
					conditions: [{ if: 'view', mode: 'side' }],
					do: [{ do: 'points', amount: 7 }]
				}
			]
		});
		run(world, 12);
		expect(world.score).toBe(0);
		world.setView('side');
		run(world, 12);
		expect(world.score).toBeGreaterThanOrEqual(7);
	});

	it('does not loop forever when triggers trigger each other', () => {
		const world = quiet({
			triggers: [
				{ on: 'points', do: [] },
				{ on: 'kill', do: [{ do: 'points', amount: 1 }] }
			]
		});
		const blob = world.spawn('blob', 300, 300);
		if (blob) world.damage(blob, 99, world.player);
		expect(world.score).toBe(101);
	});
});

describe('levels', () => {
	it('moves on when a goal is reached, switches the view and wins after the last level', () => {
		const world = quiet({
			levels: [
				{ label: 'One', goal: { type: 'kills', amount: 1 } },
				{ label: 'Two', view: 'side', goal: { type: 'survive', amount: 3 } }
			]
		});
		const levelUp = vi.fn();
		world.events.on('levelUp', levelUp);
		const blob = world.spawn('blob', 300, 300);
		if (blob) world.damage(blob, 99, world.player);
		world.step(0.05);
		expect(world.level).toBe(2);
		expect(world.view).toBe('side');
		run(world, 3.5);
		expect(world.phase).toBe('won');
		expect(levelUp).toHaveBeenCalledTimes(1);
	});

	it('reaches a score goal by the points earned in the level, not by the total', () => {
		const world = quiet({
			levels: [{ goal: { type: 'score', amount: 150 } }, { goal: { type: 'score', amount: 150 } }]
		});
		world.run([{ do: 'points', amount: 100 }]);
		world.step(0.05);
		expect(world.level).toBe(1);
		world.run([{ do: 'points', amount: 100 }]);
		world.step(0.05);
		expect(world.level).toBe(2);
		world.run([{ do: 'points', amount: 100 }]);
		world.step(0.05);
		expect(world.level).toBe(2);
	});

	it('scales spawned monsters per level', () => {
		const world = createWorld(
			{
				visits: { enabled: false },
				spawns: [
					{
						entity: 'blob',
						every: { min: 1, max: 1 },
						count: { min: 1, max: 1 },
						max: 1,
						fromLevel: 1,
						scalePerLevel: 100
					}
				],
				levels: [{ goal: { type: 'none' } }, { goal: { type: 'none' } }]
			},
			{ seed: 1 }
		);
		world.nextLevel();
		run(world, 1.5);
		expect(world.bodies.find((body) => body.def === 'blob')?.hp).toBe(4);
	});
});

describe('side view', () => {
	const host = () =>
		createStaticHost({
			width: 1000,
			height: 700,
			page: { width: 1000, height: 2100 },
			platforms: [{ x1: 200, x2: 600, y: 450 }]
		});

	it('lets the figure fall to the floor, jump and land on a platform', () => {
		const world = createWorld(
			{ spawns: [], visits: { enabled: false }, view: { mode: 'side' } },
			{ host: host(), seed: 1 }
		);
		run(world, 1);
		expect(world.player.grounded).toBe(true);
		const floor = world.player.y;
		world.player.x = 400;
		world.controls.pressed.add('jump');
		world.controls.axis.y = -1;
		world.step(0.05);
		world.controls.axis.y = 0;
		expect(world.player.y).toBeLessThan(floor);
		run(world, 1.5);
		expect(world.player.y).toBe(floor);
		// Standing on the platform: jump from the floor high enough with a head start.
		world.player.x = 400;
		world.player.y = 300;
		run(world, 1);
		expect(world.player.y).toBe(450);
	});

	it('switches views at runtime, keeping bodies on the ground', () => {
		const world = createWorld(
			{ spawns: [], visits: { enabled: false } },
			{ host: host(), seed: 1 }
		);
		const views = vi.fn();
		world.events.on('viewChange', views);
		world.setView('side');
		run(world, 1);
		expect(world.view).toBe('side');
		expect(world.player.grounded).toBe(true);
		world.setView('topdown');
		expect(views).toHaveBeenCalledTimes(2);
	});

	it('monsters chase along the ground', () => {
		const world = createWorld(
			{ spawns: [], visits: { enabled: false }, view: { mode: 'side' } },
			{ host: host(), seed: 1 }
		);
		const blob = world.spawn('blob', 50, 100);
		run(world, 2);
		expect(blob?.grounded).toBe(true);
		expect(blob?.x).toBeGreaterThan(100);
	});
});

describe('camera and page', () => {
	it('scrolls the page when the figure walks to the edge, and wraps at its end', () => {
		const host = createStaticHost({
			width: 1000,
			height: 700,
			page: { width: 1000, height: 2100 }
		});
		const world = createWorld({ spawns: [], visits: { enabled: false } }, { host, seed: 1 });
		world.controls.axis.y = 1;
		run(world, 3);
		expect(host.scrolled.y).toBeGreaterThan(0);
		run(world, 15);
		expect(world.player.y).toBeLessThan(2100);
		expect(world.player.y).toBeGreaterThan(0);
	});
});

describe('summary', () => {
	it('is flat numbers and texts for statistics', () => {
		const world = quiet();
		run(world, 2);
		const summary = world.summary();
		expect(summary).toMatchObject({ seconds: 2, kills: 0, level: 1, view: 'topdown' });
		expect(
			Object.values(summary).every((value) => ['number', 'string'].includes(typeof value))
		).toBe(true);
	});
});
