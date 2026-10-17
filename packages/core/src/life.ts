/** The life of monsters: they grow over time or by hitting, turn into something else, have young. */
import { sizeOf } from './space.js';
import { between, countIn } from './stats.js';
import type { Body, World } from './types.js';

/** Most bodies at once, however the rules are set: breeding can't bring the page to a halt. */
const MAX_BODIES = 250;

/** Gives the monster its next level: stronger, bigger, maybe a new kind at the top. */
export function levelUp(world: World, body: Body): void {
	const definition = world.config.entities[body.def];
	if (!definition || body.level >= definition.evolve.maxLevel) return;
	const { stats, into } = definition.evolve;
	body.level += 1;
	body.levelTime = 0;
	body.hits = 0;
	body.kills = 0;
	for (const [stat, amount] of Object.entries(stats)) {
		body.stats[stat] = (body.stats[stat] ?? 0) + amount;
		if (stat === 'hp') body.hp += amount;
	}
	world.events.emit('evolve', { body, level: body.level, into: '' });
	if (body.level >= definition.evolve.maxLevel && into && world.config.entities[into]) {
		becomes(world, body, into);
	}
}

/** The monster turns into another kind of entity, in place, at full health. */
function becomes(world: World, body: Body, def: string): void {
	const definition = world.config.entities[def];
	if (!definition) return;
	body.def = def;
	body.kind = definition.kind;
	body.stats = { ...definition.stats };
	body.hp = body.stats.hp ?? 1;
	body.level = 0;
	body.levelTime = 0;
	body.hits = 0;
	body.kills = 0;
	body.breedIn = -1;
	body.mods = [];
	world.events.emit('evolve', { body, level: 0, into: def });
}

/** A monster hurt the figure: counts towards its next level. */
export function noteHit(world: World, body: Body): void {
	const definition = world.config.entities[body.def];
	if (!definition || definition.evolve.hits <= 0) return;
	body.hits += 1;
	if (body.hits >= definition.evolve.hits) levelUp(world, body);
}

/** A fighter beat a monster: counts towards its next level. */
export function noteKill(world: World, body: Body): void {
	const definition = world.config.entities[body.def];
	if (!definition || definition.evolve.kills <= 0) return;
	body.kills += 1;
	if (body.kills >= definition.evolve.kills) levelUp(world, body);
}

/** Time passes for a monster: levels by time, litters. */
export function tickLife(world: World, body: Body, dt: number): void {
	const definition = world.config.entities[body.def];
	if (!definition) return;
	const { evolve, breed } = definition;
	if (evolve.every > 0 && body.level < evolve.maxLevel) {
		body.levelTime += dt;
		if (body.levelTime >= evolve.every) levelUp(world, body);
	}
	if (breed.every.max <= 0 || body.ally) return;
	if (body.breedIn < 0) body.breedIn = between(world, breed.every);
	body.breedIn -= dt;
	if (body.breedIn > 0) return;
	body.breedIn = between(world, breed.every);
	const young = breed.into && world.config.entities[breed.into] ? breed.into : body.def;
	const alive = world.bodies.filter((other) => other.def === young).length;
	const count = Math.min(
		countIn(world, breed.count),
		breed.max - alive,
		MAX_BODIES - world.bodies.length
	);
	for (let i = 0; i < count; i++) {
		const angle = world.random() * Math.PI * 2;
		const away = sizeOf(world, body) * (0.6 + world.random() * 0.6);
		const child = world.spawn(
			young,
			body.x + Math.cos(angle) * away,
			body.y + (world.view === 'side' ? 0 : Math.sin(angle) * away)
		);
		if (child) world.events.emit('breed', { parent: body, child });
	}
}
