/** Geometry of the page: bounds, the camera that follows the figure, edges, floors, platforms. */
import type { Body, Host, Platform, World } from './types.js';

/** Distance from the viewport edge at which the page starts scrolling instead. */
export const EDGE = 72;
/** Closest a body's center gets to the edge of the page. */
export const HARD_EDGE = 20;

/** Half the body's width: where hits land and where bodies keep apart. */
export function radiusOf(size: number): number {
	return size * 0.32;
}

export function sizeOf(world: World, body: Body): number {
	return world.config.entities[body.def]?.size ?? 50;
}

export interface StaticHostOptions {
	width?: number;
	height?: number;
	/** Page size; larger than the viewport means the page scrolls. */
	page?: { width: number; height: number };
	top?: number;
	platforms?: Platform[];
}

/** A page of fixed size for tests and simulations. */
export function createStaticHost(
	options: StaticHostOptions = {}
): Host & { scrolled: { x: number; y: number } } {
	const width = options.width ?? 1000;
	const height = options.height ?? 700;
	const page = options.page ?? { width, height: height * 3 };
	const scrolled = { x: 0, y: 0 };
	return {
		scrolled,
		viewport: () => ({ width, height, top: options.top ?? 0 }),
		scroll: () => ({ ...scrolled }),
		page: () => ({ ...page }),
		scrollTo(x, y) {
			scrolled.x = Math.min(Math.max(0, x), Math.max(0, page.width - width));
			scrolled.y = Math.min(Math.max(0, y), Math.max(0, page.height - height));
		},
		platforms: () => options.platforms ?? []
	};
}

/** The camera: scrolls the page so that (x, y) stays inside the soft edges. */
export function follow(world: World, x: number, y: number): void {
	const { host } = world;
	const vp = host.viewport();
	const sc = host.scroll();
	const pg = host.page();
	let sx = sc.x;
	let sy = sc.y;
	if (x - sx < EDGE) sx = x - EDGE;
	else if (x - sx > vp.width - EDGE) sx = x - (vp.width - EDGE);
	const bottom = world.view === 'side' ? vp.height - HARD_EDGE : vp.height - EDGE;
	if (y - sy < vp.top + EDGE) sy = y - (vp.top + EDGE);
	else if (y - sy > bottom) sy = y - bottom;
	sx = Math.min(Math.max(0, sx), Math.max(0, pg.width - vp.width));
	sy = Math.min(Math.max(0, sy), Math.max(0, pg.height - vp.height));
	if (sx !== sc.x || sy !== sc.y) host.scrollTo(sx, sy);
}

/** The ground of the side view: the bottom of the visible window. */
export function floorY(world: World): number {
	return world.host.scroll().y + world.host.viewport().height - HARD_EDGE;
}

/**
 * Moves a body by (dx, dy) within the page. Past the end of the page it either stops or (with
 * `wrap`) comes back in at the other end; the camera follows.
 */
export function advance(world: World, body: Body, dx: number, dy: number, wrap: boolean): void {
	const pg = world.host.page();
	const top = world.host.viewport().top;
	let x = body.x + dx;
	let y = body.y + dy;
	const maxX = pg.width - HARD_EDGE;
	const maxY = pg.height - HARD_EDGE;
	if (wrap && pg.width > world.host.viewport().width) {
		if (x < HARD_EDGE) x = Math.max(HARD_EDGE, pg.width - EDGE);
		else if (x > maxX) x = EDGE;
	}
	if (wrap && pg.height > world.host.viewport().height && world.view === 'topdown') {
		if (y < HARD_EDGE) y = Math.max(HARD_EDGE, pg.height - EDGE);
		else if (y > maxY) y = top + EDGE;
	}
	body.x = Math.min(Math.max(x, HARD_EDGE), Math.max(HARD_EDGE, maxX));
	body.y = Math.min(Math.max(y, HARD_EDGE), Math.max(HARD_EDGE, maxY));
}

/** Where a falling body lands: the highest surface it passes through between two heights. */
export function landing(
	world: World,
	x: number,
	from: number,
	to: number,
	ignorePlatforms: boolean
): number | undefined {
	let found: number | undefined;
	if (!ignorePlatforms) {
		for (const platform of world.host.platforms()) {
			if (x < platform.x1 || x > platform.x2) continue;
			if (platform.y < from - 1 || platform.y > to) continue;
			if (found === undefined || platform.y < found) found = platform.y;
		}
	}
	const floor = floorY(world);
	if (to >= floor && (found === undefined || floor < found)) found = floor;
	return found;
}

/** Side view: gravity for a body standing on page surfaces (`y` is where its feet are). */
export function fall(
	world: World,
	body: { x: number; y: number; fall: number; grounded: boolean; drop: number },
	dt: number
): void {
	const { gravity } = world.config.view;
	const floor = floorY(world);
	// The window scrolled up under it: stay on the ground.
	if (body.y > floor) {
		body.y = floor;
		body.fall = 0;
	}
	body.drop = Math.max(0, body.drop - dt);
	body.fall += gravity * dt;
	const from = body.y;
	const to = from + body.fall * dt;
	const surface = body.fall >= 0 ? landing(world, body.x, from, to, body.drop > 0) : undefined;
	if (surface !== undefined) {
		body.y = surface;
		body.fall = 0;
		body.grounded = true;
	} else {
		body.y = to;
		body.grounded = false;
	}
}

/** A spot at the edge of the visible window (topdown) or at its left/right edge on the ground. */
export function edgePoint(world: World): { x: number; y: number } {
	const vp = world.host.viewport();
	const sc = world.host.scroll();
	const random = world.random;
	const left = sc.x + HARD_EDGE;
	const right = sc.x + vp.width - HARD_EDGE;
	if (world.view === 'side') return { x: random() < 0.5 ? left : right, y: floorY(world) };
	const top = sc.y + vp.top + HARD_EDGE;
	const bottom = sc.y + vp.height - HARD_EDGE;
	const side = Math.floor(random() * 4);
	const along = random();
	return {
		x: side === 0 ? left : side === 1 ? right : left + along * (right - left),
		y: side === 2 ? top : side === 3 ? bottom : top + along * (bottom - top)
	};
}

/** A random spot in the free part of the visible window. */
export function spotInView(world: World, margin = 80): { x: number; y: number } {
	const vp = world.host.viewport();
	const sc = world.host.scroll();
	const random = world.random;
	return {
		x: sc.x + margin + random() * Math.max(0, vp.width - 2 * margin),
		y:
			world.view === 'side'
				? floorY(world)
				: sc.y + vp.top + margin + random() * Math.max(0, vp.height - vp.top - 2 * margin)
	};
}
