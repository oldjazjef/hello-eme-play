/** Bombs, rocks, mines: thrown or dropped by the figure, flying, waiting, going off. */
import type { ThrowableDefinition } from '@hello-eme/play-schema';
import { direction, targetOf, victimOf } from './combat.js';
import { advance, fall, radiusOf, sizeOf } from './space.js';
import { stateOf } from './state.js';
import { cooldownOf, distance, reduced, statOf } from './stats.js';
import type { Projectile, World } from './types.js';

/** From above a thrown object slows down by this factor per second: it flies about speed ÷ DRAG px. */
const DRAG = 3;
/** Slower than this (px/s) it counts as lying still. */
const REST_SPEED = 25;
/** Side view: how fast something sliding on the ground slows down (1/s). */
const GROUND_DRAG = 4;
/** Side view: the share of the launch speed that goes upwards. */
const ARC = 0.6;
/** Side view: it bounces only when it lands at least this fast (px/s). */
const BOUNCE_MIN = 140;
/** A bomb that lands right next to the figure doesn't touch a monster in the first moments. */
const ARMING = 0.05;
/** Most objects lying or flying at once, so a held-down key can't flood the page. */
const MAX_PROJECTILES = 60;

function usable(world: World, definition: ThrowableDefinition): boolean {
	if (definition.where === 'both') return true;
	return (definition.where === 'vehicle') === (world.riding !== undefined);
}

/** How many of a throwable the figure has (Infinity when unlimited). */
export function ammoOf(world: World, id: string): number {
	const definition = world.config.throwables[id];
	if (!definition) return 0;
	return definition.unlimited ? Infinity : (stateOf(world).ammo[id] ?? 0);
}

/** Adds (or takes) ammo, within 0 and the most the figure can carry. */
export function giveAmmo(world: World, id: string, amount: number): void {
	const definition = world.config.throwables[id];
	if (!definition) return;
	const state = stateOf(world);
	state.ammo[id] = Math.min(definition.maxAmmo, Math.max(0, (state.ammo[id] ?? 0) + amount));
}

/** The figure throws (or drops) one. Returns whether it happened. */
export function throwItem(world: World, id: string): boolean {
	const definition = world.config.throwables[id];
	if (!definition || world.phase !== 'playing' || !usable(world, definition)) return false;
	const state = stateOf(world);
	if (world.time < (state.throwDue[id] ?? 0) || ammoOf(world, id) < 1) return false;
	if (world.projectiles.length >= MAX_PROJECTILES) return false;
	if (!definition.unlimited) state.ammo[id] = (state.ammo[id] ?? 0) - 1;
	state.throwDue[id] = world.time + cooldownOf(world, world.player, definition.cooldown);

	const origin = targetOf(world);
	const side = world.view === 'side';
	const forward = direction(world, origin);
	const sign = definition.direction === 'back' && world.riding ? -1 : 1;
	const facing = { x: forward.x * sign, y: forward.y * sign };
	const reach = sizeOf(world, origin);
	// A dropped one lies where the figure stands (behind a vehicle that drops it backwards).
	const away = definition.speed > 0 ? reach * 0.4 : sign < 0 ? reach * 0.45 : 0;
	const riding = world.riding;
	const projectile: Projectile = {
		id: state.nextId++,
		def: id,
		x: origin.x + facing.x * away,
		y: side ? origin.y - (definition.speed > 0 ? reach * 0.5 : 0) : origin.y + facing.y * away,
		// The vehicle's own speed comes on top: from a fast car a bomb flies farther forward.
		vx:
			facing.x * definition.speed +
			(riding ? (side ? riding.speed : Math.cos(riding.angle) * riding.speed) : 0),
		vy: side
			? 0
			: facing.y * definition.speed + (riding ? Math.sin(riding.angle) * riding.speed : 0),
		fall: side && definition.speed > 0 ? -definition.speed * ARC : 0,
		grounded: false,
		drop: 0,
		fuse: definition.fuse > 0 ? definition.fuse : Infinity,
		age: 0
	};
	world.projectiles.push(projectile);
	world.stats.thrown += 1;
	world.stats.kind[id] = (world.stats.kind[id] ?? 0) + 1;
	world.events.emit('throw', { id, projectile });
	if (definition.sound) world.events.emit('sound', { id: definition.sound });
	return true;
}

/** Moves what is thrown, and sets off whatever is due or touches a monster. */
export function updateProjectiles(world: World, dt: number): void {
	for (const projectile of [...world.projectiles]) {
		const definition = world.config.throwables[projectile.def];
		if (!definition) {
			remove(world, projectile);
			continue;
		}
		projectile.age += dt;
		projectile.fuse -= dt;
		const landed = move(world, projectile, definition, dt);
		if (
			projectile.fuse <= 0 ||
			(definition.fuse === 0 && triggered(world, projectile, definition, landed))
		) {
			explode(world, projectile, definition);
		}
	}
}

/** Flies or slides for `dt` seconds. Returns whether it came to rest (landed, or stopped). */
function move(world: World, p: Projectile, definition: ThrowableDefinition, dt: number): boolean {
	if (world.view === 'topdown') {
		advance(world, p, p.vx * dt, p.vy * dt, false);
		const slow = Math.exp(-DRAG * dt);
		p.vx *= slow;
		p.vy *= slow;
		return Math.hypot(p.vx, p.vy) < REST_SPEED;
	}
	advance(world, p, p.vx * dt, 0, false);
	const impact = p.fall;
	const wasGrounded = p.grounded;
	fall(world, p, dt);
	if (!p.grounded) return false;
	if (!wasGrounded && impact > BOUNCE_MIN && definition.bounce > 0 && definition.fuse > 0) {
		p.fall = -impact * definition.bounce;
		p.grounded = false;
		return false;
	}
	p.vx *= Math.exp(-GROUND_DRAG * dt);
	return true;
}

/** Without a fuse: goes off on a monster, and (when it was thrown) when it lands or lies still. */
function triggered(
	world: World,
	p: Projectile,
	definition: ThrowableDefinition,
	rested: boolean
): boolean {
	if (p.age < ARMING) return false;
	if (definition.speed > 0 && rested) return true;
	return world.bodies.some(
		(body) =>
			body.kind === 'monster' &&
			distance(body, p) <= radiusOf(sizeOf(world, body)) + definition.size / 2
	);
}

function remove(world: World, projectile: Projectile): void {
	const index = world.projectiles.indexOf(projectile);
	if (index >= 0) world.projectiles.splice(index, 1);
}

/** The blast: monsters in range are hurt and pushed away, page elements break, the figure may be hurt. */
function explode(world: World, p: Projectile, definition: ThrowableDefinition): void {
	remove(world, p);
	const thrower = world.player;
	const base = statOf(world, thrower, 'attack') * definition.power;
	world.events.emit('explode', {
		throwable: p.def,
		x: p.x,
		y: p.y,
		radius: Math.max(definition.radius, definition.size)
	});
	if (definition.explodeSound) world.events.emit('sound', { id: definition.explodeSound });
	for (const monster of [...world.bodies]) {
		if (monster.kind !== 'monster') continue;
		const near = distance(monster, p);
		const reach =
			Math.max(definition.radius, definition.size / 2) + radiusOf(sizeOf(world, monster));
		if (near > reach) continue;
		const away = Math.atan2(monster.y - p.y, monster.x - p.x);
		monster.vx = Math.cos(away) * definition.push;
		monster.vy = world.view === 'side' ? 0 : Math.sin(away) * definition.push;
		if (world.view === 'side' && definition.push > 0) monster.fall = -definition.push * 0.5;
		world.damage(monster, reduced(base, statOf(world, monster, 'defense')), thrower, 'blast');
	}
	if (definition.hurtsFigure) {
		const victim = victimOf(world);
		const target = targetOf(world);
		const reach = definition.radius + radiusOf(sizeOf(world, target));
		if (distance(target, p) <= reach) {
			world.damage(victim, reduced(base, statOf(world, victim, 'defense')), undefined, 'blast');
		}
	}
	if (definition.breaks) strikePage(world, p, definition);
}

/** Tells the page layer where the blast hit: the middle and four spots around it. */
function strikePage(world: World, p: Projectile, definition: ThrowableDefinition): void {
	const half = definition.radius / 2;
	const spots =
		half > 0
			? [
					{ x: 0, y: 0 },
					{ x: half, y: 0 },
					{ x: -half, y: 0 },
					{ x: 0, y: half },
					{ x: 0, y: -half }
				]
			: [{ x: 0, y: 0 }];
	for (const spot of spots) {
		const at = {
			x: p.x + spot.x,
			y: p.y + spot.y - (world.view === 'side' ? definition.size / 2 : 0)
		};
		world.events.emit('strike', {
			at,
			from: { x: p.x, y: p.y },
			move: p.def,
			power: definition.power,
			breaks: true
		});
	}
}
