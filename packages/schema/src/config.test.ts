import { describe, expect, it } from 'vitest';
import { configProblems, DEFAULT_CONFIG, resolveConfig, SCHEMA_VERSION } from './config.js';
import { migrate } from './migrate.js';

describe('resolveConfig', () => {
	it('uses the defaults for a missing or nonsense configuration', () => {
		expect(resolveConfig(undefined)).toEqual(DEFAULT_CONFIG);
		expect(resolveConfig({})).toEqual(DEFAULT_CONFIG);
		expect(resolveConfig('nonsense')).toEqual(DEFAULT_CONFIG);
	});

	it('takes the perspective, stats, entities and spawns from the JSON', () => {
		const config = resolveConfig({
			view: { mode: 'side' },
			entities: {
				blob: { kind: 'monster', stats: { hp: 20, nope: 5 }, reward: { points: 100 } }
			},
			spawns: [
				{ entity: 'blob', every: { min: 30, max: 10 }, count: { min: 1, max: 3 }, max: 8 },
				{ entity: 'ghost' }
			]
		});
		expect(config.view.mode).toBe('side');
		expect(config.entities.blob).toMatchObject({
			kind: 'monster',
			stats: { hp: 20 },
			behavior: 'chase',
			reward: { points: 100 }
		});
		// Swapped ends are put in order; the rule for the unknown entity is dropped.
		expect(config.spawns).toEqual([
			{
				entity: 'blob',
				every: { min: 10, max: 30 },
				count: { min: 1, max: 3 },
				max: 8,
				fromLevel: 1
			}
		]);
	});

	it('keeps numbers in bounds', () => {
		const config = resolveConfig({
			entities: { tank: { stats: { hp: 1e9 } } },
			spawns: [{ entity: 'tank', max: 1e6, count: { min: 0, max: 1e6 } }]
		});
		expect(config.entities.tank?.stats.hp).toBe(9999);
		expect(config.spawns[0]).toMatchObject({ max: 200, count: { min: 1, max: 50 } });
	});
});

describe('configProblems', () => {
	it('has nothing to say about the defaults', () => {
		expect(configProblems(DEFAULT_CONFIG)).toEqual([]);
		expect(configProblems({})).toEqual([]);
	});

	it('names what would be ignored', () => {
		expect(
			configProblems({
				enemis: {},
				view: { mode: 'isometric' },
				entities: { blob: {} },
				spawns: [{ entity: 'ghost' }]
			})
		).toEqual([
			'Unknown setting "enemis".',
			'"view.mode" must be "topdown" or "side".',
			'"spawns[0].entity" must name an entity from "entities".'
		]);
		expect(configProblems([])).toEqual(['The configuration must be a JSON object.']);
	});
});

describe('migrate', () => {
	it('brings an unversioned JSON to the current version and leaves current ones alone', () => {
		expect(migrate({ view: { mode: 'side' } })).toEqual({
			view: { mode: 'side' },
			version: SCHEMA_VERSION
		});
		const current = { version: SCHEMA_VERSION, spawns: [] };
		expect(migrate(current)).toEqual(current);
		expect(migrate('text')).toBe('text');
	});
});
