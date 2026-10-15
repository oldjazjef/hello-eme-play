import { PRESETS } from '@hello-eme/play-schema';
import { describe, expect, it, vi } from 'vitest';
import { createWorld } from './world.js';

/** A world that only does what the test configures: no spawn rules, no visiting car. */
const quiet = (extra: Record<string, unknown> = {}, seed = 1) =>
	createWorld(
		{
			spawns: [],
			visits: { enabled: false },
			...extra,
			entities: {
				blob: { kind: 'monster', behavior: 'stand', stats: { hp: 2, attack: 0 } },
				king: {
					kind: 'monster',
					boss: true,
					behavior: 'stand',
					stats: { hp: 100, attack: 5 }
				},
				...(extra.entities as Record<string, unknown> | undefined)
			}
		},
		{ seed }
	);

function run(world: ReturnType<typeof createWorld>, seconds: number): void {
	for (let t = 0; t < seconds; t += 0.05) world.step(0.05);
}

const count = (world: ReturnType<typeof createWorld>, def: string) =>
	world.bodies.filter((body) => body.def === def).length;

describe('wave scripts', () => {
	const spawn = (entity: string, amount: number) => [
		{ do: 'spawn', entity, count: amount, where: 'edge' }
	];
	const timeline = {
		waves: [
			{
				steps: [
					{ at: 10, do: spawn('blob', 3) },
					{ at: 25, do: spawn('blob', 8) },
					{ at: 40, do: spawn('king', 1) }
				]
			}
		]
	};

	it('runs every step at its time: three blobs at 10 s, a swarm of 8 at 25 s, the boss at 40 s', () => {
		const world = quiet(timeline);
		const at = (seconds: number) => {
			run(world, seconds - world.time);
			return [count(world, 'blob'), count(world, 'king')];
		};
		expect(at(9.5)).toEqual([0, 0]);
		expect(at(10.5)).toEqual([3, 0]);
		expect(at(24.5)).toEqual([3, 0]);
		expect(at(25.5)).toEqual([11, 0]);
		expect(at(39.5)).toEqual([11, 0]);
		expect(at(40.5)).toEqual([11, 1]);
		run(world, 30);
		expect(count(world, 'king')).toBe(1);
	});

	it('tells the event bus about each step', () => {
		const world = quiet({ waves: [{ label: 'Raid', steps: [{ at: 1 }, { at: 2 }] }] });
		const seen = vi.fn();
		world.events.on('wave', seen);
		run(world, 3);
		expect(seen.mock.calls.map(([data]) => data)).toEqual([
			{ index: 0, label: 'Raid', step: 0 },
			{ index: 0, label: 'Raid', step: 1 }
		]);
	});

	it('repeats a step: first run plus `repeat` more, `every` seconds apart', () => {
		const world = quiet({
			waves: [{ steps: [{ at: 5, every: 5, repeat: 2, do: spawn('blob', 1) }] }]
		});
		const times: number[] = [];
		world.events.on('wave', () => times.push(Math.round(world.time)));
		run(world, 60);
		expect(times).toEqual([5, 10, 15]);
		expect(count(world, 'blob')).toBe(3);
	});

	it('uses the existing actions: message, points, setView', () => {
		const world = quiet({
			waves: [
				{
					steps: [
						{
							at: 1,
							do: [
								{ do: 'message', text: 'Go!' },
								{ do: 'points', amount: 50 },
								{ do: 'setView', mode: 'side' }
							]
						}
					]
				}
			]
		});
		const messages = vi.fn();
		world.events.on('message', messages);
		run(world, 2);
		expect(messages).toHaveBeenCalledWith({ text: 'Go!' });
		expect(world.score).toBe(50);
		expect(world.view).toBe('side');
	});

	it('starts `after` seconds into each level of its range, and only there', () => {
		const levels = [
			{ goal: { type: 'survive', amount: 10 } },
			{ goal: { type: 'survive', amount: 10 } },
			{ goal: { type: 'none' } }
		];
		const world = quiet({
			levels,
			waves: [{ fromLevel: 1, toLevel: 2, after: 2, steps: [{ at: 1 }] }]
		});
		const seen: { level: number; time: number }[] = [];
		world.events.on('wave', () => seen.push({ level: world.level, time: Math.round(world.time) }));
		run(world, 40);
		expect(world.level).toBe(3);
		expect(seen).toEqual([
			{ level: 1, time: 3 },
			{ level: 2, time: 13 }
		]);
	});

	it('drops the script of a level when an action starts the next one', () => {
		const world = quiet({
			levels: [{ goal: { type: 'none' } }, { goal: { type: 'none' } }],
			waves: [
				{
					toLevel: 1,
					steps: [
						{ at: 1, do: [{ do: 'nextLevel' }] },
						{ at: 1, do: [{ do: 'points', amount: 1 }] }
					]
				}
			]
		});
		run(world, 5);
		expect(world.level).toBe(2);
		expect(world.score).toBe(0);
	});

	it('is deterministic: the same seed gives the same round', () => {
		const play = (seed: number) => {
			const world = quiet(timeline, seed);
			run(world, 45);
			return world.bodies.map((body) => [body.def, Math.round(body.x), Math.round(body.y)]);
		};
		expect(play(3)).toEqual(play(3));
		expect(play(3)).not.toEqual(play(4));
	});
});

describe('boss phases', () => {
	const phases = [
		{ below: 25, label: 'Last stand', do: [{ do: 'points', amount: 500 }] },
		{
			below: 50,
			label: 'Enraged',
			stats: { attack: 10 },
			do: [{ do: 'spawn', entity: 'blob', count: 2, where: 'edge' }]
		}
	];
	const king = (world: ReturnType<typeof createWorld>) => {
		const body = world.spawn('king', world.player.x + 400, world.player.y);
		if (!body) throw new Error('no king');
		return body;
	};

	it('fire exactly once each when health drops below their percentage', () => {
		const world = quiet({ entities: { king: { boss: true, stats: { hp: 100 }, phases } } });
		const started = vi.fn();
		world.events.on('phase', ({ index, label }) => started({ index, label }));
		const boss = king(world);
		world.damage(boss, 30, undefined);
		expect(started).not.toHaveBeenCalled();
		world.damage(boss, 25, undefined); // 45 %
		expect(started).toHaveBeenCalledTimes(1);
		expect(started).toHaveBeenLastCalledWith({ index: 1, label: 'Enraged' });
		expect(boss.stats.attack).toBeGreaterThanOrEqual(10);
		expect(count(world, 'blob')).toBe(2);
		world.damage(boss, 5, undefined); // 40 %: no second time
		world.damage(boss, 5, undefined);
		expect(started).toHaveBeenCalledTimes(1);
		expect(count(world, 'blob')).toBe(2);
		world.damage(boss, 20, undefined); // 15 %
		expect(started).toHaveBeenCalledTimes(2);
		expect(started).toHaveBeenLastCalledWith({ index: 0, label: 'Last stand' });
		expect(world.score).toBe(500);
		world.damage(boss, 10, undefined);
		expect(started).toHaveBeenCalledTimes(2);
	});

	it('all start, highest percentage first, when one hit skips several', () => {
		const world = quiet({ entities: { king: { boss: true, stats: { hp: 100 }, phases } } });
		const order: number[] = [];
		world.events.on('phase', ({ index }) => order.push(index));
		const boss = king(world);
		world.damage(boss, 90, undefined);
		expect(order).toEqual([1, 0]);
		world.damage(boss, 1, undefined);
		expect(order).toEqual([1, 0]);
	});

	it('show the label as a message and change stats for good (hp heals too)', () => {
		const world = quiet({
			entities: {
				king: {
					boss: true,
					stats: { hp: 100 },
					phases: [{ below: 50, label: 'Rise!', stats: { hp: 40 } }]
				}
			}
		});
		const messages = vi.fn();
		world.events.on('message', messages);
		const boss = king(world);
		world.damage(boss, 60, undefined);
		expect(messages).toHaveBeenCalledWith({ text: 'Rise!' });
		expect(boss.stats.hp).toBe(140);
		expect(boss.hp).toBe(80);
	});

	it('are per boss: a second boss starts its own phases', () => {
		const world = quiet({ entities: { king: { boss: true, stats: { hp: 100 }, phases } } });
		const started = vi.fn();
		world.events.on('phase', started);
		const [a, b] = [king(world), king(world)];
		world.damage(a, 60, undefined);
		world.damage(b, 60, undefined);
		expect(started).toHaveBeenCalledTimes(2);
	});

	it('do nothing for a monster that is not a boss, and never for a defeated one', () => {
		const world = quiet({
			entities: {
				imp: { kind: 'monster', stats: { hp: 100 }, phases },
				king: { boss: true, stats: { hp: 100 }, phases }
			}
		});
		const started = vi.fn();
		world.events.on('phase', started);
		const imp = world.spawn('imp', 100, 100);
		if (!imp) throw new Error('no imp');
		world.damage(imp, 60, undefined);
		expect(started).not.toHaveBeenCalled();
		const boss = king(world);
		world.damage(boss, 500, undefined);
		expect(started).not.toHaveBeenCalled();
		expect(world.bodies.includes(boss)).toBe(false);
	});
});

describe('the arcade preset', () => {
	it('plays its wave script and its boss phases', () => {
		const world = createWorld(
			{ ...PRESETS.arcade?.config, visits: { enabled: false }, spawns: [] },
			{ seed: 5 }
		);
		const waves = vi.fn();
		const phase = vi.fn();
		world.events.on('wave', waves);
		world.events.on('phase', phase);
		world.nextLevel();
		run(world, 12);
		expect(waves).toHaveBeenCalledTimes(2);
		expect(world.bodies.some((body) => body.def === 'brute')).toBe(true);
		const king = world.spawn('king', world.player.x + 500, world.player.y);
		if (!king) throw new Error('no king');
		world.damage(king, king.hp * 0.6, undefined);
		world.damage(king, king.hp * 0.7, undefined);
		expect(phase).toHaveBeenCalledTimes(2);
	});
});
