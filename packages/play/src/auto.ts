/**
 * Drop-in build (`dist/play.iife.js`, released as `play.js`) for websites without a bundler:
 *
 * ```html
 * <script src="play.js" data-config-url="/play.json" defer></script>
 * <!-- or the JSON inline: -->
 * <script src="play.js" data-config='{"view":{"mode":"side"}}' defer></script>
 * <!-- data-toggle="off": no floating start button (start it with window.Play.start()). -->
 * ```
 *
 * The game is available as `window.Play` afterwards.
 */
import { createPlay, type Play } from './play.js';

declare global {
	interface Window {
		Play?: Play;
	}
}

const script = document.currentScript;

async function readConfig(): Promise<unknown> {
	const inline = script instanceof HTMLScriptElement ? script.dataset.config : undefined;
	if (inline) return JSON.parse(inline);
	const url = script instanceof HTMLScriptElement ? script.dataset.configUrl : undefined;
	if (!url) return {};
	const response = await fetch(url);
	return response.ok ? response.json() : {};
}

readConfig()
	.catch(() => ({}))
	.then((config) => {
		window.Play = createPlay({
			config,
			toggleButton: script instanceof HTMLScriptElement ? script.dataset.toggle !== 'off' : true
		});
	});
