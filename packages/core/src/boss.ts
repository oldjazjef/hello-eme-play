/**
 * Boss fights: attack patterns (a fan of shots, a charge, a rain of bombs, calling monsters,
 * jumping away), each shown before it happens; a weak spot that takes more damage from one side;
 * and a shield that holds as long as the boss' helpers live.
 */
import type { BossAttack, EntityDefinition } from '@hello-eme/play-schema';
import { advance, arenaOf, HARD_EDGE, radiusOf, sizeOf } from './space.js';
import { statOf } from './stats.js';
import { fireAt, placeHazard } from './throwables.js';
import type { Body, World } from './types.js';

/** A charge ends this many px short of running off the arena. */
const DASH_MARGIN = 8;

/** Whether a monster has patterns of its own (so the generic chase should leave it to them). */
export const hasAttacks = (definition: EntityDefinition | undefined): boolean =>
	(definition?.attacks.length ?? 0) > 0;

/** Whether `attack` is available in the phase the boss is in. */
function inPhase(attack: BossAttack, phase: number): boolean {
	return phase >= attack.fromPhase && (attack.toPhase === 0 || phase <= attack.toPhase);
}

/**
 * Runs the boss' patterns for a moment. Returns whether the boss is busy (showing a pattern or
 * charging), so the ordinary movement leaves it alone.
 */
export function tickBoss(world: World, boss: Body, target: Body, dt: number): boolean {
	const definition = world.config.entities[boss.def];
	if (!definition || !hasAttacks(definition)) return false;
	if (boss.attackDue.length !== definition.attacks.length) {
		boss.attackDue = definition.attacks.map((attack) => world.time + attack.every);
	}
	if (boss.dash) return dash(world, boss, dt);
	if (boss.windup) {
		boss.windup.left -= dt;
		if (boss.windup.left > 0) return true;
		const index = boss.windup.index;
		boss.windup = undefined;
		const attack = definition.attacks[index];
		if (attack) run(world, boss, attack, index, target);
		return boss.dash !== undefined;
	}
	const away = Math.hypot(target.x - boss.x, target.y - boss.y);
	for (const [index, attack] of definition.attacks.entries()) {
		if (!inPhase(attack, boss.phase) || world.time < (boss.attackDue[index] ?? 0)) continue;
		if (attack.range > 0 && away > attack.range) continue;
		boss.attackDue[index] = world.time + attack.every + attack.windup;
		if (attack.windup <= 0) {
			run(world, boss, attack, index, target);
			return boss.dash !== undefined;
		}
		boss.angle = Math.atan2(target.y - boss.y, target.x - boss.x);
		boss.windup = { index, left: attack.windup, total: attack.windup };
		return true;
	}
	return false;
}

/** The pattern happens. */
function run(world: World, boss: Body, attack: BossAttack, index: number, target: Body): void {
	world.events.emit('attack', { body: boss, index, kind: attack.kind });
	const aim = Math.atan2(target.y - boss.y, target.x - boss.x);
	switch (attack.kind) {
		case 'fan': {
			if (!attack.throwable) return;
			const around = attack.spread >= 360;
			const spread = (attack.spread * Math.PI) / 180;
			const first = around ? world.random() * Math.PI * 2 : aim - spread / 2;
			const step =
				attack.count <= 1 ? 0 : around ? (Math.PI * 2) / attack.count : spread / (attack.count - 1);
			for (let shot = 0; shot < attack.count; shot++) {
				const angle = attack.count === 1 && !around ? aim : first + step * shot;
				fireAt(world, boss, attack.throwable, angle);
			}
			return;
		}
		case 'charge': {
			const speed = (statOf(world, boss, 'speed') * attack.boost) / 100;
			boss.dash = { x: Math.cos(aim) * speed, y: Math.sin(aim) * speed, left: attack.seconds };
			boss.angle = aim;
			return;
		}
		case 'rain':
			if (attack.throwable) placeHazard(world, attack.throwable, 'near', attack.count);
			return;
		case 'summon': {
			if (!attack.entity) return;
			for (let i = 0; i < attack.count; i++) {
				const angle = world.random() * Math.PI * 2;
				const away = sizeOf(world, boss) * 0.6 + world.random() * 40;
				world.spawn(
					attack.entity,
					boss.x + Math.cos(angle) * away,
					boss.y + Math.sin(angle) * away
				);
			}
			return;
		}
		case 'teleport': {
			const arena = arenaOf(world);
			for (let attempt = 0; attempt < 12; attempt++) {
				const x =
					arena.left + HARD_EDGE + world.random() * (arena.right - arena.left - HARD_EDGE * 2);
				const y =
					arena.top + HARD_EDGE + world.random() * (arena.bottom - arena.top - HARD_EDGE * 2);
				if (Math.hypot(x - target.x, y - target.y) < 220 && attempt < 11) continue;
				advance(world, boss, x - boss.x, world.view === 'side' ? 0 : y - boss.y, false);
				return;
			}
		}
	}
}

/** A charge: straight ahead, hurting whatever it touches through its ordinary attack. */
function dash(world: World, boss: Body, dt: number): boolean {
	const dashing = boss.dash;
	if (!dashing) return false;
	dashing.left -= dt;
	const arena = arenaOf(world);
	const r = radiusOf(sizeOf(world, boss));
	const x = boss.x + dashing.x * dt;
	const y = world.view === 'side' ? boss.y : boss.y + dashing.y * dt;
	const out =
		x < arena.left + r + DASH_MARGIN ||
		x > arena.right - r - DASH_MARGIN ||
		y < arena.top + r + DASH_MARGIN ||
		y > arena.bottom - r - DASH_MARGIN;
	if (!out) {
		boss.x = x;
		boss.y = y;
	}
	boss.moving = true;
	if (dashing.left <= 0 || out) boss.dash = undefined;
	return true;
}
