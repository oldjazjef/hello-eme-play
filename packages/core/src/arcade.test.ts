import { describe, expect, it, vi } from 'vitest';
import { createStaticHost } from './space.js';
import { createWorld } from './world.js';

/** A world without waves of its own, so tests place what they need. */
const quiet = (extra: Record<string, unknown> = {}, host = createStaticHost()) =>
	createWorld({ spawns: [], visits: { enabled: false }, ...extra }, { seed: 3, host });

function run(world: ReturnType<typeof createWorld>, seconds: number, step = 0.05): void {
	for (let t = 0; t < seconds; t += step) world.step(step);
}

const screen = { arena: 'screen', wrap: false };
const hero = (stats: Record<string, number> = {}) => ({
	hero: { kind: 'figure', stats: { hp: 10, attack: 5, speed: 200, ...stats }, size: 40 }
});

describe('spaceship control', () => {
	const ship = {
		control: 'ship',
		ship: { thrust: 400, turn: 3, maxSpeed: 300, drag: 0 },
		...screen
	};

	it('turns with left and right, pushes with up and keeps drifting when the push stops', () => {
		const world = quiet({ game: ship, entities: hero() });
		expect(world.player.angle).toBeCloseTo(-Math.PI / 2);
		const y = world.player.y;
		world.controls.axis.y = -1;
		run(world, 0.5);
		world.controls.axis.y = 0;
		expect(world.player.y).toBeLessThan(y);
		const drifting = world.player.y;
		const speed = Math.hypot(world.player.vx, world.player.vy);
		expect(speed).toBeGreaterThan(100);
		run(world, 0.5);
		// Inertia: no push, no drag, so it keeps its speed and goes on.
		expect(world.player.y).toBeLessThan(drifting - 50);
		expect(Math.hypot(world.player.vx, world.player.vy)).toBeCloseTo(speed, 0);
		world.controls.axis.x = 1;
		const angle = world.player.angle;
		run(world, 0.5);
		expect(world.player.angle).toBeGreaterThan(angle + 1);
	});

	it('never goes faster than its top speed, and brakes with down', () => {
		const world = quiet({
			game: { ...ship, ship: { ...ship.ship, thrust: 5000 } },
			entities: hero()
		});
		world.controls.axis.y = -1;
		run(world, 0.2);
		expect(Math.hypot(world.player.vx, world.player.vy)).toBeLessThanOrEqual(300.01);
		world.controls.axis.y = 1;
		run(world, 2);
		expect(Math.hypot(world.player.vx, world.player.vy)).toBeLessThan(5);
	});

	it('stays in the window (the page does not scroll)', () => {
		const host = createStaticHost();
		const world = quiet({ game: ship, entities: hero() }, host);
		world.controls.axis.y = -1;
		run(world, 10);
		expect(world.player.y).toBeGreaterThanOrEqual(20);
		expect(host.scrolled).toEqual({ x: 0, y: 0 });
	});

	it('wraps round the window when the game says so', () => {
		const world = quiet({ game: { ...ship, wrap: true }, entities: hero() });
		world.controls.axis.y = -1;
		let wrapped = false;
		for (let i = 0; i < 400 && !wrapped; i++) {
			const before = world.player.y;
			world.step(0.05);
			wrapped = world.player.y > before + 100;
		}
		expect(wrapped).toBe(true);
	});

	it('shoots along its heading and an asteroid splits into smaller ones', () => {
		const world = quiet({
			game: ship,
			entities: {
				...hero(),
				big: {
					kind: 'monster',
					behavior: 'drift',
					heading: 0,
					size: 70,
					stats: { hp: 1, attack: 0, speed: 0 },
					moves: [],
					split: { into: 'small', count: { min: 2, max: 2 }, faster: 50 }
				},
				small: {
					kind: 'monster',
					behavior: 'drift',
					size: 30,
					stats: { hp: 1, attack: 0, speed: 100 },
					moves: []
				}
			},
			throwables: {
				laser: {
					look: 'bullet',
					speed: 900,
					fuse: 0,
					radius: 0,
					power: 5,
					size: 12,
					unlimited: true,
					cooldown: 0
				}
			}
		});
		const rock = world.spawn('big', world.player.x, world.player.y - 150);
		const split = vi.fn();
		world.events.on('split', split);
		expect(world.throwItem('laser')).toBe(true);
		run(world, 0.6);
		expect(rock && world.bodies.includes(rock)).toBe(false);
		expect(world.bodies.filter((body) => body.def === 'small')).toHaveLength(2);
		expect(split).toHaveBeenCalledOnce();
		for (const child of world.bodies) expect(child.stats.speed).toBeCloseTo(150);
	});
});

describe('drifting monsters', () => {
	it('fly straight in their direction and come back in on the other side', () => {
		const world = quiet({
			game: screen,
			entities: {
				...hero(),
				car: {
					kind: 'monster',
					behavior: 'drift',
					heading: 0,
					size: 40,
					stats: { hp: 1, speed: 400 },
					moves: []
				}
			}
		});
		const car = world.spawn('car', 900, 300);
		let wrapped = false;
		for (let i = 0; i < 40 && !wrapped; i++) {
			const x = car?.x ?? 0;
			world.step(0.05);
			expect(car?.y).toBeCloseTo(300);
			wrapped = (car?.x ?? 0) < x;
		}
		expect(wrapped).toBe(true);
	});
});

describe('grid control', () => {
	const grid = { control: 'grid', arena: 'screen', wrap: false, grid: { cell: 50, auto: false } };

	it('hops one cell at a time and ends in the middle of a cell', () => {
		const world = quiet({ game: grid, entities: hero({ speed: 250 }) });
		const { x, y } = world.player;
		world.controls.axis.x = 1;
		run(world, 0.05);
		world.controls.axis.x = 0;
		run(world, 0.5);
		expect(world.player.x - x).toBeCloseTo(50);
		expect(world.player.y).toBeCloseTo(y);
		world.controls.axis.y = -1;
		run(world, 0.05);
		world.controls.axis.y = 0;
		run(world, 0.5);
		expect(world.player.y - y).toBeCloseTo(-50);
	});

	it('goes on by itself with auto and stops in front of a wall', () => {
		const world = quiet({
			game: { ...grid, grid: { cell: 50, auto: true } },
			entities: hero({ speed: 250 }),
			items: { wall: { pickup: 'none', solid: true, box: true, size: 50, lifetime: 0 } }
		});
		const start = world.player.x;
		world.dropItem('wall', start + 50 * 4, world.player.y);
		world.controls.axis.x = 1;
		run(world, 0.05);
		world.controls.axis.x = 0;
		run(world, 3);
		expect(world.player.x - start).toBeCloseTo(150, 0);
	});

	it('crashes into a wall when the game says so, back to the start with one life less', () => {
		const world = quiet({
			game: { ...grid, lives: 3, respawn: 'hit', grid: { cell: 50, auto: true, crash: true } },
			entities: hero({ speed: 250 }),
			items: { wall: { pickup: 'none', solid: true, box: true, size: 50, lifetime: 0 } }
		});
		const start = { x: world.player.x, y: world.player.y };
		world.dropItem('wall', start.x + 50 * 3, start.y);
		world.controls.axis.x = 1;
		run(world, 0.05);
		world.controls.axis.x = 0;
		run(world, 1.5);
		expect(world.lives).toBe(2);
		expect(world.player.x).toBeCloseTo(start.x);
		expect(world.player.y).toBeCloseTo(start.y);
	});

	it('a tail grows and running into it costs a life', () => {
		const world = quiet({
			game: {
				...grid,
				lives: 2,
				respawn: 'hit',
				grid: { cell: 50, auto: true, crash: true, tail: true }
			},
			entities: hero({ speed: 500, hp: 5 })
		});
		world.run([{ do: 'grow', amount: 10 }]);
		// One cell per hop; going round in a small loop ends in the tail.
		const hop = (x: number, y: number) => {
			world.controls.axis.x = x;
			world.controls.axis.y = y;
			const { x: from, y: top } = world.player;
			for (
				let i = 0;
				i < 100 && Math.hypot(world.player.x - from, world.player.y - top) < 49.9;
				i++
			) {
				world.step(0.01);
			}
		};
		for (let round = 0; round < 3; round++) {
			hop(1, 0);
			hop(0, 1);
			hop(-1, 0);
			hop(0, -1);
		}
		expect(world.lives).toBe(1);
	});
});

describe('maps', () => {
	const map = {
		maps: {
			maze: {
				cell: 50,
				rows: ['#####', '#P.o#', '#.#G#', '#####'],
				legend: {
					'#': { item: 'wall' },
					'.': { item: 'pellet' },
					o: { item: 'power' },
					P: { start: true },
					G: { entity: 'ghost' }
				}
			}
		},
		levels: [{ map: 'maze', goal: { type: 'clear' } }],
		game: { control: 'grid', arena: 'screen', wrap: false, grid: { cell: 50, auto: true } },
		items: {
			wall: { pickup: 'none', solid: true, box: true, size: 50, lifetime: 0 },
			pellet: { size: 12, lifetime: 0, required: true, do: [{ do: 'points', amount: 10 }] },
			power: { size: 20, lifetime: 0, required: true, do: [{ do: 'scare', seconds: 5 }] }
		},
		entities: {
			...hero({ speed: 200 }),
			ghost: {
				kind: 'monster',
				behavior: 'ghost',
				respawn: 1,
				size: 36,
				stats: { hp: 1, attack: 1, speed: 120 },
				moves: ['bite'],
				reward: { points: 200 }
			}
		}
	};

	it('puts walls, pellets, a ghost and the figure where the characters are', () => {
		const world = quiet(map);
		expect(world.pickups.filter((pickup) => pickup.def === 'wall')).toHaveLength(15);
		expect(world.pickups.filter((pickup) => pickup.def === 'pellet')).toHaveLength(2);
		expect(world.bodies.filter((body) => body.def === 'ghost')).toHaveLength(1);
		const wall = world.pickups.find((pickup) => pickup.def === 'wall');
		const start = world.pickups.filter((pickup) => pickup.def === 'wall').map((pickup) => pickup.x);
		expect(wall).toBeDefined();
		// The figure stands in the second cell of the second row.
		expect(world.player.x).toBeGreaterThan(Math.min(...start));
	});

	it('scares the ghosts, lets the figure eat one, which comes back later', () => {
		const world = quiet({
			...map,
			entities: {
				...map.entities,
				ghost: { ...map.entities.ghost, stats: { hp: 1, attack: 1, speed: 0 } }
			}
		});
		const ghost = world.bodies.find((body) => body.def === 'ghost');
		expect(ghost).toBeDefined();
		world.run([{ do: 'scare', seconds: 5 }]);
		expect(world.scared).toBe(true);
		if (ghost) {
			ghost.x = world.player.x + 10;
			ghost.y = world.player.y;
		}
		const before = world.score;
		run(world, 0.1);
		expect(world.bodies.some((body) => body.def === 'ghost')).toBe(false);
		expect(world.score).toBe(before + 200);
		run(world, 1.2);
		expect(world.bodies.some((body) => body.def === 'ghost')).toBe(true);
		run(world, 5);
		expect(world.scared).toBe(false);
	});

	it('is won once every required item is gone', () => {
		const world = quiet({
			...map,
			entities: {
				...map.entities,
				ghost: { ...map.entities.ghost, kind: 'monster', stats: { hp: 1, attack: 0, speed: 0 } }
			}
		});
		for (const pickup of [...world.pickups]) {
			if (world.config.items[pickup.def]?.required)
				world.pickups.splice(world.pickups.indexOf(pickup), 1);
		}
		world.step(0.05);
		expect(world.phase).toBe('won');
	});

	it('a ghost takes the turn that brings it closer to the figure', () => {
		const world = quiet({
			game: { control: 'grid', arena: 'screen', wrap: false, grid: { cell: 50 } },
			entities: {
				...hero(),
				ghost: {
					kind: 'monster',
					behavior: 'ghost',
					size: 36,
					stats: { hp: 1, attack: 0, speed: 200 },
					moves: []
				}
			}
		});
		const ghost = world.spawn('ghost', world.player.x - 250, world.player.y);
		const gap = Math.abs((ghost?.x ?? 0) - world.player.x);
		run(world, 0.5);
		expect(Math.abs((ghost?.x ?? 0) - world.player.x)).toBeLessThan(gap);
	});
});

describe('bouncing balls', () => {
	const base = {
		game: { control: 'slide', slideAxis: 'x', arena: 'screen', wrap: false, pit: 'bottom' },
		entities: {
			hero: { kind: 'figure', shape: 'bar', size: 120, stats: { hp: 5, attack: 1, speed: 400 } },
			ball: {
				kind: 'monster',
				behavior: 'bounce',
				size: 20,
				stats: { hp: 99, speed: 400 },
				moves: []
			}
		},
		items: {
			brick: {
				pickup: 'none',
				solid: true,
				box: true,
				aspect: 2,
				size: 60,
				lifetime: 0,
				hp: 2,
				required: true,
				do: [{ do: 'points', amount: 5 }]
			},
			stone: { pickup: 'none', solid: true, lifetime: 0, size: 60 }
		}
	};

	it('the paddle stays at the bottom of the window and slides sideways', () => {
		const world = quiet(base);
		const y = world.player.y;
		world.controls.axis.x = 1;
		run(world, 0.2);
		expect(world.player.y).toBeCloseTo(y);
		expect(world.player.y).toBeGreaterThan(600);
		const x = world.player.x;
		run(world, 0.2);
		expect(world.player.x).toBeGreaterThan(x);
		world.controls.axis.y = 1;
		run(world, 0.2);
		expect(world.player.y).toBeCloseTo(y);
	});

	it('a ball bounces off the walls of the window and keeps its speed', () => {
		const world = quiet({ ...base, game: { ...base.game, pit: 'none' } });
		const ball = world.spawn('ball', 500, 300);
		if (ball) ball.angle = (30 * Math.PI) / 180;
		for (let i = 0; i < 400; i++) {
			world.step(0.02);
			expect(ball?.x).toBeGreaterThanOrEqual(0);
			expect(ball?.x).toBeLessThanOrEqual(1000);
			expect(ball?.y).toBeGreaterThanOrEqual(0);
			expect(ball?.y).toBeLessThanOrEqual(700);
		}
	});

	it('the paddle sends the ball back up, flatter the farther from the middle it hits', () => {
		const world = quiet(base);
		const ball = world.spawn('ball', world.player.x + 50, world.player.y - 60);
		if (ball) ball.angle = Math.PI / 2;
		run(world, 0.3);
		const vy = Math.sin(ball?.angle ?? 0);
		const vx = Math.cos(ball?.angle ?? 0);
		expect(vy).toBeLessThan(0);
		expect(vx).toBeGreaterThan(0.3);
		const middle = quiet(base);
		const centred = middle.spawn('ball', middle.player.x, middle.player.y - 60);
		if (centred) centred.angle = Math.PI / 2;
		run(middle, 0.3);
		expect(Math.abs(Math.cos(centred?.angle ?? 0))).toBeLessThan(0.1);
	});

	it('a brick takes its hits, then goes and runs its effect; a stone never breaks', () => {
		const world = quiet(base);
		const brick = world.dropItem('brick', 500, 200);
		const stone = world.dropItem('stone', 800, 200);
		const ball = world.spawn('ball', 500, 320);
		if (ball) ball.angle = -Math.PI / 2;
		const before = world.score;
		run(world, 0.5);
		expect(brick?.hp).toBe(1);
		expect(ball?.angle).toBeGreaterThan(0);
		if (ball) ball.angle = -Math.PI / 2;
		if (ball) ball.y = 320;
		run(world, 0.5);
		expect(world.pickups.includes(brick as never)).toBe(false);
		expect(world.score).toBe(before + 5);
		if (ball) {
			ball.x = 800;
			ball.y = 320;
			ball.angle = -Math.PI / 2;
		}
		run(world, 0.6);
		expect(world.pickups.includes(stone as never)).toBe(true);
		expect(stone?.hp).toBe(0);
	});

	it('a ball through the pit is lost: the event says where and triggers can answer', () => {
		const world = quiet({
			...base,
			triggers: [{ on: 'lost', only: 'bottom', do: [{ do: 'points', amount: 7 }] }]
		});
		world.player.x = 100;
		const ball = world.spawn('ball', 800, 600);
		if (ball) ball.angle = Math.PI / 2;
		const lost = vi.fn();
		world.events.on('lost', lost);
		run(world, 1);
		expect(lost).toHaveBeenCalledWith(expect.objectContaining({ edge: 'bottom' }));
		expect(world.bodies.includes(ball as never)).toBe(false);
		expect(world.score).toBe(7);
	});

	it('spawns a ball in front of the figure, flying where it faces', () => {
		const world = quiet(base);
		world.run([{ do: 'spawn', entity: 'ball', count: 1, where: 'figure' }]);
		const ball = world.bodies.find((body) => body.def === 'ball');
		expect(ball && ball.y).toBeLessThan(world.player.y);
		expect(Math.sin(ball?.angle ?? 0)).toBeLessThan(-0.8);
	});

	it('a paddle of its own follows the ball along its edge', () => {
		const world = quiet({
			...base,
			entities: {
				...base.entities,
				cpu: {
					kind: 'monster',
					behavior: 'paddle',
					heading: 180,
					shape: 'bar',
					size: 120,
					stats: { hp: 99, speed: 300 },
					moves: []
				}
			}
		});
		const cpu = world.spawn('cpu', 900, 100);
		const ball = world.spawn('ball', 500, 500);
		if (ball) ball.angle = -Math.PI / 4;
		run(world, 0.5);
		expect(cpu?.x).toBe(900);
		expect(Math.abs((cpu?.y ?? 0) - (ball?.y ?? 0))).toBeLessThan(250);
	});
});

describe('platform games', () => {
	const side = {
		view: { mode: 'side', airJumps: 1, gravity: 1800, jumpSpeed: 760 },
		game: { stomp: 3 },
		entities: {
			...hero(),
			walker: {
				kind: 'monster',
				behavior: 'patrol',
				size: 40,
				stats: { hp: 3, attack: 1, speed: 100 },
				moves: ['bite']
			}
		},
		items: {
			ledge: { pickup: 'none', platform: true, box: true, aspect: 5, size: 200, lifetime: 0 },
			spring: {
				pickup: 'none',
				size: 30,
				lifetime: 0,
				every: 0.5,
				do: [{ do: 'launch', speed: 1300 }]
			}
		}
	};

	it('jumps once more in the air, but only as often as allowed', () => {
		const world = quiet(side);
		world.step(0.05);
		world.controls.pressed.add('jump');
		world.step(0.05);
		const first = world.player.fall;
		expect(first).toBeLessThan(-500);
		run(world, 0.3);
		const slowing = world.player.fall;
		expect(slowing).toBeGreaterThan(first);
		world.controls.pressed.add('jump');
		world.step(0.05);
		expect(world.player.fall).toBeLessThan(first + 1);
		run(world, 0.2);
		const falling = world.player.fall;
		world.controls.pressed.add('jump');
		world.step(0.05);
		// No third jump: gravity just goes on.
		expect(world.player.fall).toBeGreaterThan(falling);
	});

	it('stands on a platform item and is blocked by nothing from below', () => {
		const world = quiet(side);
		const floor = world.player.y;
		const ledge = world.dropItem('ledge', world.player.x, floor - 150);
		world.player.y = (ledge?.y ?? 0) - 60;
		world.player.fall = 0;
		run(world, 1);
		expect(world.player.y).toBeLessThan(floor - 100);
		expect(world.player.grounded).toBe(true);
		expect(ledge?.y).toBeCloseTo(floor - 150);
	});

	it('a walker turns round at the end of the platform and at the window', () => {
		const world = quiet(side);
		const floor = world.player.y;
		const ledge = world.dropItem('ledge', 500, floor - 150);
		const walker = world.spawn('walker', 500, floor - 150 - 20);
		if (walker) {
			walker.y = (ledge?.y ?? 0) - 20;
			walker.angle = 0;
		}
		let turned = false;
		for (let i = 0; i < 80 && !turned; i++) {
			world.step(0.05);
			turned = (walker?.angle ?? 0) > 3;
		}
		expect(turned).toBe(true);
		expect(walker?.x).toBeLessThan(620);
		expect(walker?.y).toBeCloseTo((ledge?.y ?? 0) - 20, 0);
	});

	it('landing on a monster hurts it for the stomp factor and bounces the figure', () => {
		const world = quiet(side);
		const floor = world.player.y;
		const walker = world.spawn('walker', world.player.x, floor);
		const stomped = vi.fn();
		world.events.on('stomp', stomped);
		world.player.y = floor - 60;
		world.player.fall = 400;
		run(world, 0.2);
		expect(stomped).toHaveBeenCalled();
		expect(walker && world.bodies.includes(walker)).toBe(false);
		expect(world.player.hp).toBe(10);
		expect(world.player.fall).toBeLessThan(0);
	});

	it('a spring object launches the figure up', () => {
		const world = quiet(side);
		world.dropItem('spring', world.player.x, world.player.y);
		run(world, 0.2);
		expect(world.player.y).toBeLessThan(world.player.y + 1);
		expect(world.player.fall).toBeLessThan(-500);
	});

	it('with respawn on death only a lost life sends the figure back', () => {
		const world = quiet({ ...side, game: { respawn: 'death', lives: 3 } });
		world.player.x = 300;
		world.run([{ do: 'checkpoint' }]);
		world.player.x = 700;
		world.run([{ do: 'heal', amount: -3 }]);
		expect(world.lives).toBe(3);
		expect(world.player.x).toBeCloseTo(700);
		world.run([{ do: 'heal', amount: -100 }]);
		expect(world.lives).toBe(2);
		expect(world.player.x).toBeCloseTo(300);
	});

	it('a checkpoint becomes the starting place', () => {
		const world = quiet({ ...side, game: { respawn: 'hit', lives: 3 } });
		world.player.x = 300;
		world.run([{ do: 'checkpoint' }]);
		world.player.x = 700;
		world.run([{ do: 'heal', amount: -1 }]);
		expect(world.lives).toBe(2);
		expect(world.player.x).toBeCloseTo(300);
	});
});

describe('boss fights', () => {
	const boss = (attacks: unknown[], extra: Record<string, unknown> = {}) => ({
		entities: {
			...hero(),
			boss: {
				kind: 'monster',
				boss: true,
				behavior: 'stand',
				size: 90,
				stats: { hp: 100, attack: 5, speed: 100 },
				moves: [],
				attacks,
				...extra
			},
			minion: {
				kind: 'monster',
				behavior: 'stand',
				size: 30,
				stats: { hp: 1, attack: 0, speed: 0 },
				moves: []
			}
		},
		throwables: {
			mine: { look: 'mine', speed: 0, fuse: 3, radius: 40, power: 1, size: 20, cooldown: 0 },
			orb: { look: 'bullet', speed: 300, fuse: 0, radius: 0, power: 1, size: 14, cooldown: 0 }
		}
	});

	it('shows a pattern before it happens, then fires a fan or a ring of shots', () => {
		const world = quiet(
			boss([{ kind: 'fan', every: 2, windup: 0.6, throwable: 'orb', count: 5, spread: 360 }])
		);
		const spawned = world.spawn('boss', 700, 300);
		const attack = vi.fn();
		world.events.on('attack', attack);
		run(world, 1.8);
		expect(world.projectiles).toHaveLength(0);
		expect(spawned?.windup).toBeUndefined();
		run(world, 0.5);
		expect(spawned?.windup).toBeDefined();
		expect(world.projectiles).toHaveLength(0);
		run(world, 0.5);
		expect(spawned?.windup).toBeUndefined();
		expect(attack).toHaveBeenCalledOnce();
		expect(world.projectiles.length).toBeGreaterThanOrEqual(5);
		const angles = new Set(
			world.projectiles.map((shot) => Math.round(Math.atan2(shot.vy, shot.vx) * 10))
		);
		expect(angles.size).toBeGreaterThan(3);
	});

	it('a charge dashes at the figure fast', () => {
		const world = quiet(
			boss([{ kind: 'charge', every: 1, windup: 0.2, boost: 400, seconds: 0.5 }])
		);
		const charging = world.spawn('boss', 700, world.player.y);
		run(world, 1.3);
		expect(charging && world.player.x - charging.x).toBeLessThan(250);
	});

	it('calls monsters, rains bombs and jumps away', () => {
		const world = quiet(
			boss([
				{ kind: 'summon', every: 0.2, windup: 0, entity: 'minion', count: 3 },
				{ kind: 'rain', every: 0.2, windup: 0, throwable: 'mine', count: 2 },
				{ kind: 'teleport', every: 0.2, windup: 0 }
			])
		);
		const mighty = world.spawn('boss', 700, 300);
		run(world, 0.5);
		expect(world.bodies.filter((body) => body.def === 'minion').length).toBeGreaterThanOrEqual(3);
		expect(world.projectiles.length).toBeGreaterThanOrEqual(2);
		expect(mighty && Math.hypot(mighty.x - 700, mighty.y - 300)).toBeGreaterThan(0);
	});

	it('uses patterns of the phase it is in', () => {
		const world = quiet({
			...boss([{ kind: 'summon', every: 1, windup: 0, entity: 'minion', count: 1, fromPhase: 1 }], {
				phases: [{ below: 50, label: 'Angry' }]
			})
		});
		world.spawn('boss', 700, 300);
		run(world, 3);
		expect(world.bodies.some((body) => body.def === 'minion')).toBe(false);
		const raging = world.bodies.find((body) => body.def === 'boss');
		if (raging) world.damage(raging, 60, world.player);
		run(world, 1.2);
		expect(world.bodies.some((body) => body.def === 'minion')).toBe(true);
	});

	it('takes more damage from behind than from the front', () => {
		const world = quiet(boss([], { weakSpot: { side: 'back', multiplier: 3, other: 0.5 } }));
		const target = world.spawn('boss', 700, 300);
		if (!target) throw new Error('no boss');
		target.angle = 0;
		world.player.x = 900;
		world.player.y = 300;
		world.damage(target, 10, world.player);
		expect(target.hp).toBe(95);
		world.player.x = 500;
		world.damage(target, 10, world.player);
		expect(target.hp).toBe(65);
	});

	it('is shielded as long as its helpers live', () => {
		const world = quiet(boss([], { shieldedBy: 'minion' }));
		const target = world.spawn('boss', 700, 300);
		const helper = world.spawn('minion', 600, 300);
		if (!target || !helper) throw new Error('missing');
		world.damage(target, 50, world.player);
		expect(target.hp).toBe(100);
		world.damage(helper, 5, world.player);
		world.damage(target, 50, world.player);
		expect(target.hp).toBe(50);
	});
});
