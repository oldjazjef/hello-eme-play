/** What bodies do on their own: monsters chase, wander or flee and attack; vehicles park. */
import { tickBody } from './bodies.js';
import { monsterAttack, targetOf } from './combat.js';
import { advance, fall, radiusOf, sizeOf, spotInView } from './space.js';
import { statOf } from './stats.js';
import { autopilot, driveOf } from './vehicle.js';
import type { Body, World } from './types.js';

/** Monsters farther from the figure than this (px) give up; only happens across a page wrap. */
const GIVE_UP = 5000;
/** How fast knockback fades (1/s). */
const FRICTION = 5;

/** Advances every monster and every vehicle that drives by itself. */
export function think(world: World, dt: number): void {
	const target = targetOf(world);
	for (const body of [...world.bodies]) {
		tickBody(body, dt);
		if (body.kind === 'vehicle') {
			if (body !== world.riding) driveAlone(world, body, dt);
			continue;
		}
		if (body.kind !== 'monster') continue;
		if (
			Math.hypot(body.x - target.x, body.y - target.y) > GIVE_UP &&
			!world.config.entities[body.def]?.boss
		) {
			world.bodies.splice(world.bodies.indexOf(body), 1);
			continue;
		}
		moveMonster(world, body, target, dt);
		attack(world, body, target);
	}
}

/** An unattended vehicle: drives to its spot, then stands (rolls out if it was left moving). */
function driveAlone(world: World, vehicle: Body, dt: number): void {
	if (vehicle.pilot) {
		const done = autopilot(world, vehicle, dt);
		if (done && vehicle.pilot === undefined) vehicle.parked = true;
		if (world.view === 'side') fall(world, vehicle, dt);
		return;
	}
	vehicle.speed =
		Math.sign(vehicle.speed) *
		Math.max(0, Math.abs(vehicle.speed) - driveOf(world, vehicle).roll * dt);
	if (vehicle.speed !== 0) {
		advance(
			world,
			vehicle,
			Math.cos(vehicle.angle) * vehicle.speed * dt,
			Math.sin(vehicle.angle) * vehicle.speed * dt,
			false
		);
	}
	vehicle.moving = false;
	if (world.view === 'side') fall(world, vehicle, dt);
}

function moveMonster(world: World, monster: Body, target: Body, dt: number): void {
	const definition = world.config.entities[monster.def];
	const side = world.view === 'side';
	const speed = statOf(world, monster, 'speed');
	const reach = firstReach(world, monster);
	let dx = 0;
	let dy = 0;
	let facing = monster.angle;
	const toX = target.x - monster.x;
	const toY = side ? 0 : target.y - monster.y;
	const to = Math.hypot(toX, toY);
	switch (definition?.behavior ?? 'chase') {
		case 'chase':
			// Close enough to hit: stop there instead of pushing into the target.
			if (to > reach * 0.8 && to > 0) {
				dx = (toX / to) * speed * dt;
				dy = (toY / to) * speed * dt;
			}
			if (to > 0) facing = Math.atan2(toY, toX);
			break;
		case 'flee':
			if (to > 0 && to < 400) {
				dx = (-toX / to) * speed * dt;
				dy = (-toY / to) * speed * dt;
				facing = Math.atan2(-toY, -toX);
			}
			break;
		case 'wander': {
			monster.wander.left -= dt;
			if (monster.wander.left <= 0) {
				monster.wander = { angle: world.random() * Math.PI * 2, left: 1 + world.random() * 2 };
			}
			const angle = side
				? Math.cos(monster.wander.angle) >= 0
					? 0
					: Math.PI
				: monster.wander.angle;
			dx = Math.cos(angle) * speed * 0.5 * dt;
			dy = side ? 0 : Math.sin(angle) * speed * 0.5 * dt;
			facing = angle;
			break;
		}
		case 'arrive':
		case 'stand':
			break;
	}
	// Keep apart from the others, so a wave doesn't turn into one blob.
	const own = radiusOf(sizeOf(world, monster));
	for (const other of world.bodies) {
		if (other === monster || other.kind !== 'monster') continue;
		const apartX = monster.x - other.x;
		const apartY = side ? 0 : monster.y - other.y;
		const apart = Math.hypot(apartX, apartY);
		const min = own + radiusOf(sizeOf(world, other));
		if (apart > 0 && apart < min) {
			const push = (min - apart) * 0.5;
			dx += (apartX / apart) * push * dt * 8;
			dy += (apartY / apart) * push * dt * 8;
		}
	}
	const fade = Math.exp(-FRICTION * dt);
	advance(world, monster, dx + monster.vx * dt, dy + monster.vy * dt, false);
	monster.vx *= fade;
	monster.vy *= fade;
	monster.angle = facing;
	monster.moving = dx !== 0 || dy !== 0;
	monster.distance += Math.hypot(dx, dy);
	if (side) fall(world, monster, dt);
}

/** How close a monster must be to use its first move. */
function firstReach(world: World, monster: Body): number {
	const id = world.config.entities[monster.def]?.moves[0];
	return (id ? world.config.moves[id]?.reach : undefined) ?? 30;
}

function attack(world: World, monster: Body, target: Body): void {
	const definition = world.config.entities[monster.def];
	const id = definition?.moves[0];
	if (!id || monster.cooldown > 0) return;
	const reach = world.config.moves[id]?.reach ?? 30;
	const dy = world.view === 'side' ? Math.abs(target.y - monster.y) : 0;
	const near =
		Math.hypot(target.x - monster.x, world.view === 'side' ? 0 : target.y - monster.y) <= reach &&
		dy < 80;
	if (near) monsterAttack(world, monster, id);
}

/** A place for a vehicle to park (side view: on the ground). */
export function parkingSpot(world: World): { x: number; y: number } {
	return spotInView(world);
}
