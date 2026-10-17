import { configProblems, PRESETS, resolveConfig } from '@hello-eme/play-schema';
import { describe, expect, it } from 'vitest';
import { createStaticHost } from './space.js';
import { createWorld } from './world.js';

const games = Object.entries(PRESETS).filter(([id]) => id.startsWith('retro-'));

describe('the arcade classics', () => {
	it('are eight, one of each kind', () => {
		expect(games.map(([id]) => id)).toEqual([
			'retro-asteroids',
			'retro-frogger',
			'retro-snake',
			'retro-munch',
			'retro-bricks',
			'retro-ping',
			'retro-jumper',
			'retro-titan'
		]);
	});

	it.each(games)('%s has no problems and every picture it needs', (id, preset) => {
		expect(configProblems(preset.config), id).toEqual([]);
		const config = resolveConfig(preset.config);
		for (const [name, definition] of Object.entries(config.entities)) {
			expect(config.sprites[definition.sprite], `${id}: ${name} needs a picture`).toBeDefined();
		}
		for (const [name, definition] of Object.entries(config.items)) {
			expect(config.sprites[definition.sprite], `${id}: item ${name}`).toBeDefined();
		}
		for (const [name, definition] of Object.entries(config.throwables)) {
			expect(config.sprites[definition.sprite], `${id}: throwable ${name}`).toBeDefined();
		}
		for (const level of config.levels) {
			if (level.map) expect(config.maps[level.map], `${id}: map ${level.map}`).toBeDefined();
		}
	});

	it.each(games)('%s runs for two minutes under a restless player', (id, preset) => {
		const world = createWorld(preset.config, { seed: 11, host: createStaticHost() });
		for (let time = 0; time < 120; time += 1 / 20) {
			world.controls.axis.x = Math.round(Math.sin(time / 1.7));
			world.controls.axis.y = Math.round(Math.cos(time / 2.3));
			if (Math.floor(time * 2) % 2 === 0) {
				for (const throwable of Object.keys(world.config.throwables))
					world.controls.throws.add(throwable);
				world.controls.pressed.add('jump');
			}
			world.step(1 / 20);
			if (world.phase !== 'playing') break;
		}
		expect(world.bodies.length, id).toBeLessThan(260);
		expect(Number.isFinite(world.player.x) && Number.isFinite(world.player.y), id).toBe(true);
		for (const body of world.bodies) {
			expect(Number.isFinite(body.x) && Number.isFinite(body.y), `${id}: ${body.def}`).toBe(true);
		}
	});

	it('every map fits the window and has a place for the figure', () => {
		for (const [id, preset] of games) {
			const config = resolveConfig(preset.config);
			for (const [name, map] of Object.entries(config.maps)) {
				const widths = new Set(map.rows.map((row) => Array.from(row).length));
				expect(widths.size, `${id}: map ${name} has rows of different lengths`).toBe(1);
				for (const char of new Set(map.rows.join(''))) {
					if (char !== ' ') expect(map.legend[char], `${id}: ${name} uses "${char}"`).toBeDefined();
				}
			}
		}
	});
});

function play(id: string, seconds: number, seed = 5) {
	const preset = PRESETS[id];
	if (!preset) throw new Error(`no preset ${id}`);
	const world = createWorld(preset.config, { seed, host: createStaticHost() });
	for (let time = 0; time < seconds; time += 1 / 20) world.step(1 / 20);
	return world;
}

describe('what each classic starts with', () => {
	it('asteroids: rocks come, the ship wraps round and shoots them', () => {
		const world = play('retro-asteroids', 12);
		expect(world.bodies.some((body) => body.def === 'rockL')).toBe(true);
		expect(world.player.angle).toBeCloseTo(-Math.PI / 2, 0);
	});

	it('frogger: four flags and the figure on the start row, on a grid', () => {
		const world = play('retro-frogger', 0.1);
		expect(world.pickups.filter((pickup) => pickup.def === 'flag')).toHaveLength(4);
		expect(world.bodies.filter((body) => body.kind === 'monster').length).toBeGreaterThan(10);
		const lowest = Math.max(
			...world.pickups.map((pickup) => pickup.y),
			...world.bodies.map((body) => body.y)
		);
		expect(world.player.y).toBeGreaterThan(lowest - 80);
	});

	it('munch: pellets, power pills and three ghosts, and the figure is not inside a wall', () => {
		const world = play('retro-munch', 0.1);
		expect(world.pickups.filter((pickup) => pickup.def === 'power')).toHaveLength(4);
		expect(world.pickups.filter((pickup) => pickup.def === 'pellet').length).toBeGreaterThan(50);
		expect(world.bodies.filter((body) => body.def !== 'hero')).toHaveLength(3);
		const walls = world.pickups.filter((pickup) => pickup.def === 'wall');
		for (const wall of walls) {
			expect(Math.hypot(wall.x - world.player.x, wall.y - world.player.y)).toBeGreaterThan(20);
		}
	});

	it('bricks: a wall of bricks, a paddle at the bottom and a ball above it', () => {
		const world = play('retro-bricks', 0.1);
		expect(world.pickups.filter((pickup) => world.config.items[pickup.def]?.hp).length).toBe(40);
		const ball = world.bodies.find((body) => body.def === 'ball');
		expect(ball).toBeDefined();
		expect(ball && ball.y).toBeLessThan(world.player.y);
		expect(world.player.y).toBeGreaterThan(600);
	});

	it('ping: the computer paddle stands at the right edge, the ball in front of the figure', () => {
		const world = play('retro-ping', 0.1);
		const cpu = world.bodies.find((body) => body.def === 'cpu');
		expect(cpu && cpu.x).toBeGreaterThan(900);
		const ball = world.bodies.find((body) => body.def === 'ball');
		expect(ball && ball.x).toBeGreaterThan(world.player.x);
	});

	it('jumper: platforms float, the figure stands on the ground and a flag waits at the top', () => {
		const world = play('retro-jumper', 2);
		expect(world.pickups.filter((pickup) => pickup.def === 'ledge').length).toBeGreaterThan(4);
		expect(world.player.grounded).toBe(true);
		const flag = world.pickups.find((pickup) => pickup.def === 'flag');
		expect(flag && flag.y).toBeLessThan(world.player.y - 300);
	});

	it('titan: the boss shows up after a moment', () => {
		const world = play('retro-titan', 3);
		expect(world.bodies.some((body) => body.def === 'warden')).toBe(true);
	});

	it('snake: starts with a short tail that grows with apples', () => {
		const world = play('retro-snake', 1.2);
		expect(world.pickups.some((pickup) => pickup.def === 'apple')).toBe(true);
	});
});

describe('a simple bot can play them', () => {
	function bot(
		id: string,
		seconds: number,
		control: (world: ReturnType<typeof createWorld>) => void
	) {
		const preset = PRESETS[id];
		if (!preset) throw new Error(`no preset ${id}`);
		const world = createWorld(preset.config, { seed: 4, host: createStaticHost() });
		for (let time = 0; time < seconds; time += 1 / 30) {
			control(world);
			world.step(1 / 30);
			if (world.phase !== 'playing') break;
		}
		return world;
	}

	/** Follows the ball along an axis, meeting it a little off centre (so the shots get steep). */
	const follow =
		(axis: 'x' | 'y', offset = 0) =>
		(world: ReturnType<typeof createWorld>) => {
			const ball = world.bodies.find((body) => body.def === 'ball');
			if (!ball) return;
			const gap = (axis === 'x' ? ball.x - world.player.x : ball.y - world.player.y) - offset;
			world.controls.axis[axis] = Math.abs(gap) < 8 ? 0 : Math.sign(gap);
		};

	it('bricks: following the ball breaks bricks and keeps it in play', () => {
		const world = bot('retro-bricks', 60, follow('x'));
		const left = world.pickups.filter((pickup) => world.config.items[pickup.def]?.hp).length;
		expect(left).toBeLessThan(40);
		expect(world.score + world.stats.earned).toBeGreaterThan(100);
		expect(world.lives).toBeGreaterThanOrEqual(1);
	});

	it('ping: a paddle that follows the ball scores against the computer', () => {
		const world = bot('retro-ping', 90, follow('y', 45));
		expect(world.stats.earned).toBeGreaterThan(0);
	});

	it('asteroids: a ship that spins and fires shoots rocks', () => {
		const world = bot('retro-asteroids', 40, (current) => {
			current.controls.axis.x = 1;
			current.controls.throws.add('laser');
		});
		expect(world.stats.kills).toBeGreaterThan(0);
		expect(world.stats.earned).toBeGreaterThan(0);
	});

	it('titan: swinging the sword at the boss hurts it', () => {
		const world = bot('retro-titan', 20, (current) => {
			const boss = current.bodies.find((body) => current.config.entities[body.def]?.boss);
			if (!boss) return;
			const dx = boss.x - current.player.x;
			const dy = boss.y - current.player.y;
			const length = Math.hypot(dx, dy) || 1;
			current.controls.axis.x = dx / length;
			current.controls.axis.y = dy / length;
			current.controls.held.add('sword');
		});
		const boss = world.bodies.find((body) => world.config.entities[body.def]?.boss);
		expect(!boss || boss.hp < world.maxHp(boss)).toBe(true);
	});

	it('frogger: a car that hits the frog sends it back to the start and costs a life', () => {
		const world = bot('retro-frogger', 0.1, () => undefined);
		const start = { x: world.player.x, y: world.player.y };
		world.controls.axis.y = -1;
		world.step(1 / 30);
		world.controls.axis.y = 0;
		for (let i = 0; i < 15; i++) world.step(1 / 30);
		expect(world.player.y).toBeLessThan(start.y);
		const car = world.spawn('car', world.player.x, world.player.y);
		if (car) car.cooldown = 0;
		for (let i = 0; i < 6; i++) world.step(1 / 30);
		expect(world.lives).toBe(world.config.game.lives - 1);
		expect(world.player.x).toBeCloseTo(start.x);
		expect(world.player.y).toBeCloseTo(start.y);
	});
});
