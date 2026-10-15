import { configProblems, resolveConfig } from '@hello-eme/play-schema';
import { describe, expect, it } from 'vitest';
import { applyQuick, QUICK_SETTINGS, quickValues } from './quick.js';

const setting = (id: string) => {
	const found = QUICK_SETTINGS.find((candidate) => candidate.id === id);
	if (!found) throw new Error(`no setting ${id}`);
	return found;
};

describe('quick settings', () => {
	it('read the classic defaults', () => {
		const values = Object.fromEntries(
			quickValues(resolveConfig({})).map(({ setting: s, value }) => [s.id, value])
		);
		expect(values).toMatchObject({
			view: 'topdown',
			lives: 1,
			figureHealth: 100,
			figureSpeed: 220,
			monsterHealth: 2,
			monsterAttack: 10,
			monsterSpeed: 70,
			spawnEvery: 21,
			spawnMax: 8,
			visits: true,
			audio: false
		});
	});

	it('write what the full form would store, and read back the same value', () => {
		for (const { setting: s } of quickValues(resolveConfig({}))) {
			const value =
				s.control.kind === 'boolean' ? false : s.control.kind === 'select' ? 'side' : s.control.min;
			const stored = applyQuick({}, s, value);
			expect(configProblems(stored), s.id).toEqual([]);
			expect(s.read(resolveConfig(stored)), s.id).toBe(value);
		}
	});

	it('changing a monster stat keeps the other entities and their stats', () => {
		const stored = applyQuick({}, setting('monsterHealth'), 9);
		const config = resolveConfig(stored);
		expect(config.entities.blob?.stats.hp).toBe(9);
		expect(config.entities.blob?.stats.attack).toBe(10);
		expect(config.entities.hero?.stats.hp).toBe(100);
		expect(config.entities.car).toBeDefined();
	});

	it('a second change on top of a stored one keeps the first', () => {
		let stored = applyQuick({}, setting('monsterHealth'), 9);
		stored = applyQuick(stored, setting('monsterSpeed'), 150);
		const blob = resolveConfig(stored).entities.blob;
		expect(blob?.stats).toMatchObject({ hp: 9, speed: 150 });
	});

	it('keeps other stored settings and does not mutate its input', () => {
		const input = { game: { lives: 3 }, locale: 'en' };
		const copy = structuredClone(input);
		const stored = applyQuick(input, setting('spawnMax'), 12);
		expect(input).toEqual(copy);
		expect(stored).toMatchObject({ game: { lives: 3 }, locale: 'en' });
		expect(resolveConfig(stored).spawns[0]?.max).toBe(12);
	});

	it('keeps a spread around the average spawn time', () => {
		const config = resolveConfig(applyQuick({}, setting('spawnEvery'), 10));
		expect(config.spawns[0]?.every).toEqual({ min: 6, max: 14 });
	});

	it('clamps out-of-range values', () => {
		expect(resolveConfig(applyQuick({}, setting('lives'), 99)).game.lives).toBe(9);
		expect(
			resolveConfig(applyQuick({}, setting('monsterHealth'), -5)).entities.blob?.stats.hp
		).toBe(1);
	});

	it('hides the monster settings when there are no spawn rules', () => {
		const ids = quickValues(resolveConfig({ spawns: [] })).map(({ setting: s }) => s.id);
		expect(ids).not.toContain('monsterHealth');
		expect(ids).not.toContain('spawnEvery');
		expect(ids).toContain('lives');
	});
});
