import { describe, expect, it } from 'vitest';
import { PRESETS } from '@hello-eme/play-schema';
import { simulate } from './sim.js';

describe('simulate', () => {
	it('is deterministic for a seed', () => {
		const a = simulate({}, { rounds: 3, seconds: 30, seed: 5 });
		const b = simulate({}, { rounds: 3, seconds: 30, seed: 5 });
		expect(a.rounds).toEqual(b.rounds);
	});

	it('an idle figure against strong monsters dies; a brawler against weak ones survives', () => {
		const deadly = {
			entities: {
				hero: { kind: 'figure', stats: { hp: 20, speed: 220 } },
				blob: { stats: { hp: 5, attack: 30, speed: 90 }, moves: ['bite'] }
			},
			spawns: [{ entity: 'blob', every: { min: 2, max: 2 }, count: { min: 3, max: 3 }, max: 10 }],
			visits: { enabled: false }
		};
		const idle = simulate(deadly, { rounds: 5, seconds: 60, bot: 'idle' });
		expect(idle.rate.died).toBe(1);
		const easy = { visits: { enabled: false }, spawns: [{ entity: 'blob' }] };
		const brawler = simulate(easy, { rounds: 5, seconds: 60, bot: 'brawler' });
		expect(brawler.rate.died).toBe(0);
		expect(brawler.kills.mean).toBeGreaterThan(0);
	});

	it('plays the levels of the arcade preset to a win or a timeout without crashing', () => {
		const report = simulate(PRESETS.arcade?.config, { rounds: 2, seconds: 400, step: 1 / 20 });
		expect(report.rounds).toHaveLength(2);
		expect(Object.keys(report.levels).length).toBeGreaterThan(0);
	});

	it('warns when a game is far too hard or never ends', () => {
		const deadly = {
			entities: {
				hero: { kind: 'figure', stats: { hp: 5, speed: 220 } },
				blob: { stats: { hp: 5, attack: 50, speed: 90 }, moves: ['bite'] }
			},
			spawns: [{ entity: 'blob', every: { min: 1, max: 1 }, count: { min: 5, max: 5 }, max: 20 }],
			visits: { enabled: false }
		};
		const hard = simulate(deadly, { rounds: 3, seconds: 120, bot: 'idle' });
		expect(hard.hints.join(' ')).toContain('Very hard');
		const peaceful = simulate(
			{ spawns: [], visits: { enabled: false } },
			{ rounds: 3, seconds: 10 }
		);
		expect(peaceful.rate.timeout).toBe(1);
	});
});
