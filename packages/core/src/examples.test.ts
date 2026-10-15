/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { configProblems } from '@hello-eme/play-schema';
import { describe, expect, it } from 'vitest';
import { createWorld } from './world.js';

const example = (name: string): unknown =>
	JSON.parse(readFileSync(new URL(`../../../docs/examples/${name}.json`, import.meta.url), 'utf8'));

describe('docs/examples/key-bindings.json', () => {
	it('has no problems and binds B, V and H', () => {
		const json = example('key-bindings');
		expect(configProblems(json)).toEqual([]);
		const world = createWorld({ ...(json as object), spawns: [] }, { seed: 1 });
		world.press('KeyH');
		world.press('KeyB');
		expect(world.bodies.filter((body) => body.def === 'blob')).toHaveLength(1);
		world.press('KeyV');
		expect(world.view).toBe('side');
	});
});

describe('docs/examples/view-switch.json', () => {
	it('has no problems and switches the view back and forth', () => {
		const json = example('view-switch');
		expect(configProblems(json)).toEqual([]);
		const world = createWorld({ ...(json as object), spawns: [] }, { seed: 1 });
		const views = [world.view];
		for (let step = 0; step < 80 * 20; step++) {
			world.step(0.05);
			if (world.view !== views[views.length - 1]) views.push(world.view);
		}
		expect(views.slice(0, 4)).toEqual(['topdown', 'side', 'topdown', 'side']);
	});
});
