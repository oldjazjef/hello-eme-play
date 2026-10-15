import { describe, expect, it } from 'vitest';
import { previewDocument, SAMPLE_PAGE } from './previewPage.js';

describe('previewDocument', () => {
	it('puts the sample page and the game in one document, listening to the given origin only', () => {
		const html = previewDocument('window.Play = 1;', 'https://example.com');
		expect(html).toContain(SAMPLE_PAGE.trim().slice(0, 20));
		expect(html).toContain('<script data-preview="https://example.com">window.Play = 1;</script>');
	});

	it('cannot be broken out of by the script or the origin', () => {
		const html = previewDocument('a = "</script><b>"', 'https://x.com" onload="evil()');
		// One script element only, and the attribute stays one attribute.
		expect(html.match(/<script/g)).toHaveLength(1);
		expect(html.match(/<\/script>/g)).toHaveLength(1);
		expect(html).toContain('data-preview="https://x.com&quot; onload=&quot;evil()"');
	});

	it('takes another page', () => {
		expect(previewDocument('', 'null', '<p id="mine">Mine</p>')).toContain('<p id="mine">Mine</p>');
	});
});
