import { PRESETS } from '@hello-eme/play-schema';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { httpUrl, PlayEditor } from './PlayEditor.js';

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

	it('gives each preset card one button: Try it with a preview, Use without', () => {
		const withPreview = render({ previewUrl: 'https://example.com/play-preview' });
		expect(withPreview).not.toContain('Use this preset');
		expect(withPreview.match(/Try it/g)).toHaveLength(Object.keys(PRESETS).length);
		const without = render();
		expect(without).not.toContain('Try it');
		expect(without.match(/Use this preset/g)).toHaveLength(Object.keys(PRESETS).length);
	});

	it('offers the preview in full screen', () => {
		expect(render({ previewUrl: 'https://example.com/play-preview' })).toContain('Full screen');
		expect(render({ lang: 'de', previewUrl: 'https://example.com/play-preview' })).toContain(
			'Vollbild'
		);
		expect(render()).not.toContain('Full screen');
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

	it('shows a coffee link only for a web address, opening in a new tab without a referrer', () => {
		const html = render({ supportUrl: 'https://buymeacoffee.com/someone' });
		expect(html).toContain('href="https://buymeacoffee.com/someone"');
		expect(html).toContain('Buy me a coffee');
		expect(html).toContain('rel="noopener noreferrer"');
		expect(render({ lang: 'de', supportUrl: 'https://example.com/x' })).toContain(
			'Kaffee spendieren'
		);
		expect(render()).not.toContain('Buy me a coffee');
		expect(render({ supportUrl: 'javascript:alert(1)' })).not.toContain('Buy me a coffee');
		expect(render({ supportUrl: 'not a url' })).not.toContain('Buy me a coffee');
	});

	it('httpUrl lets only http and https through', () => {
		expect(httpUrl('https://a.example/b')).toBe('https://a.example/b');
		expect(httpUrl('http://a.example')).toBe('http://a.example/');
		expect(httpUrl('data:text/html,hi')).toBeUndefined();
		expect(httpUrl('')).toBeUndefined();
		expect(httpUrl(undefined)).toBeUndefined();
	});
});
