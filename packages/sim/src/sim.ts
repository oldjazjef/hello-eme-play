import { createStaticHost, createWorld, type StaticHostOptions } from '@hello-eme/play-core';
import { resolveConfig, type PlayConfig } from '@hello-eme/play-schema';
import { botByName, type Bot, type BotName } from './bot.js';

export interface SimOptions {
	/** Rounds to play, each with its own seed (`seed`, `seed + 1` …). Default 20. */
	rounds?: number;
	/** Longest a round lasts, in game seconds. Default 120. */
	seconds?: number;
	/** The player: a built-in bot or a function. Default `brawler`. */
	bot?: BotName | Bot;
	seed?: number;
	/** Length of one simulated step in seconds. Default 1/30. */
	step?: number;
	/** The page the rounds are played on. */
	page?: StaticHostOptions;
}

export type Outcome = 'won' | 'died' | 'timeout';

export interface Round {
	seed: number;
	outcome: Outcome;
	seconds: number;
	score: number;
	kills: number;
	level: number;
	health: number;
	upgrades: number;
}

export interface Summary {
	mean: number;
	median: number;
	p90: number;
	min: number;
	max: number;
}

export interface Report {
	rounds: Round[];
	rate: Record<Outcome, number>;
	seconds: Summary;
	score: Summary;
	kills: Summary;
	/** How many rounds reached each level. */
	levels: Record<number, number>;
	/** Plain-language hints about the balance. */
	hints: string[];
}

function summarize(values: readonly number[]): Summary {
	const sorted = [...values].sort((a, b) => a - b);
	const at = (share: number) =>
		sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * share))] ?? 0;
	const mean = sorted.reduce((sum, value) => sum + value, 0) / Math.max(1, sorted.length);
	return {
		mean,
		median: at(0.5),
		p90: at(0.9),
		min: sorted[0] ?? 0,
		max: sorted[sorted.length - 1] ?? 0
	};
}

/** Plays one round to its end (won, died) or to the time limit. */
export function playRound(
	config: PlayConfig,
	bot: Bot,
	seed: number,
	seconds: number,
	step: number,
	page?: StaticHostOptions
): Round {
	const world = createWorld(config, { seed, host: createStaticHost(page) });
	while (world.phase === 'playing' && world.time < seconds) {
		bot(world, step);
		world.step(step);
	}
	const outcome: Outcome =
		world.phase === 'won' ? 'won' : world.phase === 'over' ? 'died' : 'timeout';
	return {
		seed,
		outcome,
		seconds: world.time,
		score: world.stats.earned,
		kills: world.stats.kills,
		level: world.level,
		health: Math.max(0, world.player.hp),
		upgrades: world.stats.upgrades
	};
}

/** Plays many seeded rounds of a configuration (any JSON) and reports how they went. */
export function simulate(json: unknown, options: SimOptions = {}): Report {
	const config = resolveConfig(json);
	const rounds = options.rounds ?? 20;
	const seconds = options.seconds ?? 120;
	const seed = options.seed ?? 1;
	const step = options.step ?? 1 / 30;
	const bot = typeof options.bot === 'function' ? options.bot : botByName[options.bot ?? 'brawler'];
	const played = Array.from({ length: rounds }, (_, index) =>
		playRound(config, bot, seed + index, seconds, step, options.page)
	);

	const rate = { won: 0, died: 0, timeout: 0 };
	const levels: Record<number, number> = {};
	for (const round of played) {
		rate[round.outcome] += 1 / Math.max(1, played.length);
		for (let level = 1; level <= round.level; level++) levels[level] = (levels[level] ?? 0) + 1;
	}
	const report: Report = {
		rounds: played,
		rate,
		seconds: summarize(played.map((round) => round.seconds)),
		score: summarize(played.map((round) => round.score)),
		kills: summarize(played.map((round) => round.kills)),
		levels,
		hints: []
	};
	report.hints = hintsFor(report, seconds, config);
	return report;
}

function hintsFor(report: Report, limit: number, config: PlayConfig): string[] {
	const hints: string[] = [];
	const { rate } = report;
	if (rate.died > 0.9 && report.seconds.median < limit * 0.25) {
		hints.push(
			"Very hard: almost every round ends in death within a quarter of the time. Lower the monsters' attack or raise the figure's hp."
		);
	}
	if (rate.timeout > 0.9 && config.spawns.length > 0) {
		hints.push(
			"Very easy: nobody dies and nobody wins. Raise the monsters' attack or spawn more of them."
		);
	}
	if (config.levels.length > 0 && rate.won === 0 && rate.timeout > 0.5) {
		hints.push(
			'The last level is never reached in the time given: shorten the goals or raise the time limit.'
		);
	}
	if (report.kills.max === 0 && config.spawns.length > 0) {
		hints.push("The bot beat no monster at all: check the spawn rules and the figure's moves.");
	}
	return hints;
}
