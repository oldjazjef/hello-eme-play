import { describe, expect, it } from 'vitest';
import { configProblems, DEFAULT_CONFIG, resolveConfig, resolveConfigFor } from './config.js';
import { matchPath, mergeConfig } from './pages.js';

describe('matchPath', () => {
	it('matches exact paths, ignoring a trailing slash, query and hash', () => {
		expect(matchPath('/projects', '/projects')).toBe(true);
		expect(matchPath('/projects', '/projects/')).toBe(true);
		expect(matchPath('/projects/', '/projects')).toBe(true);
		expect(matchPath('/projects', '/projects?x=1#top')).toBe(true);
		expect(matchPath('/projects', '/projects/a')).toBe(false);
		expect(matchPath('/projects', '/about')).toBe(false);
		expect(matchPath('/', '/')).toBe(true);
		expect(matchPath('/', '/blog')).toBe(false);
	});

	it('lets * stand for anything, and /* include the folder itself', () => {
		expect(matchPath('*', '/')).toBe(true);
		expect(matchPath('*', '/any/deep/path')).toBe(true);
		expect(matchPath('/blog/*', '/blog')).toBe(true);
		expect(matchPath('/blog/*', '/blog/')).toBe(true);
		expect(matchPath('/blog/*', '/blog/post/1')).toBe(true);
		expect(matchPath('/blog/*', '/blogger')).toBe(false);
		expect(matchPath('/*/news', '/en/news')).toBe(true);
		expect(matchPath('/*/news', '/en/blog')).toBe(false);
	});

	it('takes everything else literally and never matches an empty pattern', () => {
		expect(matchPath('/a.b', '/axb')).toBe(false);
		expect(matchPath('/a.b', '/a.b')).toBe(true);
		expect(matchPath('', '/')).toBe(false);
	});
});

describe('mergeConfig', () => {
	it('merges objects deeply and replaces arrays and values', () => {
		const base = { a: { b: 1, c: [1, 2] }, d: 'x', e: { f: 1 } };
		const over = { a: { c: [9] }, d: 'y', g: true };
		expect(mergeConfig(base, over)).toEqual({
			a: { b: 1, c: [9] },
			d: 'y',
			e: { f: 1 },
			g: true
		});
		expect(base.a.c).toEqual([1, 2]);
	});

	it('lets a different type replace the whole value', () => {
		expect(mergeConfig({ a: { b: 1 } }, { a: 5 })).toEqual({ a: 5 });
		expect(mergeConfig({ a: 5 }, { a: { b: 1 } })).toEqual({ a: { b: 1 } });
	});

	it('never changes the prototype', () => {
		const over = JSON.parse('{"__proto__": {"polluted": true}}');
		const merged = mergeConfig({}, over);
		expect((merged as { polluted?: boolean }).polluted).toBeUndefined();
		expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
	});
});

describe('pages', () => {
	const json = {
		view: { mode: 'topdown' },
		entities: { blob: { stats: { hp: 5 } } },
		spawns: [{ entity: 'blob' }],
		pages: [
			{ match: '/projects', config: { view: { mode: 'side' }, spawns: [] } },
			{ match: '/blog/*', config: { entities: { blob: { stats: { attack: 99 } } } } },
			{ match: '*', config: { game: { lives: 3 } } }
		]
	};

	it('are empty by default and kept as written', () => {
		expect(DEFAULT_CONFIG.pages).toEqual([]);
		expect(
			resolveConfig({ pages: [{ match: ' /a ', config: { view: { mode: 'side' } } }] }).pages
		).toEqual([{ match: '/a', config: { view: { mode: 'side' } } }]);
	});

	it('drop entries without a pattern and strip nested pages', () => {
		const config = resolveConfig({
			pages: [
				{ config: {} },
				'nonsense',
				{ match: '/a', config: { pages: [{ match: '*', config: {} }], view: { mode: 'side' } } },
				{ match: '/b' }
			]
		});
		expect(config.pages).toEqual([
			{ match: '/a', config: { view: { mode: 'side' } } },
			{ match: '/b', config: {} }
		]);
	});

	it('change nothing for a path without a match, except those matching everything', () => {
		const config = resolveConfigFor(json, '/about');
		expect(config.view.mode).toBe('topdown');
		expect(config.game.lives).toBe(3);
		expect(config.spawns).toHaveLength(1);
	});

	it('replace the view and the lists of the base on a matching page', () => {
		const config = resolveConfigFor(json, '/projects');
		expect(config.view.mode).toBe('side');
		expect(config.spawns).toEqual([]);
		expect(config.game.lives).toBe(3);
	});

	it('merge objects deeply into the base and resolve the result', () => {
		const config = resolveConfigFor(json, '/blog/hello');
		expect(config.entities.blob?.stats).toMatchObject({ hp: 5, attack: 99 });
		expect(config.entities.blob?.kind).toBe('monster');
		expect(config.view.mode).toBe('topdown');
	});

	it('apply every match in the order listed, later ones win', () => {
		const config = resolveConfigFor(
			{
				pages: [
					{ match: '*', config: { game: { lives: 2 }, view: { mode: 'side' } } },
					{ match: '/blog', config: { game: { lives: 5 } } }
				]
			},
			'/blog'
		);
		expect(config.game.lives).toBe(5);
		expect(config.view.mode).toBe('side');
	});

	it('are an alternative that fixes nonsense like the base does', () => {
		const config = resolveConfigFor(
			{ pages: [{ match: '/x', config: { view: { mode: 'sideways' }, hint: { hideAfter: -4 } } }] },
			'/x'
		);
		expect(config.view.mode).toBe('topdown');
		expect(config.hint.hideAfter).toBe(0);
	});

	it('keep the list on the resolved page configuration', () => {
		expect(resolveConfigFor(json, '/projects').pages).toEqual(resolveConfig(json).pages);
	});

	it('leave the old JSONs alone', () => {
		expect(resolveConfigFor({}, '/anything')).toEqual(DEFAULT_CONFIG);
		expect(resolveConfigFor(undefined, '/')).toEqual(DEFAULT_CONFIG);
		expect(resolveConfigFor({ enemies: { health: 9 } }, '/').entities.blob?.stats.hp).toBe(9);
	});
});

describe('configProblems for pages', () => {
	it('is empty for fine pages', () => {
		expect(
			configProblems({ pages: [{ match: '/projects', config: { view: { mode: 'side' } } }] })
		).toEqual([]);
	});

	it('names what is wrong inside a page, with its path', () => {
		const found = configProblems({
			pages: [
				{ match: '', config: {} },
				{ match: '/a', config: { view: { mode: 'sideways' }, bogus: 1 } },
				{ match: '/b', config: { pages: [] } },
				{ match: '/c', config: { spawns: [{ entity: 'ghost' }] } },
				{ match: '/d', config: 'x', extra: 1 },
				'x'
			]
		});
		expect(found).toContain('"pages[0].match" must be a path pattern like "/blog/*".');
		expect(found).toContain('"pages[1].config.view.mode" must be one of "topdown", "side".');
		expect(found).toContain('Unknown setting "pages[1].config.bogus".');
		expect(found).toContain('Unknown setting "pages[2].config.pages".');
		expect(found.some((m) => m.includes('"pages[3].config.spawns[0].entity"'))).toBe(true);
		expect(found).toContain('"pages[4].config" must be an object.');
		expect(found).toContain('Unknown setting "pages[4].extra".');
		expect(found).toContain('"pages[5]" must be an object.');
	});

	it('accepts entities a page defines itself', () => {
		expect(
			configProblems({
				pages: [
					{
						match: '/a',
						config: {
							entities: { ghost: { kind: 'monster' } },
							spawns: [{ entity: 'ghost' }]
						}
					}
				]
			})
		).toEqual([]);
	});

	it('says pages must be a list', () => {
		expect(configProblems({ pages: {} })).toContain('"pages" must be a list.');
	});
});
