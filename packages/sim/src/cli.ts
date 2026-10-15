#!/usr/bin/env node
/** `play-sim config.json [--rounds 20] [--seconds 120] [--bot brawler] [--seed 1] [--json]` */
import { readFile } from 'node:fs/promises';
import { PRESETS } from '@hello-eme/play-schema';
import { BOTS, type BotName } from './bot.js';
import { simulate, type Report, type Summary } from './sim.js';

const USAGE = `Usage: play-sim <config.json | preset:name> [options]

  --rounds <n>     rounds to play (default 20)
  --seconds <n>    longest round in game seconds (default 120)
  --bot <name>     ${BOTS.join(' | ')} (default brawler)
  --seed <n>       first seed (default 1)
  --json           print the whole report as JSON

Presets: ${Object.keys(PRESETS).join(', ')}`;

function option(args: string[], name: string): string | undefined {
	const index = args.indexOf(`--${name}`);
	return index >= 0 ? args[index + 1] : undefined;
}

const number = (value: string | undefined, fallback: number): number => {
	const parsed = Number(value);
	return value !== undefined && Number.isFinite(parsed) ? parsed : fallback;
};

const fixed = (summary: Summary): string =>
	`mean ${summary.mean.toFixed(1)}  median ${summary.median.toFixed(1)}  p90 ${summary.p90.toFixed(1)}  (${summary.min.toFixed(0)}–${summary.max.toFixed(0)})`;

export function format(report: Report): string {
	const percent = (share: number) => `${Math.round(share * 100)}%`;
	return [
		`Rounds: ${report.rounds.length}   won ${percent(report.rate.won)}   died ${percent(report.rate.died)}   timeout ${percent(report.rate.timeout)}`,
		`Seconds: ${fixed(report.seconds)}`,
		`Score:   ${fixed(report.score)}`,
		`Kills:   ${fixed(report.kills)}`,
		`Levels reached: ${Object.entries(report.levels)
			.map(([level, count]) => `${level}: ${count}`)
			.join('  ')}`,
		...report.hints.map((hint) => `! ${hint}`)
	].join('\n');
}

async function main(args: string[]): Promise<number> {
	const target = args.find(
		(arg, index) =>
			!arg.startsWith('--') && !(args[index - 1]?.startsWith('--') && args[index - 1] !== '--json')
	);
	if (!target || args.includes('--help')) {
		console.log(USAGE);
		return target ? 0 : 1;
	}
	const bot = option(args, 'bot') ?? 'brawler';
	if (!BOTS.some((name) => name === bot)) {
		console.error(`Unknown bot "${bot}". ${USAGE}`);
		return 1;
	}
	const preset = target.startsWith('preset:') ? PRESETS[target.slice('preset:'.length)] : undefined;
	if (target.startsWith('preset:') && !preset) {
		console.error(`Unknown preset "${target}". ${USAGE}`);
		return 1;
	}
	const config: unknown = preset ? preset.config : JSON.parse(await readFile(target, 'utf8'));
	const report = simulate(config, {
		rounds: number(option(args, 'rounds'), 20),
		seconds: number(option(args, 'seconds'), 120),
		seed: number(option(args, 'seed'), 1),
		bot: bot as BotName
	});
	console.log(args.includes('--json') ? JSON.stringify(report, null, 2) : format(report));
	return 0;
}

process.exitCode = await main(process.argv.slice(2));
