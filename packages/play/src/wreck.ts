/**
 * Breaking page elements: after a few hits an element cracks and breaks into pixel shards. Only the
 * visitor's view changes (no CMS, no storage); reloading the page or `Wrecker.repair()` brings
 * everything back.
 */
/**
 * Never breakable: anything marked `data-unbreakable` (e.g. the site's header and footer), any
 * navigation, the game's own controls and its toggle, so the visitor can always get around and out.
 */
export const UNBREAKABLE =
	'[data-unbreakable], nav, [data-play-ui], [data-play-toggle], [data-wrecked]';

/** What can be punched; the closest of these to the fist wins, so always the smallest. */
export const BREAKABLE = [
	'a',
	'button',
	'img',
	'svg',
	'video',
	'iframe',
	'input',
	'select',
	'textarea',
	'label',
	'p',
	'h1',
	'h2',
	'h3',
	'h4',
	'h5',
	'h6',
	'li',
	'dt',
	'dd',
	'blockquote',
	'pre',
	'figure',
	'table',
	'article'
].join(', ');

/** HTML elements and SVGs both have `dataset` and `classList`. */
export type Breakable = HTMLElement | SVGElement;

/** Media and cards are sturdier than text. */
const STURDY = 'img, svg, video, iframe, figure, table, article';

/** Elements smaller than this (px²) break with one hit: tags, links, small buttons. */
export const SMALL_AREA = 6000;

/** Hits an element takes before it breaks: small things 1, text 2, media and cards 3. */
export function hitsToBreak(element: { sturdy: boolean; area: number }): number {
	if (element.sturdy) return 3;
	return element.area < SMALL_AREA ? 1 : 2;
}

/**
 * The element the fist hits (from `document.elementFromPoint`), or undefined if there is
 * nothing breakable: protected parts, and anything bigger than half the window (whole sections).
 */
export function punchTarget(
	hit: Element | null,
	window: { width: number; height: number }
): Breakable | undefined {
	if (!hit || hit.closest(UNBREAKABLE)) return undefined;
	const target = hit.closest<Breakable>(BREAKABLE);
	if (!target) return undefined;
	const { width, height } = target.getBoundingClientRect();
	if (width * height === 0 || width * height > (window.width * window.height) / 2) return undefined;
	return target;
}

export type PunchResult = 'hit' | 'broken';

/** Classes the `Wrecker` puts on hit elements (styled by the game's stylesheet). */
export const WRECK_CLASSES = { target: 'play-wreck', shake: 'play-shake' } as const;

/**
 * Keeps track of hits and broken elements. Hits shake an element and crack it (`data-cracks`,
 * styled via `WRECK_CLASSES.target`); a broken element is hidden (`data-wrecked`) but keeps its
 * space, so the page doesn't jump. Hidden elements are out of the tab order and the accessibility
 * tree.
 */
export class Wrecker {
	readonly #hits = new Map<Breakable, number>();
	#broken = 0;

	/** How many elements are broken. */
	get broken(): number {
		return this.#broken;
	}

	/** `strength`: how many hits this one counts as (a kick counts twice). */
	hit(element: Breakable, strength = 1): PunchResult {
		const { width, height } = element.getBoundingClientRect();
		const needed = hitsToBreak({ sturdy: element.matches(STURDY), area: width * height });
		const hits = (this.#hits.get(element) ?? 0) + strength;
		this.#hits.set(element, hits);
		element.classList.add(WRECK_CLASSES.target);
		if (hits >= needed) {
			delete element.dataset.cracks;
			element.dataset.wrecked = '';
			this.#broken += 1;
			return 'broken';
		}
		element.dataset.cracks = String(hits);
		// Restart the shake animation for every hit.
		element.classList.remove(WRECK_CLASSES.shake);
		void element.getBoundingClientRect();
		element.classList.add(WRECK_CLASSES.shake);
		return 'hit';
	}

	/** Brings every hit or broken element back. */
	repair(): void {
		for (const element of this.#hits.keys()) {
			element.classList.remove(WRECK_CLASSES.target, WRECK_CLASSES.shake);
			delete element.dataset.cracks;
			delete element.dataset.wrecked;
		}
		this.#hits.clear();
		this.#broken = 0;
	}
}

/** A pixel shard of a broken element, in page coordinates (it stays where it broke). */
export interface Shard {
	x: number;
	y: number;
	vx: number;
	vy: number;
	/** Seconds left. */
	life: number;
	/** Index into the colors the shards are drawn with. */
	color: number;
}

export const SHARDS = {
	/** Shards per broken element, at most. */
	count: 28,
	life: 0.9,
	/** Downwards pull in px/s² (they fall "off" the page). */
	gravity: 900,
	/** Most shards on screen at once. */
	max: 300
} as const;

/** Shards bursting out of a broken element's box (page coordinates); `random` for tests. */
export function burst(
	box: { x: number; y: number; width: number; height: number },
	colors: number,
	random: () => number = Math.random
): Shard[] {
	return Array.from({ length: SHARDS.count }, () => {
		const angle = random() * Math.PI * 2;
		const speed = 120 + random() * 260;
		return {
			x: box.x + random() * box.width,
			y: box.y + random() * box.height,
			vx: Math.cos(angle) * speed,
			vy: Math.sin(angle) * speed - 180,
			life: SHARDS.life * (0.6 + random() * 0.4),
			color: Math.floor(random() * colors)
		};
	});
}

/** Moves the shards by `dt` seconds; burnt-out ones are dropped. */
export function fly(shards: readonly Shard[], dt: number): Shard[] {
	return shards
		.map((shard) => ({
			...shard,
			x: shard.x + shard.vx * dt,
			y: shard.y + shard.vy * dt,
			vy: shard.vy + SHARDS.gravity * dt,
			life: shard.life - dt
		}))
		.filter((shard) => shard.life > 0)
		.slice(-SHARDS.max);
}
