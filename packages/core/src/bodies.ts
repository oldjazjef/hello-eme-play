import type { EntityDefinition } from '@hello-eme/play-schema';
import type { Body } from './types.js';

/** A fresh body of an entity definition at a position; `scale` (percent) toughens it. */
export function createBody(
	id: number,
	def: string,
	definition: EntityDefinition,
	x: number,
	y: number,
	scale = 0
): Body {
	const factor = 1 + scale / 100;
	const stats = Object.fromEntries(
		Object.entries(definition.stats).map(([stat, value]) => [
			stat,
			['hp', 'attack', 'defense'].includes(stat) ? value * factor : value
		])
	);
	return {
		id,
		def,
		kind: definition.kind,
		x,
		y,
		angle: definition.kind === 'vehicle' ? 0 : Math.PI / 2,
		vx: 0,
		vy: 0,
		fall: 0,
		grounded: false,
		drop: 0,
		hp: stats.hp ?? 1,
		stats,
		mods: [],
		cooldown: 0.6,
		invulnerable: 0,
		hurt: 0,
		distance: 0,
		moving: false,
		jump: 0,
		pose: undefined,
		speed: 0,
		drift: 0,
		wander: { angle: 0, left: 0 },
		pilot: undefined,
		throwCooldown: 2,
		runOver: 0,
		parked: false,
		phase: 0
	};
}

/** Counts down a body's timers: cooldown, flashes, the pose being shown, temporary stat changes. */
export function tickBody(body: Body, dt: number): void {
	body.cooldown = Math.max(0, body.cooldown - dt);
	body.hurt = Math.max(0, body.hurt - dt);
	body.invulnerable = Math.max(0, body.invulnerable - dt);
	body.runOver = Math.max(0, body.runOver - dt);
	body.throwCooldown = Math.max(0, body.throwCooldown - dt);
	if (body.pose) {
		body.pose.left -= dt;
		if (body.pose.left <= 0) body.pose = undefined;
	}
	for (const mod of body.mods) mod.left -= dt;
	if (body.mods.some((mod) => mod.left <= 0)) body.mods = body.mods.filter((mod) => mod.left > 0);
}
