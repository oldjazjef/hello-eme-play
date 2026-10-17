import { PLAY_SCHEMA, resolveConfig, type Node } from '@hello-eme/play-schema';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { EditorContext } from './fields/types.js';
import { LABELS } from './labels.js';
import { NodeEditor } from './NodeEditor.js';

const ctx = (lang: 'de' | 'en'): EditorContext => ({
	lang,
	labels: LABELS[lang],
	root: resolveConfig({}),
	media: [{ label: 'a.png', url: '/media/a.png' }]
});

const noop = () => undefined;

/** Every node type that appears below `node`. */
function types(node: Node, found = new Set<string>()): Set<string> {
	found.add(node.type);
	if (node.type === 'object') Object.values(node.fields).forEach((field) => types(field, found));
	if (node.type === 'record' || node.type === 'list') types(node.of, found);
	if (node.type === 'union') {
		Object.values(node.variants).forEach((variant) =>
			Object.values(variant.fields).forEach((field) => types(field, found))
		);
	}
	return found;
}

describe('NodeEditor', () => {
	it('uses every node type in the schema', () => {
		expect([...types(PLAY_SCHEMA)].sort()).toEqual(
			[
				'boolean',
				'keys',
				'list',
				'number',
				'object',
				'range',
				'record',
				'ref',
				'select',
				'string',
				'union'
			].sort()
		);
	});

	it('renders the whole schema, empty, in both languages', () => {
		for (const lang of ['de', 'en'] as const) {
			const html = renderToString(
				<NodeEditor node={PLAY_SCHEMA} value={{}} path="" ctx={ctx(lang)} onChange={noop} />
			);
			expect(html).toContain(lang === 'de' ? 'Spielregeln' : 'Rules');
			expect(html).toContain('<details');
		}
	});

	it('renders written values, lists and unions (the default triggers and sprites)', () => {
		const value = {
			view: { mode: 'side' },
			sprites: { hero: { url: '/media/a.png' } },
			triggers: [{ on: 'start', do: [{ do: 'points', amount: 5 }] }],
			moves: { punch: { keys: ['Space', 'KeyQ'] } }
		};
		const html = renderToString(
			<NodeEditor node={PLAY_SCHEMA} value={value} path="" ctx={ctx('en')} onChange={noop} />
		);
		expect(html).toContain('/media/a.png');
		expect(html).toContain('Space, KeyQ');
		expect(html).toContain('Choose from media');
	});

	it('renders the sprite sheet settings and animation frames', () => {
		const value = {
			sprites: { hero: { url: '/a.png', columns: 4, rows: 2, animations: { walk: [4, 5, 6] } } }
		};
		const html = renderToString(
			<NodeEditor node={PLAY_SCHEMA} value={value} path="" ctx={ctx('en')} onChange={noop} />
		);
		expect(html).toContain('Sheet columns');
		expect(html).toContain('Walk');
		expect(html).toContain('value="6"');
	});

	it('shows entities and items as cards and edits only the chosen one', () => {
		const value = {
			sprites: { hero: { url: '/media/a.png', columns: 2 } },
			entities: {
				hero: { kind: 'figure', label: 'Hero', sprite: 'hero', stats: { hp: 80, speed: 150 } },
				blob: { label: 'Blobby' }
			}
		};
		const html = renderToString(
			<NodeEditor
				node={PLAY_SCHEMA}
				value={value}
				path=""
				ctx={{ ...ctx('en'), root: resolveConfig(value) }}
				onChange={noop}
			/>
		);
		expect(html).toContain('aria-pressed="true"');
		expect(html).toContain('Figure · HP 80 · Speed 150');
		expect(html).toContain('background-size:200% 100%');
		expect(html).toContain('Blobby');
		// Only the chosen card (the first) has its form open; the other's fields are not rendered.
		expect(html.match(/value="Hero"/g)?.length).toBe(1);
		expect(html).not.toContain('value="Blobby"');
	});
});

describe('problems at the field', () => {
	it('shows a problem under its field and a count on the section', () => {
		const html = renderToString(
			<NodeEditor
				node={PLAY_SCHEMA}
				value={{ game: { lives: 500 } }}
				path=""
				onChange={noop}
				ctx={{
					...ctx('en'),
					problems: { 'game.lives': ['"game.lives" must be between 1 and 99.'] }
				}}
			/>
		);
		expect(html).toContain('must be between 1 and 99');
		expect(html).toContain('data-pe-path="game.lives"');
		expect(html).toMatch(/⚠ (<!-- -->)?1/);
	});
});

describe('cards show what things look like', () => {
	const render = (value: unknown) =>
		renderToString(
			<NodeEditor
				node={PLAY_SCHEMA}
				value={value}
				path=""
				onChange={noop}
				ctx={{ ...ctx('en'), root: resolveConfig(value) }}
			/>
		);

	it('draws the built-in picture of figures, monsters and vehicles', () => {
		const html = render({});
		// Hero, Blob and Car: one drawing each (rects in the game's colours).
		expect(html.match(/<svg viewBox="-10 -10/g)?.length).toBeGreaterThanOrEqual(3);
		expect(html).toContain('var(--play-body');
		expect(html).toContain('var(--play-car');
		expect(html).toContain('var(--play-enemy');
	});

	it('draws items by their look', () => {
		const html = render({ items: { star: { look: 'star' }, heart: { look: 'heart' } } });
		expect(html.match(/<svg viewBox="-60 -60 120 120"/g)).toHaveLength(2);
		expect(html).toContain('var(--play-item-alt');
	});

	it('draws throwables by their look, with where they work and their ammo', () => {
		const html = render({
			throwables: { bomb: { look: 'bomb', ammo: 5 }, mine: { look: 'mine', where: 'vehicle' } }
		});
		expect(html.match(/<svg viewBox="-60 -60 120 120"/g)).toHaveLength(2);
		expect(html).toContain('× 5');
		expect(html).toContain('In a vehicle');
	});

	it('shows a custom picture instead of the built-in one, and pictures of the library as cards', () => {
		const html = render({
			sprites: { hero: { url: '/media/hero.png', size: 64, columns: 4 } },
			entities: { hero: { kind: 'figure', sprite: 'hero' } }
		});
		expect(html).toContain('url(&quot;/media/hero.png&quot;)');
		// The library is a card grid too: the picture, its size and its sheet.
		expect(html).toContain('64 px');
		expect(html).toContain('4 × 1');
	});
});
