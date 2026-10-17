import { resolveConfig } from '@hello-eme/play-schema';
import { describe, expect, it } from 'vitest';
import { analyzeFlow } from './flow.js';

const flow = (json: unknown) => analyzeFlow(resolveConfig(json), 'en');

describe('analyzeFlow', () => {
	it('has no steps in the classic game', () => {
		expect(flow({})).toEqual({ steps: [], warnings: [] });
	});

	it('describes a trigger and links it to the one it causes', () => {
		const result = flow({
			triggers: [
				{ on: 'kill', do: [{ do: 'setView', mode: 'side' }] },
				{ on: 'viewChange', do: [{ do: 'message', text: 'Whoa' }] }
			]
		});
		expect(result.steps).toHaveLength(2);
		expect(result.steps[0]).toMatchObject({ kind: 'trigger', event: 'kill', causes: [1] });
		expect(result.steps[1]?.causes).toEqual([]);
		expect(result.steps[0]?.actions[0]).toContain('Side-scroller');
		expect(result.warnings).toEqual([]);
	});

	it('includes item pickups and upgrades with effects as steps', () => {
		const result = flow({
			items: { star: { do: [{ do: 'points', amount: 50 }] } },
			upgrades: { power: { do: [{ do: 'heal', amount: 5 }] }, plain: {} }
		});
		expect(result.steps.map((step) => [step.kind, step.path])).toEqual([
			['item', 'items.star'],
			['upgrade', 'upgrades.power']
		]);
	});

	it('warns about a trigger that waits for something that cannot happen', () => {
		const result = flow({ triggers: [{ on: 'pickup', do: [{ do: 'heal', amount: 1 }] }] });
		expect(result.warnings).toContainEqual({
			code: 'noSource',
			path: 'triggers.0',
			event: 'pickup'
		});
	});

	it('treats a pressed key as always possible', () => {
		const result = flow({
			triggers: [{ on: 'key', keys: ['KeyB'], do: [{ do: 'heal', amount: 1 }] }]
		});
		expect(result.warnings).toEqual([]);
		expect(result.steps[0]?.when).toBe('A key is pressed (KeyB)');
	});

	it('does not warn once an item exists', () => {
		const result = flow({
			items: { star: {} },
			triggers: [{ on: 'pickup', do: [{ do: 'heal', amount: 1 }] }]
		});
		expect(result.warnings).toEqual([]);
	});

	it('warns about a trigger without actions', () => {
		expect(flow({ triggers: [{ on: 'start' }] }).warnings).toContainEqual({
			code: 'empty',
			path: 'triggers.0'
		});
	});

	it('finds a loop once', () => {
		const result = flow({
			triggers: [
				{ on: 'viewChange', do: [{ do: 'setView', mode: 'side' }] },
				{ on: 'levelUp', do: [{ do: 'nextLevel' }] },
				{ on: 'start', do: [{ do: 'setView', mode: 'topdown' }] }
			],
			levels: [{}, {}]
		});
		const loops = result.warnings.filter((warning) => warning.code === 'loop');
		expect(loops).toHaveLength(2);
		expect(loops).toContainEqual({ code: 'loop', path: 'triggers.0', paths: ['triggers.0'] });
		expect(loops).toContainEqual({ code: 'loop', path: 'triggers.1', paths: ['triggers.1'] });
	});

	it('finds a loop of two', () => {
		const result = flow({
			triggers: [
				{ on: 'viewChange', do: [{ do: 'nextLevel' }] },
				{ on: 'levelUp', do: [{ do: 'setView', mode: 'side' }] }
			],
			levels: [{}, {}]
		});
		const loop = result.warnings.find((warning) => warning.code === 'loop');
		expect(loop).toEqual({ code: 'loop', path: 'triggers.0', paths: ['triggers.0', 'triggers.1'] });
	});
});

describe('the flow knows the newer events', () => {
	it('an object with an effect is a step that waits for a touch; one without is not', () => {
		const found = flow({
			items: {
				door: { pickup: 'none', do: [{ do: 'points', amount: 5 }] },
				tree: { pickup: 'none', solid: true },
				coin: { do: [{ do: 'points', amount: 1 }] }
			}
		});
		const steps = found.steps
			.filter((step) => step.kind === 'item')
			.map((step) => [step.path, step.event]);
		expect(steps).toEqual([
			['items.door', 'touch'],
			['items.coin', 'pickup']
		]);
	});

	it('triggers on the new events only warn when nothing can cause them', () => {
		const warned = (config: unknown) =>
			flow(config).warnings.filter((warning) => warning.code === 'noSource').length;
		const trigger = (on: string) => ({ triggers: [{ on, do: [{ do: 'points', amount: 1 }] }] });
		expect(warned(trigger('explode'))).toBe(1);
		expect(warned({ ...trigger('explode'), throwables: { bomb: {} } })).toBe(0);
		expect(warned(trigger('wreck'))).toBe(1);
		expect(
			warned({ ...trigger('wreck'), entities: { truck: { kind: 'vehicle', absorbs: true } } })
		).toBe(0);
		expect(warned(trigger('breed'))).toBe(1);
		expect(
			warned({ ...trigger('breed'), entities: { blob: { breed: { every: { min: 5, max: 5 } } } } })
		).toBe(0);
		expect(warned(trigger('touch'))).toBe(1);
		expect(warned(trigger('summon'))).toBe(1);
		expect(warned({ ...trigger('summon'), throwables: { ball: { catch: 50 } } })).toBe(0);
	});

	it('a trap action leads on to the triggers waiting for its blast', () => {
		const found = flow({
			throwables: { trap: {} },
			triggers: [
				{ on: 'key', keys: ['KeyT'], do: [{ do: 'hazard', throwable: 'trap' }] },
				{ on: 'explode', do: [{ do: 'points', amount: 5 }] }
			]
		});
		expect(found.steps[0]?.causes).toContain(1);
	});
});
