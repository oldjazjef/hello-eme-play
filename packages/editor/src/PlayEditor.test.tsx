import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PlayEditor } from './PlayEditor.js';

const noop = () => undefined;
const render = (props: Partial<Parameters<typeof PlayEditor>[0]> = {}) =>
	renderToString(<PlayEditor value={{}} onChange={noop} {...props} />);

describe('PlayEditor', () => {
	it('opens in simple mode with the quick settings, the presets and the balance check', () => {
		const html = render();
		expect(html).toContain('Quick settings');
		expect(html).toContain('Guide');
		expect(html).toContain('Start from a preset');
		expect(html).toContain('Balance check');
		// Simple mode has no per-section tabs.
		expect(html).not.toContain('Characters');
		expect(html).toContain('type="range"');
	});

	it('shows every tab in expert mode', () => {
		const html = render({ defaultMode: 'expert' });
		for (const tab of [
			'Quick settings',
			'Game',
			'Characters',
			'Items &amp; upgrades',
			'Triggers',
			'Flow',
			'Guide',
			'Raw JSON'
		]) {
			expect(html, tab).toContain(tab);
		}
	});

	it('speaks German when asked', () => {
		const html = render({ lang: 'de' });
		expect(html).toContain('Schnell-Einstellungen');
		expect(html).toContain('Rückgängig');
		expect(html).toContain('Mit einer Vorlage starten');
	});

	it('lists problems with a way to the field', () => {
		const html = render({ value: { spawns: [{ entity: 'nobody' }] } });
		expect(html).toContain('spawns[0].entity');
		expect(html).toContain('Go to field');
	});

	it('lists nothing when the configuration is fine', () => {
		expect(render()).toContain('No problems found.');
	});

	it('only offers "Try it" when there is a preview page', () => {
		expect(render()).not.toContain('Try it');
		expect(render({ previewUrl: 'https://example.com/play-preview' })).toContain('Try it');
	});

	it('shows the preview next to the form when given a page', () => {
		const html = render({ previewUrl: 'https://example.com/play-preview' });
		expect(html).toContain('<iframe');
	});

	it('has undo and redo, disabled at the start', () => {
		const html = render();
		expect(html).toMatch(/<button[^>]*disabled[^>]*>↶ (<!-- -->)?Undo/);
		expect(html).toMatch(/<button[^>]*disabled[^>]*>↷ (<!-- -->)?Redo/);
	});

	it('tolerates nonsense as the value', () => {
		expect(() => render({ value: 'nonsense' })).not.toThrow();
		expect(() => render({ value: null })).not.toThrow();
	});

	it('defines its colours itself, so it works outside Payload', () => {
		expect(render()).toContain('--pe-border');
	});
});
