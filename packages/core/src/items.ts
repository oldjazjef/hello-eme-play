/** Items lying on the page: dropped by monsters, spawned by rules or by triggers. */
import { fall, floorY, spotInView } from './space.js';
import { distance, between } from './stats.js';
import { stateOf } from './state.js';
import { targetOf } from './combat.js';
import type { Pickup, World } from './types.js';

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
