/**
 * Boss phases: when a boss' health drops below a phase's percentage, the phase starts once (its
 * stat changes, its message, its actions). Phases that were skipped by one big hit all start, the
 * highest percentage first.
 */
import { runActions } from './triggers.js';
import type { Body, World } from './types.js';

/** Starts the phases of `body` whose threshold its health has fallen below. */
export function checkPhases(world: World, body: Body): void {
	const definition = world.config.entities[body.def];
	if (!definition || definition.kind !== 'monster' || !definition.boss) return;
	// Highest threshold first; `phase` counts how many of them already started.
	const phases = definition.phases
		.map((phase, index) => ({ phase, index }))
		.sort((a, b) => b.phase.below - a.phase.below);
	while (body.phase < phases.length && world.bodies.includes(body)) {
		const next = phases[body.phase];
		if (!next) return;
		const percent = (body.hp / Math.max(1, world.maxHp(body))) * 100;
		if (percent >= next.phase.below) return;
		body.phase += 1;
		startPhase(world, body, next.index);
	}
}

function startPhase(world: World, body: Body, index: number): void {
	const phase = world.config.entities[body.def]?.phases[index];
	if (!phase) return;
	for (const [stat, amount] of Object.entries(phase.stats)) {
		body.stats[stat] = (body.stats[stat] ?? 0) + amount;
		if (stat === 'hp') body.hp += amount;
	}
	if (phase.label) world.events.emit('message', { text: phase.label });
	world.events.emit('phase', { body, index, label: phase.label });
	runActions(world, phase.do);
}
