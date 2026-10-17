/** Items lying on the page: dropped by monsters, spawned by rules or by triggers. */
import { hostile } from './bodies.js';
import { heal } from './combat.js';
import {
	advance,
	arenaOf,
	fall,
	floorY,
	HARD_EDGE,
	itemBox,
	radiusOf,
	sizeOf,
	solidAt,
	spotInView
} from './space.js';
import { centerX, centerY, gridOf } from './grid.js';
import { distance, between, statOf } from './stats.js';
import { stateOf } from './state.js';
import { targetOf, victimOf } from './combat.js';
import { hurtAlly } from './team.js';
import type { ItemDefinition } from '@hello-eme/play-schema';
import type { Body, Pickup, World } from './types.js';

/** How close the figure (or its vehicle) must be to pick something up. */
const PICKUP_REACH = 28;
const USE_REACH = 48;

/** A random spot in the window that no solid object covers, in the middle of a cell on a grid. */
function freeSpot(world: World, definition: ItemDefinition): { x: number; y: number } {
	let spot = spotInView(world);
	for (
		let attempt = 0;
		attempt < 12 && solidAt(world, spot.x, spot.y, definition.size / 2);
		attempt++
	) {
		spot = spotInView(world);
	}
	if (world.config.game.control !== 'grid' || world.view !== 'topdown') return spot;
	const g = gridOf(world);
	const col = Math.min(g.cols - 1, Math.max(0, Math.floor((spot.x - g.x0) / g.cell)));
	const row = Math.min(g.rows - 1, Math.max(0, Math.floor((spot.y - g.y0) / g.cell)));
	return { x: centerX(g, col), y: centerY(g, row) };
}

export function createPickup(
	world: World,
	def: string,
	x?: number,
	y?: number
): Pickup | undefined {
	const definition = world.config.items[def];
	if (!definition) return undefined;
	const spot = x === undefined || y === undefined ? freeSpot(world, definition) : { x, y };
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
		age: 0,
		cooldown: 0,
		hp: definition.hp
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
		pickup.cooldown = Math.max(0, pickup.cooldown - dt);
		if (pickup.ttl <= 0) {
			remove(world, pickup);
			continue;
		}
		const definition = world.config.items[pickup.def];
		if (world.view === 'side' && !definition?.platform && !definition?.float)
			fall(world, pickup, dt);
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
		return definition && acts(definition) ? [{ pickup, definition }] : [];
	});
	for (const { pickup, definition } of objects) {
		const radius = definition.size / 2;
		for (const body of bodies) {
			const reach = radiusOf(sizeOf(world, body));
			const near = distance(body, pickup);
			if (definition.hides && near < radius) body.covered = true;
			if (definition.solid) {
				if (definition.box) pushOutBox(world, body, pickup, definition, reach);
				else if (near < radius + reach) pushOut(world, body, pickup, radius + reach);
			}
			if (definition.damage !== 0 && near < radius + reach + 4) touch(world, body, definition, dt);
			if (body === leader && near < radius + reach + 4) act(world, pickup, definition);
		}
	}
	world.player.covered = leader.covered;
	if (world.riding) {
		world.player.x = world.riding.x;
		world.player.y = world.riding.y;
	}
}

/** Whether an item does anything while lying on the page (an object rather than a thing to pick up). */
function acts(definition: ItemDefinition): boolean {
	return (
		definition.solid ||
		definition.hides ||
		definition.damage !== 0 ||
		(definition.pickup === 'none' && definition.do.length > 0)
	);
}

/** The figure touches an object with an effect: its actions run (not more often than `every`). */
function act(world: World, pickup: Pickup, definition: ItemDefinition): void {
	if (definition.pickup !== 'none' || definition.do.length === 0 || pickup.cooldown > 0) return;
	pickup.cooldown = definition.every;
	world.events.emit('touch', { item: pickup, def: definition });
	world.run(definition.do);
}

/** Moves a body out of a solid rectangular object so they just touch. */
function pushOutBox(
	world: World,
	body: Body,
	box: { x: number; y: number },
	definition: ItemDefinition,
	reach: number
): void {
	const { w, h } = itemBox(definition);
	const side = world.view === 'side';
	if (side) {
		// Only the sides block; whatever is above stands on top (a platform) or passes.
		if (body.y <= box.y - h / 2 + 4 || body.y > box.y + h / 2 + reach * 2) return;
		const dx = body.x - box.x;
		const over = w / 2 + reach - Math.abs(dx);
		if (over > 0) body.x += (dx >= 0 ? 1 : -1) * over;
		advance(world, body, 0, 0, false);
		return;
	}
	const nearX = Math.min(Math.max(body.x, box.x - w / 2), box.x + w / 2);
	const nearY = Math.min(Math.max(body.y, box.y - h / 2), box.y + h / 2);
	const dx = body.x - nearX;
	const dy = body.y - nearY;
	const away = Math.hypot(dx, dy);
	if (away >= reach) return;
	if (away > 0) {
		body.x = nearX + (dx / away) * reach;
		body.y = nearY + (dy / away) * reach;
	} else {
		body.x = box.x + (body.x >= box.x ? 1 : -1) * (w / 2 + reach);
	}
	advance(world, body, 0, 0, false);
	if (world.riding === body) body.speed *= 0.6;
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
	const arena = arenaOf(world);
	const vp = world.host.viewport();
	const leader = world.riding ?? world.player;
	world.config.itemSpawns.forEach((rule) => {
		const first = Math.max(1, rule.fromLevel);
		if (rule.initial <= 0 || world.level !== first || world.level > rule.toLevel) return;
		for (let i = 0; i < rule.initial; i++) {
			for (let attempt = 0; attempt < 8; attempt++) {
				const x =
					arena.left +
					HARD_EDGE +
					40 +
					world.random() * Math.max(0, arena.right - arena.left - 2 * (HARD_EDGE + 40));
				const top = Math.max(arena.top, vp.top) + HARD_EDGE + 40;
				const y = top + world.random() * Math.max(0, arena.bottom - top - HARD_EDGE - 40);
				if (distance({ x, y }, leader) < 160) continue;
				createPickup(world, rule.item, x, y);
				break;
			}
		}
	});
}
