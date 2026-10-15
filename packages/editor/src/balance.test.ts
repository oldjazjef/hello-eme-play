import { PRESETS, resolveConfig } from '@hello-eme/play-schema';
import { describe, expect, it } from 'vitest';
import { runBalance, verdictOf } from './balance.js';
import { applyQuick, QUICK_SETTINGS } from './quick.js';

const quick = (id: string) => {
	const found = QUICK_SETTINGS.find((setting) => setting.id === id);
	if (!found) throw new Error(id);
	return found;
};

describe('runBalance', () => {
	it('calls the classic game easy for a brawler bot', () => {
		expect(runBalance({})?.verdict).toBe('easy');
	});

	it('calls a brutal setup hard', () => {
		let stored: unknown = {};
		stored = applyQuick(stored, quick('figureHealth'), 10);
		stored = applyQuick(stored, quick('monsterAttack'), 50);
		stored = applyQuick(stored, quick('monsterSpeed'), 300);
		stored = applyQuick(stored, quick('spawnEvery'), 2);
		stored = applyQuick(stored, quick('spawnMax'), 40);
		const result = runBalance(stored);
		expect(['hard', 'veryHard']).toContain(result?.verdict);
	});

	it('has an answer for every preset (no crash)', () => {
		for (const [id, preset] of Object.entries(PRESETS)) {
			expect(runBalance(preset.config), id).toBeDefined();
		}
	});

	it('says idle when nothing can happen', () => {
		const empty = { spawns: [], triggers: [], levels: [] };
		const result = runBalance(empty);
		expect(result?.verdict).toBe('idle');
	});

	it('survives nonsense', () => {
		expect(() => runBalance('nonsense')).not.toThrow();
	});
});

describe('verdictOf', () => {
	it('is balanced when some die and some do not', () => {
		const report = runBalance({})?.report;
		if (!report) throw new Error('no report');
		const mixed = { ...report, rate: { won: 0.2, died: 0.4, timeout: 0.4 } };
		expect(verdictOf(mixed, resolveConfig({}))).toBe('balanced');
	});
});
