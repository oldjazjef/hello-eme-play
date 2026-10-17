/**
 * Movement that is not "go for the figure": flying straight (asteroids, traffic), balls that bounce
 * off the edges, bricks and paddles, paddles that follow the ball, and walking to and fro.
 */
import type { Pit } from '@hello-eme/play-schema';
import { collect } from './items.js';
import { arenaOf, fall, HARD_EDGE, itemBox, landing, radiusOf, sizeOf, solidAt } from './space.js';
import { statOf } from './stats.js';
import type { Body, Pickup, World } from './types.js';

/** A paddle is this thick compared to its length. */
const BAR_THICKNESS = 0.16;
/** A ball leaves a paddle at most this far (rad) from straight on. */
const BAR_ANGLE = (Math.PI / 180) * 62;
/** The ball bounces at least this steeply (share of its speed) so it never crawls along an edge. */
const MIN_ACROSS = 0.18;

const PITS: Record<Pit, readonly ('left' | 'right' | 'top' | 'bottom')[]> = {
	none: [],
	bottom: ['bottom'],
	top: ['top'],
	left: ['left'],
	right: ['right'],
	leftright: ['left', 'right'],
	topbottom: ['top', 'bottom']
};

/** The start direction an entity's `heading` asks for (radians); any when -1. */
export function headingOf(world: World, heading: number): number {
	return heading >= 0 ? (heading * Math.PI) / 180 : world.random() * Math.PI * 2;
}

/** Flies straight; past the edge of the arena it comes back in on the other side. */
export function moveDrift(world: World, body: Body, dt: number): void {
	const speed = statOf(world, body, 'speed');
	const arena = arenaOf(world);
	const margin = sizeOf(world, body) / 2;
	body.x += Math.cos(body.angle) * speed * dt;
	if (world.view === 'topdown') body.y += Math.sin(body.angle) * speed * dt;
	const width = arena.right - arena.left + margin * 2;
	const height = arena.bottom - arena.top + margin * 2;
	if (body.x < arena.left - margin) body.x += width;
	else if (body.x > arena.right + margin) body.x -= width;
	if (body.y < arena.top - margin) body.y += height;
	else if (body.y > arena.bottom + margin) body.y -= height;
	body.moving = true;
	body.distance += speed * dt;
	if (world.view === 'side') fall(world, body, dt);
}

/** The thin box of a paddle: long across the way it faces. */
export function barBox(world: World, body: Body): { w: number; h: number } {
	const size = sizeOf(world, body);
	const thin = Math.max(8, size * BAR_THICKNESS);
	return Math.abs(Math.cos(body.angle)) > 0.5 ? { w: thin, h: size } : { w: size, h: thin };
}

const isBar = (world: World, body: Body): boolean =>
	world.config.entities[body.def]?.shape === 'bar';

/** Paddles on the field: the figure when it is one, and every monster built as one. */
function barsOf(world: World): Body[] {
	const bars = world.bodies.filter((body) => body.kind === 'monster' && isBar(world, body));
	if (isBar(world, world.player) && !world.riding) bars.push(world.player);
	return bars;
}

interface Hit {
	nx: number;
	ny: number;
	/** How far the ball overlaps. */
	depth: number;
}

/** A circle against a box: where they touch (undefined: they don't). */
function circleBox(
	x: number,
	y: number,
	r: number,
	cx: number,
	cy: number,
	hw: number,
	hh: number
): Hit | undefined {
	const nearX = Math.min(Math.max(x, cx - hw), cx + hw);
	const nearY = Math.min(Math.max(y, cy - hh), cy + hh);
	const dx = x - nearX;
	const dy = y - nearY;
	const away = Math.hypot(dx, dy);
	if (away >= r) return undefined;
	if (away > 0) return { nx: dx / away, ny: dy / away, depth: r - away };
	// The centre is inside the box: leave by the nearest side.
	const left = x - (cx - hw);
	const right = cx + hw - x;
	const up = y - (cy - hh);
	const down = cy + hh - y;
	const least = Math.min(left, right, up, down);
	if (least === left) return { nx: -1, ny: 0, depth: left + r };
	if (least === right) return { nx: 1, ny: 0, depth: right + r };
	if (least === up) return { nx: 0, ny: -1, depth: up + r };
	return { nx: 0, ny: 1, depth: down + r };
}

/** The ball hits an item: it bounces, and a breakable one loses a hit. */
function hitItem(world: World, ball: Body, r: number): Hit | undefined {
	for (const pickup of [...world.pickups]) {
		const definition = world.config.items[pickup.def];
		if (!definition?.solid) continue;
		const box = definition.box ? itemBox(definition) : { w: definition.size, h: definition.size };
		const hit = definition.box
			? circleBox(ball.x, ball.y, r, pickup.x, pickup.y, box.w / 2, box.h / 2)
			: roundHit(ball, r, pickup, definition.size / 2);
		if (!hit) continue;
		if (definition.hp > 0) damageItem(world, pickup);
		return hit;
	}
	return undefined;
}

function roundHit(
	ball: { x: number; y: number },
	r: number,
	from: { x: number; y: number },
	radius: number
): Hit | undefined {
	const dx = ball.x - from.x;
	const dy = ball.y - from.y;
	const away = Math.hypot(dx, dy);
	if (away >= r + radius) return undefined;
	if (away === 0) return { nx: 0, ny: -1, depth: r + radius };
	return { nx: dx / away, ny: dy / away, depth: r + radius - away };
}

function damageItem(world: World, pickup: Pickup): void {
	pickup.hp -= 1;
	if (pickup.hp <= 0) collect(world, pickup);
}

/** The ball and the paddles: a paddle sends it back, the farther from the middle the flatter. */
function hitBar(
	world: World,
	ball: Body,
	r: number,
	speed: number
): { vx: number; vy: number; hit: Hit } | undefined {
	for (const bar of barsOf(world)) {
		const { w, h } = barBox(world, bar);
		const hit = circleBox(ball.x, ball.y, r, bar.x, bar.y, w / 2, h / 2);
		if (!hit) continue;
		// Straight on the face the bar looks out of: aim by where it was hit.
		const faceX = Math.cos(bar.angle);
		const faceY = Math.sin(bar.angle);
		const dot = (ball.x - bar.x) * faceX + (ball.y - bar.y) * faceY;
		if (dot > 0 && Math.abs(hit.nx * faceX + hit.ny * faceY) > 0.5) {
			const half = (Math.abs(faceX) > 0.5 ? h : w) / 2;
			const along = ((ball.x - bar.x) * -faceY + (ball.y - bar.y) * faceX) / half;
			const turn = Math.min(1, Math.max(-1, along)) * BAR_ANGLE;
			const out = {
				x: faceX * Math.cos(turn) - faceY * Math.sin(turn),
				y: faceY * Math.cos(turn) + faceX * Math.sin(turn)
			};
			return {
				vx: out.x * speed,
				vy: out.y * speed,
				hit: { nx: faceX, ny: faceY, depth: hit.depth }
			};
		}
		// The side or back of the bar: an ordinary bounce.
		return { vx: Number.NaN, vy: Number.NaN, hit };
	}
	return undefined;
}

/** A ball: flies straight, bounces off the edges, bricks and paddles, or falls into a pit. */
export function moveBall(world: World, ball: Body, dt: number): void {
	const speed = Math.max(1, statOf(world, ball, 'speed'));
	const r = Math.max(4, sizeOf(world, ball) * 0.45);
	const arena = arenaOf(world);
	const pits = PITS[world.config.game.pit];
	let vx = Math.cos(ball.angle) * speed;
	let vy = Math.sin(ball.angle) * speed;
	const substeps = Math.min(16, Math.max(1, Math.ceil((speed * dt) / (r * 0.7))));
	const h = dt / substeps;
	for (let i = 0; i < substeps; i++) {
		ball.x += vx * h;
		ball.y += vy * h;
		// The edges of the arena, or a pit.
		const edges = [
			{ edge: 'left', over: arena.left - (ball.x - r), nx: 1, ny: 0 },
			{ edge: 'right', over: ball.x + r - arena.right, nx: -1, ny: 0 },
			{ edge: 'top', over: arena.top - (ball.y - r), nx: 0, ny: 1 },
			{ edge: 'bottom', over: ball.y + r - arena.bottom, nx: 0, ny: -1 }
		] as const;
		for (const side of edges) {
			if (side.over <= 0) continue;
			if (pits.includes(side.edge)) {
				const index = world.bodies.indexOf(ball);
				if (index >= 0) world.bodies.splice(index, 1);
				world.events.emit('lost', { body: ball, edge: side.edge });
				return;
			}
			ball.x += side.nx * side.over;
			ball.y += side.ny * side.over;
			const into = vx * side.nx + vy * side.ny;
			if (into < 0) {
				vx -= 2 * into * side.nx;
				vy -= 2 * into * side.ny;
			}
		}
		const bar = hitBar(world, ball, r, speed);
		if (bar) {
			ball.x += bar.hit.nx * bar.hit.depth;
			ball.y += bar.hit.ny * bar.hit.depth;
			if (Number.isNaN(bar.vx)) {
				const into = vx * bar.hit.nx + vy * bar.hit.ny;
				if (into < 0) {
					vx -= 2 * into * bar.hit.nx;
					vy -= 2 * into * bar.hit.ny;
				}
			} else {
				vx = bar.vx;
				vy = bar.vy;
			}
			continue;
		}
		const item = hitItem(world, ball, r);
		if (item) {
			ball.x += item.nx * item.depth;
			ball.y += item.ny * item.depth;
			const into = vx * item.nx + vy * item.ny;
			if (into < 0) {
				vx -= 2 * into * item.nx;
				vy -= 2 * into * item.ny;
			}
		}
	}
	// Never nearly flat: a ball sliding along an edge would never come back.
	const total = Math.hypot(vx, vy) || 1;
	if (Math.abs(vy) / total < MIN_ACROSS && Math.abs(vx) / total < MIN_ACROSS) {
		vy = Math.sign(vy || 1) * total * MIN_ACROSS;
	}
	ball.angle = Math.atan2(vy, vx);
	ball.moving = true;
}

/** A paddle of its own: follows the nearest ball along its edge. */
export function movePaddle(world: World, paddle: Body, dt: number): void {
	const speed = statOf(world, paddle, 'speed');
	const arena = arenaOf(world);
	const vertical = Math.abs(Math.cos(paddle.angle)) > 0.5;
	let ball: Body | undefined;
	let best = Infinity;
	for (const body of world.bodies) {
		if (body === paddle || world.config.entities[body.def]?.behavior !== 'bounce') continue;
		const away = Math.hypot(body.x - paddle.x, body.y - paddle.y);
		if (away < best) {
			ball = body;
			best = away;
		}
	}
	if (!ball) return;
	const half = (vertical ? barBox(world, paddle).h : barBox(world, paddle).w) / 2;
	const goal = vertical ? ball.y : ball.x;
	const here = vertical ? paddle.y : paddle.x;
	const step = Math.max(-speed * dt, Math.min(speed * dt, goal - here));
	if (vertical) {
		paddle.y = Math.min(arena.bottom - half, Math.max(arena.top + half, paddle.y + step));
	} else {
		paddle.x = Math.min(arena.right - half, Math.max(arena.left + half, paddle.x + step));
	}
	paddle.moving = step !== 0;
}

/** Walks to and fro: turns round at the edge, at a wall and (in the side view) at the end of a platform. */
export function movePatrol(world: World, body: Body, dt: number): void {
	const speed = statOf(world, body, 'speed');
	const arena = arenaOf(world);
	const r = radiusOf(sizeOf(world, body));
	if (world.view === 'side') {
		let dir = Math.cos(body.angle) >= 0 ? 1 : -1;
		const ahead = body.x + dir * (r + 6);
		const blocked =
			ahead < arena.left + HARD_EDGE ||
			ahead > arena.right - HARD_EDGE ||
			solidAt(world, ahead, body.y - r, r * 0.5) ||
			(body.grounded && landing(world, ahead, body.y - 2, body.y + 14, false) === undefined);
		if (blocked) dir = -dir;
		body.x += dir * speed * dt;
		body.angle = dir > 0 ? 0 : Math.PI;
		body.moving = true;
		body.distance += speed * dt;
		fall(world, body, dt);
		return;
	}
	const dx = Math.cos(body.angle) * speed * dt;
	const dy = Math.sin(body.angle) * speed * dt;
	const nx = body.x + dx * 3 + Math.cos(body.angle) * r;
	const ny = body.y + dy * 3 + Math.sin(body.angle) * r;
	if (
		nx < arena.left + HARD_EDGE ||
		nx > arena.right - HARD_EDGE ||
		ny < arena.top + HARD_EDGE ||
		ny > arena.bottom - HARD_EDGE ||
		solidAt(world, nx, ny, r * 0.5)
	) {
		body.angle += Math.PI;
		return;
	}
	body.x += dx;
	body.y += dy;
	body.moving = true;
	body.distance += speed * dt;
}
