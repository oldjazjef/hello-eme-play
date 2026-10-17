/** Moves, damage, defeat, rewards. */
import { stateOf } from './state.js';
import { cooldownOf, distance, distanceToSegment, hitOf, statOf } from './stats.js';
import { radiusOf, sizeOf } from './space.js';
import type { Body, DefeatSource, World } from './types.js';

/** Seconds a hurt figure blinks and can't be hit again. */
export const HURT_SECONDS = 0.5;

const isMonster = (body: Body) => body.kind === 'monster';

/** Adds (or takes) points. */
export function addPoints(world: World, amount: number): void {
	world.score = Math.max(0, world.score + amount);
	if (amount > 0) world.stats.earned += amount;
	world.events.emit('points', { amount, total: world.score });
}

/** The body monsters go for: the vehicle the figure sits in, else the figure. */
export function targetOf(world: World): Body {
	return world.riding ?? world.player;
}

/**
 * Who takes the hits: the vehicle the figure sits in when it is built to (`absorbs`), else the
 * figure itself.
 */
export function victimOf(world: World): Body {
	const vehicle = world.riding;
	return vehicle && world.config.entities[vehicle.def]?.absorbs ? vehicle : world.player;
}

/** Facing as a unit vector (side view: only left or right). */
export function direction(world: World, body: Body): { x: number; y: number } {
	if (world.view === 'side') return { x: Math.cos(body.angle) >= 0 ? 1 : -1, y: 0 };
	return { x: Math.cos(body.angle), y: Math.sin(body.angle) };
}

/** Whether the body can use the move now (cooldown, where, whether it knows it). */
export function canMove(world: World, body: Body, moveId: string): boolean {
	const move = world.config.moves[moveId];
	if (!move || body.cooldown > 0) return false;
	if (body === world.player) {
		const inVehicle = world.riding !== undefined;
		if (move.where === 'foot' && inVehicle) return false;
		if (move.where === 'vehicle' && !inVehicle) return false;
	}
	return true;
}

/**
 * The figure uses a move: whatever stands in the way of the fist or foot is hit, and the page
 * layer is told so it can break elements. Returns whether the move happened.
 */
export function useMove(world: World, moveId: string): boolean {
	const body = world.player;
	if (!canMove(world, body, moveId)) return false;
	const move = world.config.moves[moveId];
	if (!move) return false;
	body.cooldown = cooldownOf(world, body, move.cooldown);
	body.pose = { pose: move.pose, left: move.seconds };
	world.stats.moves += 1;
	world.stats.kind[moveId] = (world.stats.kind[moveId] ?? 0) + 1;
	const facing = direction(world, body);
	const from = { x: body.x, y: body.y };
	const at = { x: body.x + facing.x * move.reach, y: body.y + facing.y * move.reach };
	world.events.emit('move', { move: moveId, pose: move.pose });
	if (move.sound) world.events.emit('sound', { id: move.sound });
	let hits = 0;
	for (const target of [...world.bodies]) {
		if (!isMonster(target)) continue;
		const reach = radiusOf(sizeOf(world, target)) + 8;
		if (distanceToSegment(target, from, at) > reach) continue;
		const hit = hitOf(world, body, move.power, target);
		hits += 1;
		if (hit.evaded) continue;
		const away = Math.atan2(target.y - from.y, target.x - from.x);
		target.vx = Math.cos(away) * move.push;
		target.vy = world.view === 'side' ? 0 : Math.sin(away) * move.push;
		if (world.view === 'side' && move.push > 0) target.fall = -move.push * 0.5;
		target.cooldown = Math.max(target.cooldown, 0.6);
		world.damage(target, hit.amount, body, 'move');
	}
	// Nothing hit: the fist or foot lands on the page, which may break whatever is there.
	if (hits === 0 && move.breaks) {
		world.events.emit('strike', { at, from, move: moveId, power: move.power, breaks: true });
	}
	return true;
}

/** A monster uses a move on its target (the figure, or the vehicle it sits in). */
export function monsterAttack(world: World, monster: Body, moveId: string): boolean {
	const move = world.config.moves[moveId];
	if (!move || monster.cooldown > 0) return false;
	monster.cooldown = cooldownOf(world, monster, move.cooldown);
	monster.pose = { pose: move.pose, left: move.seconds };
	const victim = victimOf(world);
	const hit = hitOf(world, monster, move.power, victim);
	if (!hit.evaded) world.damage(victim, hit.amount, monster);
	return true;
}

/** Damage to a body: the figure blinks and may die, monsters may be defeated. */
export function damage(
	world: World,
	target: Body,
	amount: number,
	from: Body | undefined,
	source: DefeatSource = 'move'
): void {
	if (world.phase !== 'playing' || amount <= 0) return;
	if (target === world.player) return hurtPlayer(world, amount, from);
	if (target.kind === 'vehicle') return hurtVehicle(world, target, amount, from);
	target.hp -= amount;
	target.hurt = 0.25;
	if (target.hp <= 0) defeat(world, target, source);
}

/** A vehicle that takes hits for its driver blinks, and is wrecked when its health is gone. */
function hurtVehicle(world: World, vehicle: Body, amount: number, from: Body | undefined): void {
	if (vehicle.invulnerable > 0) return;
	vehicle.hp -= amount;
	vehicle.invulnerable = HURT_SECONDS;
	vehicle.hurt = HURT_SECONDS;
	world.events.emit('hurt', { amount, from });
	if (vehicle.hp <= 0) world.wreck(vehicle);
}

function hurtPlayer(world: World, amount: number, from: Body | undefined): void {
	const player = world.player;
	if (player.invulnerable > 0) return;
	player.hp -= amount;
	player.invulnerable = HURT_SECONDS;
	player.hurt = HURT_SECONDS;
	world.events.emit('hurt', { amount, from });
	if (player.hp > 0) return;
	world.lives -= 1;
	world.events.emit('death', { lives: world.lives });
	if (world.lives > 0) {
		player.hp = world.maxHp(player);
		player.invulnerable = 2;
		return;
	}
	world.end(false);
}

/** Heals (or hurts, when negative) the figure, within its maximum. */
export function heal(world: World, amount: number): void {
	const player = world.player;
	if (amount >= 0) player.hp = Math.min(world.maxHp(player), player.hp + amount);
	else {
		player.invulnerable = 0;
		hurtPlayer(world, -amount, undefined);
	}
}

/** A monster is beaten: it goes, the points come, maybe an item drops. */
export function defeat(world: World, monster: Body, source: DefeatSource): void {
	const index = world.bodies.indexOf(monster);
	if (index < 0) return;
	world.bodies.splice(index, 1);
	const state = stateOf(world);
	const definition = world.config.entities[monster.def];
	state.kills[monster.def] = (state.kills[monster.def] ?? 0) + 1;
	state.level.kills += 1;
	if (definition?.boss) state.level.boss = true;
	world.stats.kills += 1;
	if (source === 'overrun') world.stats.overrun += 1;
	if (definition) {
		addPoints(world, definition.reward.points);
		const luck = 1 + statOf(world, world.player, 'luck') / 100;
		for (const drop of definition.reward.drops) {
			if (world.random() * 100 < drop.chance * luck)
				world.dropItem(drop.item, monster.x, monster.y);
		}
	}
	world.events.emit('kill', { body: monster, source });
}

/** A vehicle runs over monsters it touches: fast enough it hurts, slower it pushes them aside. */
export function overrun(world: World, vehicle: Body): void {
	const speed = Math.abs(vehicle.speed);
	if (speed < 1) return;
	const reach = sizeOf(world, vehicle) * 0.38;
	const ram = world.config.entities[vehicle.def]?.ram;
	const fast = speed >= (ram?.minSpeed || world.config.game.overrunSpeed);
	for (const monster of [...world.bodies]) {
		if (!isMonster(monster) || monster.runOver > 0) continue;
		if (distance(monster, vehicle) > reach) continue;
		if (fast) {
			monster.runOver = 0.5;
			const power =
				(1 + (speed / Math.max(1, statOf(world, vehicle, 'speed'))) * 2) * (ram?.power ?? 1);
			const hit = hitOf(world, vehicle, power, monster);
			if (!hit.evaded) world.damage(monster, hit.amount, vehicle, 'overrun');
		} else {
			const away = Math.atan2(monster.y - vehicle.y, monster.x - vehicle.x);
			monster.vx = Math.cos(away) * (200 + speed);
			monster.vy = world.view === 'side' ? 0 : Math.sin(away) * (200 + speed);
		}
	}
}
