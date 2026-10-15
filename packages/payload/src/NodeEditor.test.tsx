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
});
