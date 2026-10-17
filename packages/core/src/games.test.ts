import { configProblems, PRESETS, resolveConfig } from '@hello-eme/play-schema';
import { describe, expect, it } from 'vitest';
import { createStaticHost } from './space.js';
import { createWorld } from './world.js';

const games = Object.entries(PRESETS).filter(([id]) => id.startsWith('game-'));

describe('the example games', () => {
	it('are ten', () => {
		expect(games).toHaveLength(10);
	});

	it.each(games)('%s has no problems and complete pictures', (id, preset) => {
		expect(configProblems(preset.config), id).toEqual([]);
		const config = resolveConfig(preset.config);
		expect(Object.keys(config.entities).length, id).toBeGreaterThan(4);
		expect(Object.keys(config.sprites).length, id).toBeGreaterThan(5);
		for (const [name, definition] of Object.entries(config.entities)) {
			expect(config.sprites[definition.sprite], `${id}: ${name} needs a picture`).toBeDefined();
		}
		for (const [name, definition] of Object.entries(config.items)) {
			expect(config.sprites[definition.sprite], `${id}: item ${name}`).toBeDefined();
		}
		for (const [name, definition] of Object.entries(config.throwables)) {
			expect(config.sprites[definition.sprite], `${id}: throwable ${name}`).toBeDefined();
		}
		for (const sprite of Object.values(config.sprites)) {
			expect(sprite.url.startsWith('data:image/svg+xml,')).toBe(true);
		}
		expect(config.levels.length, id).toBeGreaterThanOrEqual(3);
		expect(Object.keys(config.upgrades).length, id).toBeGreaterThanOrEqual(3);
	});

	it.each(games)('%s runs for two minutes without trouble', (id, preset) => {
		const world = createWorld(preset.config, { seed: 5, host: createStaticHost() });
		for (let time = 0; time < 120; time += 1 / 20) {
			world.controls.axis.x = Math.sin(time / 3);
			world.controls.axis.y = Math.cos(time / 4);
			world.step(1 / 20);
			if (world.phase !== 'playing') break;
		}
		expect(world.bodies.length, id).toBeLessThan(260);
		expect(Number.isFinite(world.player.x) && Number.isFinite(world.player.y), id).toBe(true);
	});
});
