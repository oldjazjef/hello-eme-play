import { describe, expect, it } from 'vitest';
import { configProblems, DEFAULT_CONFIG, playJsonSchema, resolveConfig } from './config.js';
import { PRESETS } from './presets.js';
import { SCHEMA_VERSION } from './version.js';

describe('resolveConfig', () => {
	it('gives the classic game for nothing, nonsense or an empty object', () => {
		expect(resolveConfig(undefined)).toEqual(DEFAULT_CONFIG);
		expect(resolveConfig('x')).toEqual(DEFAULT_CONFIG);
		expect(resolveConfig({})).toEqual(DEFAULT_CONFIG);
		expect(DEFAULT_CONFIG.version).toBe(SCHEMA_VERSION);
	});

	it('spawns blobs in waves by default', () => {
		expect(DEFAULT_CONFIG.spawns).toEqual([
			{
				entity: 'blob',
				every: { min: 12, max: 30 },
				count: { min: 1, max: 3 },
				max: 8,
				fromLevel: 1,
				toLevel: 100,
				scalePerLevel: 0
			}
		]);
		expect(resolveConfig({ spawns: [] }).spawns).toEqual([]);
	});

	it('has the classic hero, blob, car, punch and kick', () => {
		expect(Object.keys(DEFAULT_CONFIG.entities)).toEqual(['hero', 'blob', 'car']);
		expect(DEFAULT_CONFIG.entities.hero).toMatchObject({
			kind: 'figure',
			moves: ['punch', 'kick'],
			stats: { hp: 100 }
		});
		expect(DEFAULT_CONFIG.moves.kick).toMatchObject({ keys: ['KeyQ'], power: 2 });
		expect(DEFAULT_CONFIG.keys.drift).toEqual(['Space', 'ShiftLeft', 'ShiftRight']);
	});

	it('fills gaps inside an entity and corrects nonsense', () => {
		const config = resolveConfig({
			entities: {
				hero: { kind: 'figure', stats: { hp: 'lots', attack: 2_000_000_000 } },
				ghost: { kind: 'wizard', size: -4, behavior: 'dance' }
			},
			spawns: [{ entity: 'ghost', every: { min: 50, max: 5 }, count: { min: 0.2, max: 99 } }],
			view: { mode: 'sideways' }
		});
		expect(config.entities.ghost).toMatchObject({ kind: 'monster', size: 8, behavior: 'chase' });
		expect(config.entities.hero?.stats.attack).toBe(1_000_000);
		expect(config.spawns[0]?.every).toEqual({ min: 5, max: 50 });
		expect(config.spawns[0]?.count).toEqual({ min: 1, max: 50 });
		expect(config.view.mode).toBe('topdown');
	});

	it('picks look, size and behavior from the kind unless the entity says otherwise', () => {
		const config = resolveConfig({
			entities: {
				hero: { kind: 'figure' },
				truck: { kind: 'vehicle', size: 120 },
				ghost: { kind: 'monster', look: 'figure' }
			}
		});
		expect(config.entities.hero).toMatchObject({ look: 'figure', behavior: 'stand', size: 50 });
		expect(config.entities.truck).toMatchObject({ look: 'car', behavior: 'arrive', size: 120 });
		expect(config.entities.ghost).toMatchObject({ look: 'figure', behavior: 'chase' });
	});

	it('brings the hero back when the played figure is missing', () => {
		const config = resolveConfig({ entities: { blob: { kind: 'monster' } } });
		expect(config.entities.hero?.kind).toBe('figure');
	});

	it('resolves every preset to a configuration without problems', () => {
		for (const [name, preset] of Object.entries(PRESETS)) {
			expect(configProblems(preset.config), name).toEqual([]);
			expect(resolveConfig(preset.config).version, name).toBe(SCHEMA_VERSION);
		}
	});
});

describe('configProblems', () => {
	it('is empty for fine JSON and for the empty object', () => {
		expect(configProblems({})).toEqual([]);
		expect(configProblems({ view: { mode: 'side' }, hint: { hideAfter: 2 } })).toEqual([]);
	});

	it('says what is wrong, in readable words', () => {
		const found = configProblems({
			view: { mode: 'sideways' },
			bogus: true,
			hint: { hideAfter: 'soon' },
			spawns: [{ entity: 'ghost' }],
			game: { player: 'blob' }
		});
		expect(found).toContain('"view.mode" must be one of "topdown", "side".');
		expect(found).toContain('Unknown setting "bogus".');
		expect(found).toContain('"hint.hideAfter" must be a number.');
		expect(found.some((message) => message.includes('"spawns[0].entity"'))).toBe(true);
		expect(found).toContain('"game.player" must name an entity of kind "figure".');
	});

	it('rejects anything but an object', () => {
		expect(configProblems([])).toEqual(['The configuration must be a JSON object.']);
	});

	it('checks actions and conditions inside triggers', () => {
		const found = configProblems({
			triggers: [{ on: 'kill', do: [{ do: 'spawn', entity: 'nobody', count: 2 }, { do: 'dance' }] }]
		});
		expect(found.some((message) => message.includes('triggers[0].do[0].entity'))).toBe(true);
		expect(found.some((message) => message.includes('triggers[0].do[1].do'))).toBe(true);
	});
});

describe('playJsonSchema', () => {
	it('describes the configuration as JSON Schema', () => {
		const schema = playJsonSchema();
		expect(schema.$schema).toContain('json-schema.org');
		expect(schema.type).toBe('object');
		expect(JSON.stringify(schema)).toContain('"topdown"');
	});
});

describe('waves', () => {
	it('are empty by default and get defaults for every field', () => {
		expect(DEFAULT_CONFIG.waves).toEqual([]);
		const config = resolveConfig({
			waves: [{ steps: [{ do: [{ do: 'spawn', entity: 'blob' }] }] }]
		});
		expect(config.waves).toEqual([
			{
				label: '',
				fromLevel: 1,
				toLevel: 100,
				after: 0,
				steps: [
					{
						at: 10,
						every: 10,
						repeat: 0,
						do: [{ do: 'spawn', entity: 'blob', count: 3, where: 'edge' }]
					}
				]
			}
		]);
	});

	it('correct nonsense', () => {
		const wave = resolveConfig({
			waves: [{ after: -5, steps: [{ at: 99999, every: 0, repeat: 2.4 }] }]
		}).waves[0];
		expect(wave?.after).toBe(0);
		expect(wave?.steps[0]).toMatchObject({ at: 3600, every: 0.5, repeat: 2, do: [] });
	});

	it('are checked: unknown entities, unknown actions, out of range numbers', () => {
		const found = configProblems({
			waves: [
				{
					steps: [
						{ at: -1, do: [{ do: 'spawn', entity: 'nobody' }, { do: 'dance' }] },
						{ at: 5, repeat: 5000 }
					]
				}
			]
		});
		expect(found.some((m) => m.includes('"waves[0].steps[0].do[0].entity"'))).toBe(true);
		expect(found.some((m) => m.includes('"waves[0].steps[0].do[1].do"'))).toBe(true);
		expect(found).toContain('"waves[0].steps[0].at" must be between 0 and 3600.');
		expect(found).toContain('"waves[0].steps[1].repeat" must be between 0 and 1000.');
	});
});

describe('boss phases', () => {
	it('are empty by default and resolved with defaults', () => {
		expect(DEFAULT_CONFIG.entities.blob?.phases).toEqual([]);
		const config = resolveConfig({
			entities: { king: { boss: true, phases: [{ below: 50, stats: { attack: 5 } }] } }
		});
		expect(config.entities.king?.phases).toEqual([
			{ below: 50, label: '', stats: { attack: 5 }, do: [] }
		]);
	});

	it('are checked: out of range, unknown entity in an action, not a boss', () => {
		const found = configProblems({
			entities: {
				king: {
					boss: true,
					phases: [{ below: 150, do: [{ do: 'spawn', entity: 'nobody' }] }, { below: -1 }]
				},
				imp: { kind: 'monster', phases: [{ below: 50 }] }
			}
		});
		expect(found).toContain('"entities.king.phases[0].below" must be between 0 and 100.');
		expect(found).toContain('"entities.king.phases[1].below" must be between 0 and 100.');
		expect(found.some((m) => m.includes('"entities.king.phases[0].do[0].entity"'))).toBe(true);
		expect(found).toContain('"entities.imp.phases" only work for monsters with "boss": true.');
		expect(found.filter((m) => m.includes('entities.king.phases" only'))).toEqual([]);
	});

	it('clamp below into 0..100 when resolved', () => {
		const phases = resolveConfig({
			entities: { king: { boss: true, phases: [{ below: 150 }, { below: -3 }] } }
		}).entities.king?.phases;
		expect(phases?.map((phase) => phase.below)).toEqual([100, 0]);
	});
});

describe('sprite sheets', () => {
	it('defaults to a single picture without animations', () => {
		const config = resolveConfig({ sprites: { hero: { url: '/hero.png' } } });
		expect(config.sprites.hero).toMatchObject({ columns: 1, rows: 1, fps: 8 });
		expect(config.sprites.hero?.animations.walk).toEqual([]);
	});

	it('keeps animations and corrects nonsense', () => {
		const config = resolveConfig({
			sprites: { hero: { url: '/h.png', columns: 4, rows: 0, animations: { walk: [1, 2, 9999] } } }
		});
		expect(config.sprites.hero).toMatchObject({ columns: 4, rows: 1 });
		expect(config.sprites.hero?.animations.walk).toEqual([1, 2, 4095]);
	});
});
