import { describe, expect, it } from 'vitest';
import {
	configProblems,
	DEFAULT_CONFIG,
	DEFAULT_DRIVE,
	playJsonSchema,
	resolveConfig
} from './config.js';
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

describe('key triggers', () => {
	it('have no keys by default and keep the ones given', () => {
		const [plain, bound] = resolveConfig({
			triggers: [{ on: 'key' }, { on: 'key', keys: ['KeyB'], do: [{ do: 'heal', amount: 20 }] }]
		}).triggers;
		expect(plain?.keys).toEqual([]);
		expect(bound).toMatchObject({ on: 'key', keys: ['KeyB'] });
	});

	it('are checked: no keys never fires, Escape is reserved', () => {
		expect(configProblems({ triggers: [{ on: 'key', keys: ['KeyB'] }] })).toEqual([]);
		expect(configProblems({ triggers: [{ on: 'kill' }] })).toEqual([]);
		const found = configProblems({
			triggers: [{ on: 'key' }, { on: 'key', keys: ['KeyB', 'Escape'] }]
		});
		expect(found).toContain('"triggers[0].keys" is empty: the trigger never fires.');
		expect(found).toContain(
			'"triggers[1].keys" can\'t contain "Escape": it always leaves the game.'
		);
	});

	it('show up in the JSON Schema', () => {
		expect(JSON.stringify(playJsonSchema())).toContain('"key"');
	});
});

describe('throwables and vehicles', () => {
	it('have defaults for every field, and none in the classic game', () => {
		expect(DEFAULT_CONFIG.throwables).toEqual({});
		const config = resolveConfig({ throwables: { bomb: {} } });
		expect(config.throwables.bomb).toMatchObject({
			look: 'bomb',
			where: 'both',
			direction: 'front',
			fuse: 2,
			ammo: 5,
			maxAmmo: 20,
			unlimited: false,
			hurtsFigure: false
		});
	});

	it("keep every vehicle on the car's handling unless it says otherwise", () => {
		const config = resolveConfig({
			entities: { bike: { kind: 'vehicle', drive: { grip: 50, reverse: 80 }, ram: { power: 2 } } }
		});
		expect(DEFAULT_CONFIG.entities.car?.drive).toEqual(DEFAULT_DRIVE);
		expect(config.entities.bike?.drive).toEqual({ ...DEFAULT_DRIVE, grip: 50, reverse: 80 });
		expect(config.entities.bike?.ram).toEqual({ power: 2, minSpeed: 0 });
		expect(config.entities.bike?.absorbs).toBe(false);
	});

	it('are corrected when out of bounds, and explained', () => {
		const json = { throwables: { bomb: { bounce: 4, fuse: -1, look: 'banana' } } };
		const config = resolveConfig(json);
		expect(config.throwables.bomb).toMatchObject({ bounce: 1, fuse: 0, look: 'bomb' });
		expect(configProblems(json).length).toBeGreaterThan(0);
	});

	it('check the throwable an ammo action refills', () => {
		const found = configProblems({
			triggers: [{ on: 'kill', do: [{ do: 'ammo', throwable: 'nothing', amount: 2 }] }]
		});
		expect(found.some((message) => message.includes('triggers[0].do[0].throwable'))).toBe(true);
	});
});

describe('triggers, objects and hideouts with pictures', () => {
	it('have defaults for the new conditions, actions and fields', () => {
		const config = resolveConfig({
			hideouts: { grass: { sprite: 'bush' } },
			items: { door: { pickup: 'none' } },
			triggers: [
				{
					on: 'touch',
					only: 'door',
					conditions: [{ if: 'ammo', throwable: 'bomb' }, { if: 'team' }, { if: 'riding' }],
					do: [{ do: 'hazard', throwable: 'bomb' }, { do: 'callTeam' }]
				}
			]
		});
		expect(config.hideouts.grass?.sprite).toBe('bush');
		expect(config.items.door).toMatchObject({ every: 1, pickup: 'none', solid: false });
		expect(config.triggers[0]?.conditions).toEqual([
			{ if: 'ammo', throwable: 'bomb', min: 1 },
			{ if: 'team', min: 1 },
			{ if: 'riding', entity: '' }
		]);
		expect(config.triggers[0]?.do[0]).toEqual({
			do: 'hazard',
			throwable: 'bomb',
			where: 'near',
			count: 1
		});
	});

	it('explain a hazard or an ammo condition that points at nothing', () => {
		const found = configProblems({
			triggers: [
				{
					on: 'explode',
					conditions: [{ if: 'ammo', throwable: 'ghost' }],
					do: [{ do: 'hazard', throwable: 'phantom' }]
				}
			]
		});
		expect(found.some((message) => message.includes('triggers[0].conditions[0].throwable'))).toBe(
			true
		);
		expect(found.some((message) => message.includes('triggers[0].do[0].throwable'))).toBe(true);
	});
});
