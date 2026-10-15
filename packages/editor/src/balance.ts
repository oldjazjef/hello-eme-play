/**
 * The balance check: a bot plays a few seeded rounds of the configuration right in the editor
 * (`@hello-eme/play-sim`, no browser needed) and the result is boiled down to one verdict.
 */
import { resolveConfig, type PlayConfig } from '@hello-eme/play-schema';
import { simulate, type Report } from '@hello-eme/play-sim';

export type Verdict = 'balanced' | 'hard' | 'veryHard' | 'easy' | 'idle';

export interface Balance {
	verdict: Verdict;
	report: Report;
}

/** Few rounds, so the check answers while you edit (about a tenth of a second). */
export const BALANCE_ROUNDS = 10;
export const BALANCE_SECONDS = 90;

export function verdictOf(report: Report, config: PlayConfig, seconds = BALANCE_SECONDS): Verdict {
	const { rate } = report;
	// Nothing can hurt the figure and nothing can be won: there is no game.
	if (config.spawns.length === 0 && config.triggers.length === 0 && config.levels.length === 0) {
		return 'idle';
	}
	if (rate.died > 0.9 && report.seconds.median < seconds * 0.25) return 'veryHard';
	if (rate.died > 0.6) return 'hard';
	if (rate.timeout > 0.9 && rate.won === 0) return 'easy';
	return 'balanced';
}

/** Plays the rounds. Throws nothing: a configuration the sim chokes on counts as no result (`undefined`). */
export function runBalance(json: unknown): Balance | undefined {
	try {
		const config = resolveConfig(json);
		const report = simulate(json, { rounds: BALANCE_ROUNDS, seconds: BALANCE_SECONDS });
		return { verdict: verdictOf(report, config), report };
	} catch {
		return undefined;
	}
}
