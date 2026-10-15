/**
 * Dropping an image into the sprite library: guess the picture's settings (a strip of equal square
 * frames is a sheet) and warn about what will not work well. Pure: the browser part (reading the
 * file) is in `upload.ts`.
 */
import { uniqueKey, type Json } from './state.js';

export interface ImageInfo {
	width: number;
	height: number;
	bytes: number;
	/** The MIME type, e.g. `image/png`. */
	type: string;
}

export type SpriteWarning = 'notImage' | 'unsupported' | 'tiny' | 'tooBig' | 'heavy' | 'noSize';

export interface SpriteGuess {
	id: string;
	/** The sprite as it goes into the configuration (only what differs from the defaults). */
	sprite: Json;
	warnings: SpriteWarning[];
}

/** The schema's bounds for `size` (see `SPRITE` in the schema). */
const SIZE = { min: 8, max: 400 };
const FORMATS = new Set(['image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/jpeg']);
/** Above this a picture is wasteful for a sprite that is shown a few hundred pixels at most. */
export const HEAVY_BYTES = 400_000;

/** `Hero Walk (2).PNG` → `hero-walk-2`. */
export function idFromFilename(name: string): string {
	const base = name.replace(/\.[^.]+$/, '');
	const slug = base
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
	return slug === '' ? 'sprite' : slug;
}

export function guessSprite(
	filename: string,
	info: ImageInfo,
	url: string,
	taken: Json
): SpriteGuess {
	const warnings: SpriteWarning[] = [];
	if (!info.type.startsWith('image/')) warnings.push('notImage');
	else if (!FORMATS.has(info.type)) warnings.push('unsupported');
	if (info.bytes > HEAVY_BYTES) warnings.push('heavy');

	let { width, height } = info;
	if (width <= 0 || height <= 0) {
		// An SVG without a size: leave the size to the editor.
		warnings.push('noSize');
		width = height = 0;
	}
	const sprite: Json = { url };
	if (width > 0) {
		// A strip of square frames (a sheet): the long side is a whole multiple of the short one.
		const long = Math.max(width, height);
		const short = Math.min(width, height);
		const frames = long % short === 0 ? long / short : 1;
		if (frames >= 2 && frames <= 64) {
			if (width > height) sprite.columns = frames;
			else sprite.rows = frames;
		}
		const frame = frames >= 2 && frames <= 64 ? short : long;
		if (frame < SIZE.min) warnings.push('tiny');
		if (frame > SIZE.max) warnings.push('tooBig');
		sprite.size = Math.min(SIZE.max, Math.max(SIZE.min, frame));
	}
	return { id: uniqueKey(taken, idFromFilename(filename)), sprite, warnings };
}
