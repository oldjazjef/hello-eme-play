/** What protects a boss: a shield held by its helpers, and a weak spot on one side. */
import type { Body, World } from './types.js';

/** Whether a living helper keeps the boss safe. */
export function isShielded(world: World, body: Body): boolean {
	const shield = world.config.entities[body.def]?.shieldedBy;
	return !!shield && world.bodies.some((other) => other !== body && other.def === shield);
}

/** How much of a hit the boss takes, by where the attacker stands (1: all of it). */
export function weakness(world: World, body: Body, attacker: Body | undefined): number {
	const weak = world.config.entities[body.def]?.weakSpot;
	if (!weak || weak.side === 'any') return 1;
	const from = attacker ?? world.player;
	const diff = Math.atan2(from.y - body.y, from.x - body.x) - body.angle;
	const turn = Math.abs(Math.atan2(Math.sin(diff), Math.cos(diff)));
	const side = turn < Math.PI / 3 ? 'front' : turn > (Math.PI * 2) / 3 ? 'back' : 'flank';
	return side === weak.side ? weak.multiplier : weak.other;
}
