/**
 * Preview mode for the drop-in build: a page inside the CMS admin (an iframe) plays whatever
 * configuration the admin sends, so editors see a change at once. Only messages from the one
 * allowed origin (`data-preview="https://cms.example.com"`) and from the parent window count.
 */
import { isObject } from '@hello-eme/play-schema';
import type { Play } from './play.js';

export const PREVIEW_CONFIG = 'play-config';
export const PREVIEW_READY = 'play-ready';

export interface PreviewMessage {
	data: unknown;
	origin: string;
	source: unknown;
}

/** Applies a configuration sent by the admin and starts a fresh round. Returns whether it did. */
export function applyPreview(
	message: PreviewMessage,
	allowedOrigin: string,
	parent: unknown,
	play: Pick<Play, 'configure' | 'stop' | 'start'>,
	transform: (config: unknown) => unknown = (config) => config
): boolean {
	if (message.origin !== allowedOrigin || message.source !== parent) return false;
	if (!isObject(message.data) || message.data.type !== PREVIEW_CONFIG) return false;
	play.configure(transform(message.data.config));
	play.stop();
	play.start();
	return true;
}

/**
 * Lets the CMS admin that frames this page play its configuration: listens for the admin's
 * messages and says "ready". `transform` can add what the website itself owns (texts, language).
 * Returns a function that stops listening.
 */
export function connectPreview(
	play: Pick<Play, 'configure' | 'stop' | 'start'>,
	allowedOrigin: string,
	transform?: (config: unknown) => unknown
): () => void {
	const listener = (event: MessageEvent) =>
		applyPreview(event, allowedOrigin, window.parent, play, transform);
	addEventListener('message', listener);
	window.parent.postMessage({ type: PREVIEW_READY }, allowedOrigin);
	return () => removeEventListener('message', listener);
}
