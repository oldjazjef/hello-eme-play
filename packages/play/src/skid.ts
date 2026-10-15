/**
 * Tire marks a drifting car leaves on the page: short segments from each rear wheel's last
 * position to its current one, in page coordinates (they scroll with the page). They fade out
 * after a while; there are never more than `SKID.max`, so long drifts don't slow the page down.
 */

export interface SkidMark {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
	/** When it was made (ms, like `performance.now()`). */
	at: number;
}

export const SKID = {
	/** Marks last this long (ms) and fade out over the last `fade` ms of it. */
	life: 20_000,
	fade: 6_000,
	/** Opacity of a fresh mark. */
	opacity: 0.35,
	max: 1500,
	/** Line width in px, about a tire's width. */
	width: 5
} as const;

interface Point {
	x: number;
	y: number;
}

/** Adds one segment per wheel (`from` → `to`, page coordinates); the oldest go when full. */
export function addMarks(
	marks: readonly SkidMark[],
	from: readonly Point[],
	to: readonly Point[],
	at: number
): SkidMark[] {
	const added = to.flatMap((end, index) => {
		const start = from[index];
		return start ? [{ x1: start.x, y1: start.y, x2: end.x, y2: end.y, at }] : [];
	});
	return [...marks, ...added].slice(-SKID.max);
}

/** Drops the marks that have faded out completely. */
export function fresh(marks: readonly SkidMark[], now: number): SkidMark[] {
	return marks.filter((mark) => now - mark.at < SKID.life);
}

/** A mark's opacity: full until it starts fading, then down to 0 at the end of its life. */
export function opacity(mark: SkidMark, now: number): number {
	const left = SKID.life - (now - mark.at);
	return SKID.opacity * Math.max(0, Math.min(1, left / SKID.fade));
}
