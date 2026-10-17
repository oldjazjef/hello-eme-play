import { describe, expect, it } from 'vitest';
import { createStaticHost } from './space.js';
import { createWorld } from './world.js';

const quiet = (extra: Record<string, unknown> = {}) =>
	createWorld({ spawns: [], visits: { enabled: false }, ...extra }, { seed: 1 });

function run(world: ReturnType<typeof createWorld>, seconds: number): void {
	for (let t = 0; t < seconds; t += 0.05) world.step(0.05);
}

const wall = { pickup: 'none', solid: true, size: 60, lifetime: 0, look: 'wall' };

describe('objects: items that stay and have properties', () => {
	it('an item that cannot be picked up stays where it is, even when walked over', () => {
		const world = quiet({
			items: { rock: { pickup: 'none', lifetime: 0 } }
		});
		world.dropItem('rock', world.player.x, world.player.y);
		run(world, 2);
		expect(world.pickups).toHaveLength(1);
		expect(world.score).toBe(0);
	});

	it('a solid object blocks the figure: it walks up to it and no further', () => {
		const world = quiet({ items: { wall } });
		world.player.angle = 0;
		world.dropItem('wall', world.player.x + 120, world.player.y);
		world.controls.axis.x = 1;
		run(world, 3);
		const object = world.pickups[0];
		expect(object && world.player.x < object.x).toBe(true);
		expect(object && object.x - world.player.x).toBeGreaterThan(30 - 1);
		expect(object && object.x - world.player.x).toBeLessThan(60);
	});

	it('it blocks monsters too, which then cannot reach the figure behind it', () => {
		const world = quiet({
			items: { wall: { ...wall, size: 400 } },
			entities: { blob: { stats: { hp: 3, attack: 5, speed: 90 }, moves: ['bite'] } }
		});
		world.dropItem('wall', world.player.x + 300, world.player.y);
		const blob = world.spawn('blob', world.player.x + 520, world.player.y);
		run(world, 3);
		expect(blob && blob.x).toBeGreaterThan(world.player.x + 300);
	});

	it('hurts by touching, by the second, and nothing happens at a distance', () => {
		const make = (near: boolean) => {
			const world = quiet({
				entities: { hero: { kind: 'figure', stats: { hp: 100, speed: 220 } } },
				items: { spikes: { pickup: 'none', size: 60, lifetime: 0, damage: 20 } }
			});
			world.dropItem('spikes', world.player.x + (near ? 0 : 300), world.player.y);
			run(world, 2);
			return world.player.hp;
		};
		expect(make(false)).toBe(100);
		const hurt = make(true);
		expect(hurt).toBeLessThan(75);
		expect(hurt).toBeGreaterThan(40);
	});

	it('negative damage heals the figure, never above its maximum', () => {
		const world = quiet({
			entities: { hero: { kind: 'figure', stats: { hp: 100, speed: 220 } } },
			items: { spring: { pickup: 'none', size: 60, lifetime: 0, damage: -30 } }
		});
		world.player.hp = 40;
		world.dropItem('spring', world.player.x, world.player.y);
		run(world, 1);
		expect(world.player.hp).toBeGreaterThan(60);
		run(world, 5);
		expect(world.player.hp).toBe(100);
	});

	it('can be aimed at monsters only: they die in it, the figure is spared', () => {
		const world = quiet({
			entities: { blob: { stats: { hp: 4, attack: 0, speed: 40 }, behavior: 'stand' } },
			items: { lava: { pickup: 'none', size: 200, lifetime: 0, damage: 10, damageWho: 'monsters' } }
		});
		world.dropItem('lava', world.player.x + 200, world.player.y);
		const blob = world.spawn('blob', world.player.x + 200, world.player.y);
		world.player.x += 200;
		run(world, 2);
		expect(blob && world.bodies.includes(blob)).toBe(false);
		expect(world.player.hp).toBe(world.maxHp(world.player));
	});

	it('hides what stands in it: the figure is covered and monsters far away lose it', () => {
		const world = quiet({
			items: { bush: { pickup: 'none', hides: true, size: 120, lifetime: 0 } },
			entities: {
				blob: { stats: { hp: 3, attack: 5, speed: 100 }, behavior: 'chase', moves: ['bite'] }
			}
		});
		world.dropItem('bush', world.player.x, world.player.y);
		const blob = world.spawn('blob', world.player.x + 400, world.player.y);
		const start = blob?.x ?? 0;
		run(world, 0.1);
		expect(world.player.covered).toBe(true);
		run(world, 2);
		// It wanders instead of marching at the figure (a chase would bring it ~190 px closer).
		expect(start - (blob?.x ?? 0)).toBeLessThan(150);
		world.player.x += 600;
		run(world, 0.1);
		expect(world.player.covered).toBe(false);
	});

	it('monsters inside it are covered too', () => {
		const world = quiet({
			items: { bush: { pickup: 'none', hides: true, size: 120, lifetime: 0 } },
			entities: { blob: { stats: { hp: 3, attack: 0, speed: 0 }, behavior: 'stand' } }
		});
		world.dropItem('bush', world.player.x + 300, world.player.y);
		const blob = world.spawn('blob', world.player.x + 300, world.player.y);
		run(world, 0.1);
		expect(blob?.covered).toBe(true);
	});

	it('rules can scatter objects over the page from the start, the same for a seed', () => {
		const make = () =>
			createWorld(
				{
					spawns: [],
					visits: { enabled: false },
					items: { tree: { ...wall, look: 'bush' } },
					itemSpawns: [{ item: 'tree', initial: 12, max: 1, every: { min: 999, max: 999 } }]
				},
				{ seed: 3, host: createStaticHost() }
			);
		const a = make();
		const b = make();
		expect(a.pickups).toHaveLength(12);
		expect(a.pickups.map((p) => [p.x, p.y])).toEqual(b.pickups.map((p) => [p.x, p.y]));
		for (const p of a.pickups) {
			expect(Math.hypot(p.x - a.player.x, p.y - a.player.y)).toBeGreaterThanOrEqual(160);
		}
	});

	it('a vehicle is stopped by a solid object too, and the figure stays in it', () => {
		const world = quiet({ items: { wall } });
		const car = world.spawn('car', world.player.x, world.player.y);
		if (car) {
			car.pilot = undefined;
			car.angle = 0;
		}
		world.use();
		world.dropItem('wall', world.player.x + 200, world.player.y);
		world.controls.axis.y = -1;
		run(world, 3);
		expect(world.riding).toBeDefined();
		const object = world.pickups[0];
		expect(object && world.riding && world.riding.x < object.x).toBe(true);
		expect(world.player.x).toBe(world.riding?.x);
	});
});
