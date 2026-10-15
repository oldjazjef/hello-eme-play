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
	play: Pick<Play, 'configure' | 'stop' | 'start'>
): boolean {
	if (message.origin !== allowedOrigin || message.source !== parent) return false;
	if (!isObject(message.data) || message.data.type !== PREVIEW_CONFIG) return false;
	play.configure(message.data.config);
	play.stop();
	play.start();
	return true;
}
