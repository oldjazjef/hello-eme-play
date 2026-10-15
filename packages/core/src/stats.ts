/** Stats: effective values, the damage formula and random helpers shared by the systems. */
import type { Range } from '@hello-eme/play-schema';
import type { Body, World } from './types.js';

/** Base stat plus temporary changes, kept within the bounds the stat defines. */
export function statOf(world: World, body: Body, id: string): number {
	let value = body.stats[id] ?? 0;
	for (const mod of body.mods) if (mod.stat === id) value += mod.amount;
	const definition = world.config.stats[id];
	return definition ? Math.min(definition.max, Math.max(definition.min, value)) : value;
}

/** Share of defense that reduces damage: 100 defense halves it. */
export function reduced(amount: number, defense: number): number {
	return (amount * 100) / (100 + Math.max(0, defense));
}

/** Chance (0..1) from a stat that grows with diminishing returns: `luck / (luck + scale)`. */
export function chance(stat: number, scale: number): number {
	return stat <= 0 ? 0 : stat / (stat + scale);
}

export interface Hit {
	amount: number;
	critical: boolean;
	evaded: boolean;
}

/** What a hit of `power` times the attacker's attack does to the defender. */
export function hitOf(world: World, attacker: Body, power: number, defender: Body): Hit {
	const dodge = chance(statOf(world, defender, 'dex'), 300);
	if (dodge > 0 && world.random() < dodge) return { amount: 0, critical: false, evaded: true };
	const luck = chance(statOf(world, attacker, 'luck'), 200);
	const critical = luck > 0 && world.random() < luck;
	const base = reduced(
		statOf(world, attacker, 'attack') * power,
		statOf(world, defender, 'defense')
	);
	return { amount: critical ? base * 2 : base, critical, evaded: false };
}

/** Seconds between two moves: dexterity makes them quicker. */
export function cooldownOf(world: World, body: Body, seconds: number): number {
	return seconds / (1 + statOf(world, body, 'dex') / 100);
}

export const between = (world: World, { min, max }: Range): number =>
	min + world.random() * (max - min);

/** A whole number in the range, both ends included. */
export const countIn = (world: World, { min, max }: Range): number =>
	Math.min(max, min + Math.floor(world.random() * (max - min + 1)));

export function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
	return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Distance from `point` to the line segment a → b (a hit reaches everything on its way). */
export function distanceToSegment(
	point: { x: number; y: number },
	a: { x: number; y: number },
	b: { x: number; y: number }
): number {
	const abx = b.x - a.x;
	const aby = b.y - a.y;
	const length = abx * abx + aby * aby;
	const t = length === 0 ? 0 : ((point.x - a.x) * abx + (point.y - a.y) * aby) / length;
	const along = Math.min(1, Math.max(0, t));
	return Math.hypot(point.x - (a.x + abx * along), point.y - (a.y + aby * along));
}
