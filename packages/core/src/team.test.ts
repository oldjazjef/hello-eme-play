import { describe, expect, it, vi } from 'vitest';
import { catchChance } from './team.js';
import { createWorld } from './world.js';

const quiet = (extra: Record<string, unknown> = {}) =>
	createWorld({ spawns: [], visits: { enabled: false }, ...extra }, { seed: 1 });

function run(world: ReturnType<typeof createWorld>, seconds: number): void {
	for (let t = 0; t < seconds; t += 0.05) world.step(0.05);
}

const ball = {
	catch: 100,
	speed: 0,
	fuse: 0,
	radius: 0,
	ammo: 20,
	maxAmmo: 20,
	cooldown: 0,
	size: 20
};
const critter = (extra: Record<string, unknown> = {}) => ({
	stats: { hp: 10, attack: 3, speed: 60 },
	behavior: 'stand',
	moves: ['bite'],
	...extra
});

describe('catching', () => {
	const make = (extra: Record<string, unknown> = {}, throwable: Record<string, unknown> = {}) =>
		quiet({
			throwables: { ball: { ...ball, ...throwable } },
			entities: { critter: critter(extra) }
		});

	it('a ball that touches a weak monster catches it: it is gone and in the team', () => {
		const world = make();
		const caught = vi.fn();
		world.events.on('catch', caught);
		const monster = world.spawn('critter', world.player.x + 5, world.player.y);
		if (monster) monster.hp = 1;
		world.player.angle = 0;
		world.throwItem('ball');
		run(world, 0.3);
		expect(caught).toHaveBeenCalledOnce();
		expect(world.party).toHaveLength(1);
		expect(world.party[0]).toMatchObject({ def: 'critter', hp: 1 });
		expect(monster && world.bodies.includes(monster)).toBe(false);
		expect(world.stats.caught).toBe(1);
		expect(world.summary()).toMatchObject({ caught: 1 });
	});

	it('the chance falls with health and with the catchability, and is nil for what cannot be caught', () => {
		const world = make({ catchRate: 50 });
		const monster = world.spawn('critter', 100, 100);
		if (!monster) throw new Error('no monster');
		expect(catchChance(world, monster, 100)).toBeCloseTo(20, 5);
		monster.hp = 0.0001;
		expect(catchChance(world, monster, 100)).toBeCloseTo(50, 1);
		const never = make({ catchRate: 0 });
		const other = never.spawn('critter', 100, 100);
		if (other) expect(catchChance(never, other, 100)).toBe(0);
	});

	it('a monster that breaks free stays, and a trigger hears about it', () => {
		const world = make({ catchRate: 0 }, {});
		const escaped = vi.fn();
		world.events.on('escape', escaped);
		const monster = world.spawn('critter', world.player.x + 5, world.player.y);
		world.player.angle = 0;
		world.throwItem('ball');
		run(world, 0.3);
		expect(escaped).toHaveBeenCalledOnce();
		expect(monster && world.bodies.includes(monster)).toBe(true);
		expect(world.party).toHaveLength(0);
	});

	it('a ball does not hurt', () => {
		const world = make({ catchRate: 0 }, {});
		const monster = world.spawn('critter', world.player.x + 5, world.player.y);
		world.player.angle = 0;
		world.throwItem('ball');
		run(world, 0.3);
		expect(monster?.hp).toBe(10);
	});

	it('does not catch when the team is full', () => {
		const world = quiet({
			game: { partySize: 1 },
			throwables: { ball: ball },
			entities: { critter: critter() }
		});
		world.recruit('critter');
		const monster = world.spawn('critter', world.player.x + 5, world.player.y);
		if (monster) monster.hp = 1;
		world.player.angle = 0;
		world.throwItem('ball');
		run(world, 0.3);
		expect(world.party).toHaveLength(1);
		expect(monster && world.bodies.includes(monster)).toBe(true);
	});

	it('triggers can start the team and react to a catch', () => {
		const world = quiet({
			throwables: { ball },
			entities: { critter: critter(), starter: critter() },
			triggers: [
				{ on: 'start', do: [{ do: 'recruit', entity: 'starter' }] },
				{ on: 'catch', only: 'critter', do: [{ do: 'points', amount: 50 }] }
			]
		});
		expect(world.party.map((member) => member.def)).toEqual(['starter']);
		const monster = world.spawn('critter', world.player.x + 5, world.player.y);
		if (monster) monster.hp = 0.1;
		world.player.angle = 0;
		world.throwItem('ball');
		run(world, 0.3);
		expect(world.score).toBe(50);
	});
});

describe('the team', () => {
	const make = (extra: Record<string, unknown> = {}) =>
		quiet({
			entities: {
				mon: critter({ stats: { hp: 10, attack: 5, speed: 100 } }),
				foe: critter({ stats: { hp: 6, attack: 1, speed: 40 }, moves: [] }),
				...extra
			}
		});

	it('sends the next healthy member out, calls it back, and goes round', () => {
		const world = make();
		world.recruit('mon');
		world.recruit('foe');
		world.cycleParty();
		expect(world.ally?.def).toBe('mon');
		world.cycleParty();
		expect(world.ally?.def).toBe('foe');
		world.cycleParty();
		expect(world.ally).toBeUndefined();
		expect(world.bodies.filter((body) => body.ally)).toHaveLength(0);
		world.cycleParty();
		expect(world.ally?.def).toBe('mon');
	});

	it('skips fainted members', () => {
		const world = make();
		world.recruit('mon');
		world.recruit('foe');
		const first = world.party[0];
		if (first) first.hp = 0;
		world.cycleParty();
		expect(world.ally?.def).toBe('foe');
	});

	it('fights the nearest monster, and the figure gets the points', () => {
		const world = make();
		world.recruit('mon');
		world.cycleParty();
		world.spawn('foe', world.player.x + 150, world.player.y);
		run(world, 5);
		expect(world.bodies.filter((body) => body.def === 'foe')).toHaveLength(0);
		expect(world.stats.kills).toBe(1);
	});

	it('hostile monsters fight the team member that is close', () => {
		const world = quiet({
			entities: {
				mon: critter({ stats: { hp: 100, attack: 1, speed: 100 }, moves: [] }),
				wild: critter({ stats: { hp: 50, attack: 10, speed: 50 } })
			}
		});
		world.recruit('mon');
		world.cycleParty();
		const ally = world.ally;
		world.spawn('wild', (ally?.x ?? 0) + 60, ally?.y ?? 0);
		run(world, 3);
		expect(ally && ally.hp).toBeLessThan(100);
		expect(world.player.hp).toBe(world.maxHp(world.player));
	});

	it('faints at 0 health, goes back to the team and comes out no more until healed', () => {
		const world = make();
		world.recruit('mon');
		world.cycleParty();
		const ally = world.ally;
		if (!ally) throw new Error('no ally');
		const fainted = vi.fn();
		world.events.on('faint', fainted);
		world.damage(ally, 999, undefined);
		expect(fainted).toHaveBeenCalledOnce();
		expect(world.ally).toBeUndefined();
		expect(world.party[0]?.hp).toBe(0);
		world.cycleParty();
		expect(world.ally).toBeUndefined();
		world.healParty(100);
		expect(world.party[0]?.hp).toBe(10);
		world.cycleParty();
		expect(world.ally?.def).toBe('mon');
	});

	it('healing by a percent does not revive, and never exceeds the maximum', () => {
		const world = make();
		world.recruit('mon');
		world.recruit('mon');
		const [a, b] = world.party;
		if (a) a.hp = 2;
		if (b) b.hp = 0;
		world.healParty(50);
		expect(a?.hp).toBe(7);
		expect(b?.hp).toBe(0);
		world.healParty(50);
		expect(a?.hp).toBe(10);
	});

	it('levels up by beating monsters, then evolves into something else, and the team remembers', () => {
		const world = make({
			mon: critter({
				stats: { hp: 10, attack: 20, speed: 100 },
				evolve: { kills: 2, maxLevel: 1, into: 'mega' }
			}),
			mega: critter({ stats: { hp: 40, attack: 20, speed: 100 } })
		});
		const evolved = vi.fn();
		world.events.on('evolve', evolved);
		world.recruit('mon');
		world.cycleParty();
		for (let i = 0; i < 2; i++) {
			world.spawn('foe', world.player.x + 100, world.player.y);
			run(world, 4);
		}
		expect(world.ally?.def).toBe('mega');
		expect(evolved).toHaveBeenCalled();
		expect(world.party[0]?.def).toBe('mega');
		expect(world.party[0]?.hp).toBe(40);
	});

	it("is not hit by the figure's own moves and blasts", () => {
		const world = quiet({
			throwables: { bomb: { speed: 0, fuse: 0.2, radius: 200, power: 99, ammo: 1 } },
			entities: {
				mon: critter(),
				hero: { kind: 'figure', stats: { hp: 100, attack: 5, speed: 220 } }
			}
		});
		world.recruit('mon');
		world.cycleParty();
		world.throwItem('bomb');
		run(world, 0.6);
		expect(world.ally?.hp).toBe(10);
	});

	it('the key and the control cycle the team', () => {
		const world = make();
		world.recruit('mon');
		world.controls.pressed.add('party');
		world.step(0.05);
		expect(world.ally?.def).toBe('mon');
	});
});

describe('hideouts', () => {
	const make = (extra: Record<string, unknown> = {}) =>
		quiet({
			hideouts: { grass: { count: 8, radius: { min: 80, max: 80 }, encounter: 100 } },
			entities: { critter: critter({ hideIn: 'grass' }) },
			spawns: [{ entity: 'critter', every: { min: 1, max: 1 }, count: { min: 3, max: 3 }, max: 3 }],
			...extra
		});

	it('are scattered over the page, the same for a seed', () => {
		const a = make();
		const b = make();
		expect(a.hideouts).toHaveLength(8);
		expect(a.hideouts.map((place) => [place.x, place.y])).toEqual(
			b.hideouts.map((place) => [place.x, place.y])
		);
		const page = { width: 1000, height: 2100 };
		for (const place of a.hideouts) {
			expect(place.x).toBeGreaterThan(0);
			expect(place.x).toBeLessThan(page.width);
			expect(place.y).toBeLessThan(page.height);
		}
	});

	it('monsters that hide spawn inside one, invisible and harmless', () => {
		const world = make();
		run(world, 1.5);
		const hidden = world.bodies.filter((body) => body.def === 'critter');
		expect(hidden).toHaveLength(3);
		for (const body of hidden) {
			const place = world.hideouts[body.hideout];
			expect(body.hidden).toBe(true);
			expect(place && Math.hypot(body.x - place.x, body.y - place.y)).toBeLessThanOrEqual(80);
		}
	});

	it('hidden monsters cannot be punched, blasted or caught', () => {
		const world = quiet({
			hideouts: { grass: { count: 1, radius: { min: 400, max: 400 }, encounter: 0 } },
			throwables: { bomb: { speed: 0, fuse: 0.1, radius: 600, power: 99, ammo: 1 } },
			entities: { critter: critter({ hideIn: 'grass' }) }
		});
		const [monster] = world.spawnAt('critter', 1, 'edge');
		expect(monster?.hidden).toBe(true);
		if (monster) {
			monster.x = world.player.x + 20;
			monster.y = world.player.y;
		}
		world.player.angle = 0;
		world.controls.held.add('punch');
		world.throwItem('bomb');
		run(world, 0.6);
		expect(monster?.hp).toBe(10);
	});

	it('jump out when the figure walks through, once, with an event', () => {
		const world = make();
		run(world, 1.5);
		const place = world.hideouts[world.bodies[0]?.hideout ?? 0];
		if (!place) throw new Error('no hideout');
		const found = vi.fn();
		world.events.on('encounter', found);
		world.player.x = place.x;
		world.player.y = place.y;
		world.controls.axis.x = 1;
		run(world, 0.5);
		expect(found).toHaveBeenCalled();
		const out = world.bodies.filter((body) => !body.hidden);
		expect(out.length).toBeGreaterThan(0);
		expect(out.length).toBeLessThan(3);
	});

	it('stay hidden while the figure stands still in the grass', () => {
		const world = make();
		run(world, 1.5);
		const place = world.hideouts[world.bodies[0]?.hideout ?? 0];
		if (!place) throw new Error('no hideout');
		world.player.x = place.x;
		world.player.y = place.y;
		world.controls.axis.x = 0;
		world.controls.axis.y = 0;
		run(world, 2);
		expect(world.bodies.every((body) => body.hidden)).toBe(true);
	});

	it('without a matching hideout the monster just spawns', () => {
		const world = quiet({
			entities: { critter: critter({ hideIn: 'grass' }) },
			spawns: [{ entity: 'critter', every: { min: 1, max: 1 }, max: 1 }]
		});
		run(world, 1.5);
		expect(world.bodies.some((body) => body.def === 'critter' && !body.hidden)).toBe(true);
	});
});
