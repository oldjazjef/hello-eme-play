/** Cell by cell: the figure of the `grid` control, the tail, and the ghosts that follow at corners. */
import { arenaOf, itemBox } from './space.js';
import { stateOf } from './state.js';
import { statOf } from './stats.js';
import type { Body, World } from './types.js';

export interface Grid {
	cell: number;
	x0: number;
	y0: number;
	cols: number;
	rows: number;
	map: boolean;
}

interface Dir {
	dx: number;
	dy: number;
}

const DIRS: readonly Dir[] = [
	{ dx: 1, dy: 0 },
	{ dx: 0, dy: 1 },
	{ dx: -1, dy: 0 },
	{ dx: 0, dy: -1 }
];

/** Tail segments the grid figure starts with. */
export const TAIL_START = 2;
/** Ghosts are slower while scared. */
const SCARED_SPEED = 0.6;
/** How often a chasing ghost takes a random turn instead (so two don't walk in a pair forever). */
const WANDER = 0.12;

/** The grid of the current map, or one laid over the arena by `game.grid.cell`. */
export function gridOf(world: World): Grid {
	const state = stateOf(world);
	if (state.grid) return state.grid;
	const cell = world.config.game.grid.cell;
	const arena = arenaOf(world);
	const width = arena.right - arena.left;
	const height = arena.bottom - arena.top;
	const cols = Math.max(1, Math.floor(width / cell));
	const rows = Math.max(1, Math.floor(height / cell));
	state.grid = {
		cell,
		x0: arena.left + (width - cols * cell) / 2,
		y0: arena.top + (height - rows * cell) / 2,
		cols,
		rows,
		map: false
	};
	return state.grid;
}

export const centerX = (g: Grid, col: number): number => g.x0 + (col + 0.5) * g.cell;
export const centerY = (g: Grid, row: number): number => g.y0 + (row + 0.5) * g.cell;
const colOf = (g: Grid, x: number): number => Math.floor((x - g.x0) / g.cell);
const rowOf = (g: Grid, y: number): number => Math.floor((y - g.y0) / g.cell);

/** Puts a body in the middle of the cell it is in. */
export function snapToGrid(world: World, body: Body): void {
	const g = gridOf(world);
	const col = Math.min(g.cols - 1, Math.max(0, colOf(g, body.x)));
	const row = Math.min(g.rows - 1, Math.max(0, rowOf(g, body.y)));
	body.x = centerX(g, col);
	body.y = centerY(g, row);
	body.grid = undefined;
}

/** Whether something solid fills the cell. */
function filled(world: World, g: Grid, col: number, row: number): boolean {
	const cx = centerX(g, col);
	const cy = centerY(g, row);
	const slack = g.cell * 0.35;
	return world.pickups.some((pickup) => {
		const definition = world.config.items[pickup.def];
		if (!definition?.solid) return false;
		const { w, h } = definition.box
			? itemBox(definition)
			: { w: definition.size, h: definition.size };
		return Math.abs(pickup.x - cx) < w / 2 + slack && Math.abs(pickup.y - cy) < h / 2 + slack;
	});
}

interface Step extends Dir {
	col: number;
	row: number;
	/** The target is on the other side of the grid (a tunnel). */
	wrapped: boolean;
}

/** The neighbouring cells a body can enter from (col, row). */
function steps(world: World, g: Grid, col: number, row: number): Step[] {
	const wrap = world.config.game.wrap;
	const found: Step[] = [];
	for (const dir of DIRS) {
		let c = col + dir.dx;
		let r = row + dir.dy;
		let wrapped = false;
		if (c < 0 || c >= g.cols || r < 0 || r >= g.rows) {
			if (!wrap) continue;
			c = (c + g.cols) % g.cols;
			r = (r + g.rows) % g.rows;
			wrapped = true;
		}
		if (filled(world, g, c, r)) continue;
		found.push({ ...dir, col: c, row: r, wrapped });
	}
	return found;
}

type Choose = (options: Step[], at: { col: number; row: number }) => Step | undefined;

/**
 * Moves a body `speed × dt` along the grid: on to the next cell's centre, and at every centre
 * `choose` picks where it goes next (nowhere: it stops there).
 */
function walkCells(
	world: World,
	body: Body,
	distance: number,
	choose: Choose,
	arrived?: () => void
): void {
	const g = gridOf(world);
	const motion = (body.grid ??= { dx: 0, dy: 0, tx: body.x, ty: body.y, wantX: 0, wantY: 0 });
	let left = distance;
	for (let guard = 0; guard < 8; guard++) {
		if (motion.dx !== 0 || motion.dy !== 0) {
			const away = Math.hypot(motion.tx - body.x, motion.ty - body.y);
			if (away > left) {
				body.x += ((motion.tx - body.x) / away) * left;
				body.y += ((motion.ty - body.y) / away) * left;
				return;
			}
			left -= away;
			body.x = motion.tx;
			body.y = motion.ty;
			motion.dx = 0;
			motion.dy = 0;
			arrived?.();
			if (world.phase !== 'playing' || body.grid !== motion) return;
		}
		const col = colOf(g, body.x);
		const row = rowOf(g, body.y);
		const next = choose(steps(world, g, col, row), { col, row });
		if (!next) return;
		motion.dx = next.dx;
		motion.dy = next.dy;
		if (next.wrapped) {
			body.x = centerX(g, next.col) - next.dx * g.cell;
			body.y = centerY(g, next.row) - next.dy * g.cell;
		}
		motion.tx = centerX(g, next.col);
		motion.ty = centerY(g, next.row);
		body.angle = Math.atan2(next.dy, next.dx);
		body.moving = true;
	}
}

/** The direction the controls ask for (the stronger axis wins), or none. */
function wanted(world: World): Dir | undefined {
	const { x, y } = world.controls.axis;
	if (x === 0 && y === 0) return undefined;
	return Math.abs(x) >= Math.abs(y) ? { dx: Math.sign(x), dy: 0 } : { dx: 0, dy: Math.sign(y) };
}

/** Whether the figure has hit something it must not: a wall, or itself. */
function crash(world: World): void {
	world.damage(world.player, world.maxHp(world.player) * 100 + 1, undefined, 'trigger');
}

/** The figure steps from cell to cell with the controls; with `auto` it keeps going by itself. */
export function walkGrid(world: World, body: Body, dt: number): void {
	const { auto, crash: crashes, tail } = world.config.game.grid;
	const state = stateOf(world);
	const speed = statOf(world, body, 'speed');
	body.moving = false;
	const motion = (body.grid ??= { dx: 0, dy: 0, tx: body.x, ty: body.y, wantX: 0, wantY: 0 });
	const asked = wanted(world);
	if (asked) {
		const reverse = motion.dx === -asked.dx && motion.dy === -asked.dy && (asked.dx || asked.dy);
		// Turning back half way is fine, unless the tail is in the way.
		if (reverse && (motion.dx !== 0 || motion.dy !== 0) && state.tail.length === 0) {
			motion.tx -= motion.dx * gridOf(world).cell;
			motion.ty -= motion.dy * gridOf(world).cell;
			motion.dx = asked.dx;
			motion.dy = asked.dy;
			body.angle = Math.atan2(asked.dy, asked.dx);
		}
		motion.wantX = asked.dx;
		motion.wantY = asked.dy;
	} else if (!auto) {
		motion.wantX = 0;
		motion.wantY = 0;
	}
	const previous = { dx: motion.dx, dy: motion.dy };
	const choose: Choose = (options) => {
		const wantX = motion.wantX;
		const wantY = motion.wantY;
		const free = (dx: number, dy: number) =>
			options.find((option) => option.dx === dx && option.dy === dy);
		let pick = wantX || wantY ? free(wantX, wantY) : undefined;
		if (!pick && auto) {
			const heading = previous.dx || previous.dy ? previous : { dx: wantX, dy: wantY };
			if (heading.dx || heading.dy) {
				pick = free(heading.dx, heading.dy);
				if (!pick && crashes) crash(world);
			}
		}
		if (!auto) {
			motion.wantX = 0;
			motion.wantY = 0;
		}
		if (pick) {
			previous.dx = pick.dx;
			previous.dy = pick.dy;
		}
		return pick;
	};
	walkCells(world, body, speed * dt, choose, () => {
		if (!tail) return;
		state.tail.points.push({ x: body.x, y: body.y });
		while (state.tail.points.length > state.tail.length + 1) state.tail.points.shift();
		if (crashes) {
			const behind = state.tail.points.slice(0, -1);
			if (behind.some((point) => Math.hypot(point.x - body.x, point.y - body.y) < 2)) crash(world);
		}
		world.tail.splice(0, world.tail.length, ...state.tail.points.slice(0, -1));
	});
	body.moving = motion.dx !== 0 || motion.dy !== 0;
}

/** Where a ghost is headed: each one has a character of its own, by its number. */
function aimOf(world: World, ghost: Body, target: Body): { x: number; y: number } {
	const g = gridOf(world);
	const motion = target.grid;
	switch (ghost.id % 3) {
		case 1:
			// Cuts the figure off: four cells ahead of where it is going.
			return motion
				? { x: target.x + motion.dx * g.cell * 4, y: target.y + motion.dy * g.cell * 4 }
				: target;
		case 2:
			// Only chases when close; otherwise it sulks at home.
			return Math.hypot(ghost.x - target.x, ghost.y - target.y) < g.cell * 6 ? target : ghost.home;
		default:
			return target;
	}
}

/** A ghost: at every corner it takes the way that gets it closest to its aim (farthest when scared). */
export function moveGhost(world: World, ghost: Body, target: Body, dt: number): void {
	const scared = world.scared;
	const speed = statOf(world, ghost, 'speed') * (scared ? SCARED_SPEED : 1);
	ghost.moving = true;
	const choose: Choose = (options) => {
		if (options.length === 0) return undefined;
		const motion = ghost.grid;
		// No turning back, unless there is no other way.
		const ahead = options.filter(
			(option) => !motion || option.dx !== -motion.dx || option.dy !== -motion.dy
		);
		const pool = ahead.length > 0 ? ahead : options;
		if (!scared && world.random() < WANDER) return pool[Math.floor(world.random() * pool.length)];
		const g = gridOf(world);
		let best: Step | undefined;
		let bestScore = Infinity;
		for (const option of pool) {
			const aim = scared ? target : aimOf(world, ghost, target);
			const away = Math.hypot(centerX(g, option.col) - aim.x, centerY(g, option.row) - aim.y);
			const score = scared ? -away : away;
			if (score < bestScore) {
				best = option;
				bestScore = score;
			}
		}
		return best;
	};
	walkCells(world, ghost, speed * dt, choose);
}
