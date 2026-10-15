import { describe, expect, it } from 'vitest';
import { resolveConfig } from './config.js';
import { isLegacy, migrate } from './migrate.js';

describe('migrate', () => {
	it('leaves current JSONs alone', () => {
		const json = { version: 1, view: { mode: 'side' } };
		expect(migrate(json)).toBe(json);
		expect(isLegacy({})).toBe(false);
		expect(isLegacy({ entities: {}, health: 5 })).toBe(false);
	});

	it('turns a page-game JSON into the same game', () => {
		const config = resolveConfig({
			enabled: true,
			health: 150,
			kick: false,
			enemies: {
				delay: { min: 5, max: 9 },
				count: { min: 2, max: 4 },
				max: 5,
				speed: 90,
				health: 3,
				damage: 7,
				overrun: false
			},
			score: { enemy: 50, broken: 3 },
			keys: { punch: ['KeyF'], jump: ['KeyJ'] },
			car: { enabled: false },
			visits: { delay: { min: 3, max: 4 } },
			hint: { hideAfter: 0 },
			locale: 'en',
			texts: { toggle: 'Play!' },
			sprites: {
				figure: 'https://x.test/me.svg',
				enemy: { url: '/e.png', size: 60, facing: 'down' }
			}
		});
		expect(config.entities.hero).toMatchObject({
			stats: { hp: 150 },
			moves: ['punch'],
			sprite: 'figure'
		});
		expect(config.entities.blob).toMatchObject({
			stats: { speed: 90, hp: 3, attack: 7 },
			reward: { points: 50 },
			sprite: 'enemy',
			size: 60
		});
		expect(config.sprites.enemy).toMatchObject({ url: '/e.png', facing: 'down' });
		expect(config.sprites.figure?.url).toBe('https://x.test/me.svg');
		expect(config.spawns).toEqual([
			{
				entity: 'blob',
				every: { min: 5, max: 9 },
				count: { min: 2, max: 4 },
				max: 5,
				fromLevel: 1,
				toLevel: 100,
				scalePerLevel: 0
			}
		]);
		expect(config.moves.punch?.keys).toEqual(['KeyF']);
		expect(config.keys.jump).toEqual(['KeyJ']);
		expect(config.game.breakPoints).toBe(3);
		expect(config.game.overrunSpeed).toBe(5000);
		expect(config.visits).toMatchObject({ whilePlaying: false, delay: { min: 3, max: 4 } });
		expect(config.hint.hideAfter).toBe(0);
		expect(config.locale).toBe('en');
		expect(config.texts.toggle).toBe('Play!');
	});

	it('turns enemies off', () => {
		expect(resolveConfig({ enemies: { enabled: false } }).spawns).toEqual([]);
	});
});
