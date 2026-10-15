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
