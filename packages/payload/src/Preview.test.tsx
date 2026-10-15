import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LABELS } from './labels.js';
import { originOf, Preview } from './Preview.js';

describe('originOf', () => {
	it('reads the origin of an absolute http(s) URL and nothing else', () => {
		expect(originOf('https://site.example/game-preview?x=1')).toBe('https://site.example');
		expect(originOf('http://localhost:5173/preview')).toBe('http://localhost:5173');
		expect(originOf('/preview')).toBeUndefined();
		expect(originOf('javascript:alert(1)')).toBeUndefined();
		expect(originOf(undefined)).toBeUndefined();
	});
});

describe('Preview', () => {
	it('shows the preview page in a frame', () => {
		const html = renderToString(
			<Preview url="https://site.example/preview" config={{}} labels={LABELS.en} />
		);
		expect(html).toContain('<iframe');
		expect(html).toContain('src="https://site.example/preview"');
		expect(html).toContain('Live preview');
	});

	it('shows nothing for a URL it cannot trust', () => {
		expect(renderToString(<Preview url="/preview" config={{}} labels={LABELS.en} />)).toBe('');
	});
});
