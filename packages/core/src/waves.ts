/**
 * Wave scripts: a small timed script per level. Each wave of the configuration whose level range
 * contains the current level starts `after` seconds into the level; its steps then run their
 * actions at `at` seconds, repeating `repeat` more times every `every` seconds. Time is the
 * world's clock and the actions use the world's random numbers, so the same seed and the same
 * inputs give the same round.
 *
 * A scheduler of its own (instead of compiling to `interval` triggers) because triggers count from
 * the start of the round, not from the start of a level, and have no level range or run limit;
 * the actions themselves are the existing ones, run by `runActions`.
 */
import { stateOf } from './state.js';
import { runActions } from './triggers.js';
import type { World } from './types.js';

/** A wave that applies to the current level. `runs[i]`: how often step `i` ran already. */
export interface ActiveWave {
	index: number;
	/** World time (s) the wave starts. */
	start: number;
	runs: number[];
}

/** A level began: the waves for it start their clock (those of the level before are dropped). */
export function startWaves(world: World): void {
	const state = stateOf(world);
	state.waves = world.config.waves.flatMap((wave, index) =>
		world.level >= wave.fromLevel && world.level <= wave.toLevel
			? [{ index, start: world.time + wave.after, runs: wave.steps.map(() => 0) }]
			: []
	);
}

/** Runs the steps that are due. */
export function tickWaves(world: World): void {
	const state = stateOf(world);
	const waves = state.waves;
	for (const active of waves) {
		const wave = world.config.waves[active.index];
		if (!wave) continue;
		for (const [stepIndex, step] of wave.steps.entries()) {
			for (;;) {
				const runs = active.runs[stepIndex] ?? 0;
				if (runs > step.repeat) break;
				if (world.time < active.start + step.at + runs * step.every) break;
				active.runs[stepIndex] = runs + 1;
				world.events.emit('wave', { index: active.index, label: wave.label, step: stepIndex });
				runActions(world, step.do);
				// The actions ended the round or started another level: this script is over.
				if (world.phase !== 'playing' || state.waves !== waves) return;
			}
		}
	}
}
