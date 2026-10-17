/** Items lying on the page: dropped by monsters, spawned by rules or by triggers. */
import { hostile } from './bodies.js';
import { heal } from './combat.js';
import { advance, fall, floorY, HARD_EDGE, radiusOf, sizeOf, spotInView } from './space.js';
import { distance, between, statOf } from './stats.js';
import { stateOf } from './state.js';
import { targetOf, victimOf } from './combat.js';
import { hurtAlly } from './team.js';
import type { Body, Pickup, World } from './types.js';

/** How close the figure (or its vehicle) must be to pick something up. */
const PICKUP_REACH = 28;
const USE_REACH = 48;

export function createPickup(
	world: World,
	def: string,
	x?: number,
	y?: number
): Pickup | undefined {
	const definition = world.config.items[def];
	if (!definition) return undefined;
	const spot = x === undefined || y === undefined ? spotInView(world) : { x, y };
	const state = stateOf(world);
	const pickup: Pickup = {
		id: state.nextId++,
		def,
		x: spot.x,
		y: world.view === 'side' ? Math.min(spot.y, floorY(world)) : spot.y,
		ttl: definition.lifetime > 0 ? definition.lifetime : Infinity,
		fall: 0,
		grounded: false,
		drop: 0,
		age: 0
	};
	world.pickups.push(pickup);
	return pickup;
}

/** Ages items, lets them rest on the ground (side view) and picks up what the figure touches. */
export function updatePickups(world: World, dt: number): void {
	const target = targetOf(world);
	for (const pickup of [...world.pickups]) {
		pickup.age += dt;
		pickup.ttl -= dt;
		if (pickup.ttl <= 0) {
			remove(world, pickup);
			continue;
		}
		if (world.view === 'side') fall(world, pickup, dt);
		const definition = world.config.items[pickup.def];
		if (
			definition?.pickup === 'touch' &&
			distance(pickup, target) <= PICKUP_REACH + definition.size / 2
		) {
			collect(world, pickup);
		}
	}
}

function remove(world: World, pickup: Pickup): void {
	const index = world.pickups.indexOf(pickup);
	if (index >= 0) world.pickups.splice(index, 1);
}

/** The figure picks the item up: its effect runs. */
export function collect(world: World, pickup: Pickup): void {
	const definition = world.config.items[pickup.def];
	remove(world, pickup);
	if (!definition) return;
	world.stats.pickups += 1;
	world.events.emit('pickup', { item: pickup, def: definition });
	world.run(definition.do);
}

/** The use key: picks up the nearest item that asks for it. Returns whether one was taken. */
export function usePickup(world: World): boolean {
	const target = targetOf(world);
	let best: Pickup | undefined;
	let bestDistance = USE_REACH;
	for (const pickup of world.pickups) {
		if (world.config.items[pickup.def]?.pickup !== 'use') continue;
		const near = distance(pickup, target);
		if (near <= bestDistance) {
			best = pickup;
			bestDistance = near;
		}
	}
	if (!best) return false;
	collect(world, best);
	return true;
}

/** Item spawn rules: items appear in the visible window every now and then. */
export function spawnItems(world: World): void {
	const state = stateOf(world);
	world.config.itemSpawns.forEach((rule, index) => {
		const due = state.itemDue[index] ?? world.time + between(world, rule.every);
		state.itemDue[index] = due;
		if (world.time < due) return;
		state.itemDue[index] = world.time + between(world, rule.every);
		if (world.level < rule.fromLevel || world.level > rule.toLevel) return;
		const alive = world.pickups.filter((pickup) => pickup.def === rule.item).length;
		if (alive < rule.max) createPickup(world, rule.item);
	});
}

/** Part of a second it takes for a touch to hurt the figure again (its blink time). */
const TOUCH_HURT = 0.5;
/** Seconds a team member can't be hurt again by the same thing. */
const TOUCH_ALLY = 0.4;

/**
 * Objects lying on the page act on whatever touches them: solid ones block the way, hiding ones
 * cover what stands in them, and those with `damage` hurt (or heal) it.
 */
export function tickObjects(world: World, dt: number): void {
	const leader = world.riding ?? world.player;
	const bodies: Body[] = [
		leader,
		...world.bodies.filter((body) => body.kind === 'monster' && !body.hidden)
	];
	for (const body of bodies) body.covered = false;
	const objects = world.pickups.flatMap((pickup) => {
		const definition = world.config.items[pickup.def];
		return definition && (definition.solid || definition.hides || definition.damage !== 0)
			? [{ pickup, definition }]
			: [];
	});
	for (const { pickup, definition } of objects) {
		const radius = definition.size / 2;
		for (const body of bodies) {
			const reach = radiusOf(sizeOf(world, body));
			const near = distance(body, pickup);
			if (definition.hides && near < radius) body.covered = true;
			if (definition.solid && near < radius + reach) pushOut(world, body, pickup, radius + reach);
			if (definition.damage !== 0 && near < radius + reach + 4) touch(world, body, definition, dt);
		}
	}
	world.player.covered = leader.covered;
	if (world.riding) {
		world.player.x = world.riding.x;
		world.player.y = world.riding.y;
	}
}

/** Moves a body out of a solid object so they just touch. */
function pushOut(world: World, body: Body, from: { x: number; y: number }, gap: number): void {
	const side = world.view === 'side';
	const dx = body.x - from.x;
	const dy = side ? 0 : body.y - from.y;
	const away = Math.hypot(dx, dy);
	// In the side view only the sides block; whatever is above stands on it (or passes).
	if (side && Math.abs(body.y - from.y) > gap) return;
	const toward = away > 0 ? { x: dx / away, y: dy / away } : { x: 1, y: 0 };
	body.x = from.x + toward.x * gap;
	if (!side) body.y = from.y + toward.y * gap;
	advance(world, body, 0, 0, false);
	if (world.riding === body) body.speed *= 0.6;
}

/** What touching an object with `damage` does to this body, if it is one the object works on. */
function touch(
	world: World,
	body: Body,
	definition: { damage: number; damageWho: 'figure' | 'monsters' | 'all' },
	dt: number
): void {
	const { damage, damageWho } = definition;
	const isLeader = body === (world.riding ?? world.player);
	const isAlly = body.ally;
	const isWild = hostile(body);
	if (isLeader) {
		if (damageWho === 'monsters') return;
		if (damage > 0) world.damage(victimOf(world), damage * TOUCH_HURT, undefined, 'trigger');
		else if (victimOf(world) === world.player) heal(world, -damage * dt);
		return;
	}
	if (isAlly) {
		if (damageWho === 'monsters') return;
		if (damage > 0) hurtAlly(world, body, damage * TOUCH_ALLY);
		else body.hp = Math.min(statOf(world, body, 'hp'), body.hp - damage * dt);
		return;
	}
	if (!isWild || damageWho === 'figure') return;
	if (damage > 0) world.damage(body, damage * dt, undefined, 'trigger');
	else body.hp = Math.min(statOf(world, body, 'hp'), body.hp - damage * dt);
}

/** Scatters the items the rules want lying around from the start of a level (trees, walls, spikes). */
export function scatterItems(world: World): void {
	const pg = world.host.page();
	const vp = world.host.viewport();
	const leader = world.riding ?? world.player;
	world.config.itemSpawns.forEach((rule) => {
		const first = Math.max(1, rule.fromLevel);
		if (rule.initial <= 0 || world.level !== first || world.level > rule.toLevel) return;
		for (let i = 0; i < rule.initial; i++) {
			for (let attempt = 0; attempt < 8; attempt++) {
				const x = HARD_EDGE + 40 + world.random() * Math.max(0, pg.width - 2 * (HARD_EDGE + 40));
				const top = vp.top + HARD_EDGE + 40;
				const y = top + world.random() * Math.max(0, pg.height - top - HARD_EDGE - 40);
				if (distance({ x, y }, leader) < 160) continue;
				createPickup(world, rule.item, x, y);
				break;
			}
		}
	});
}
