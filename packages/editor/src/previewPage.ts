/**
 * The built-in preview: a small sample page plus the game, as one HTML document for an iframe's
 * `srcdoc`. The editor bundle carries the game's drop-in script, so a preview works with no page of
 * your own (`previewUrl` is better when you have one: it is the real site).
 */

/** The drop-in script of `@hello-eme/play`; set when the editor is bundled (see `scripts/build.mjs`). */
declare const __PLAY_BUNDLE__: string | undefined;

export const BUILTIN_PLAY: string | undefined =
	typeof __PLAY_BUNDLE__ === 'string' ? __PLAY_BUNDLE__ : undefined;

const escapeScript = (source: string): string => source.replaceAll('</script', '<\\/script');
const escapeAttribute = (text: string): string =>
	text.replaceAll('&', '&amp;').replaceAll('"', '&quot;');

/** The page the game is played on in the built-in preview. */
export const SAMPLE_PAGE = `
<h1>A page to play on</h1>
<p class="card">A paragraph that cracks after two punches.</p>
<p class="card">Another one to jump onto in the side view.</p>
<button type="button">A button</button>
<a class="card" href="#top" style="display:inline-block">A link</a>
<p class="card">More text, so there is something to break and to stand on.</p>`;

const STYLE = `
body{margin:0;padding:1rem;font-family:system-ui,sans-serif;line-height:1.5;color:#1b1d21;background:#fff}
h1{margin:0 0 .75rem;font-size:1.4rem}
.card{margin:.75rem 0;padding:.6rem .8rem;border:2px solid #1e1b4b;border-radius:.5rem;background:#fff}
button{padding:.4rem .9rem;border:2px solid #1e1b4b;border-radius:.5rem;background:#fff;font:inherit}`;

/**
 * A complete document: the sample page and the game in preview mode, which only listens to the
 * parent window at `origin` (the page that shows the iframe).
 */
export function previewDocument(
	playSource: string,
	origin: string,
	page: string = SAMPLE_PAGE
): string {
	return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Preview</title><style>${STYLE}</style></head><body>${page}<script data-preview="${escapeAttribute(origin)}">${escapeScript(playSource)}</script></body></html>`;
}
