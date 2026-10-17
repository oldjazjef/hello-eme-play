/** The figure on foot: walking over the page (top-down) or running and jumping (side view). */
import { walkGrid } from './grid.js';
import {
	advance,
	arenaOf,
	fall,
	follow,
	HARD_EDGE,
	itemPlatforms,
	SLIDE_INSET,
	viewRect
} from './space.js';
import { statOf } from './stats.js';
import type { Body, World } from './types.js';

/** Duration of a top-down jump; landing "clicks" what the figure stands on. */
export const JUMP_SECONDS = 0.45;
/** Walked distance per animation frame (two frames: left and right foot forward). */
export const STRIDE = 14;
/** Page scrolling speed (px/s) when walking down the floor of the side view. */
const SCROLL_SPEED = 420;

/** Jump height from 0 (ground) to 1 (top), for drawing. */
export function jumpHeight(body: Pick<Body, 'jump'>): number {
	if (body.jump <= 0) return 0;
	return Math.sin(Math.PI * (1 - body.jump / JUMP_SECONDS));
}

/** 0 or 1: which walk frame to draw. */
export function walkFrame(body: Pick<Body, 'moving' | 'distance'>): 0 | 1 {
	if (!body.moving) return 0;
	return Math.floor(body.distance / STRIDE) % 2 === 0 ? 0 : 1;
}

/**
 * Starts a jump (top-down: a hop that clicks on landing; side view: leaves the ground, or, with
 * `air`, jumps again in the air as often as `view.airJumps` allows).
 */
export function startJump(world: World, body: Body, air = false): boolean {
	if (world.view === 'side') {
		if (!body.grounded) {
			if (!air || body.airLeft <= 0) return false;
			body.airLeft -= 1;
		}
		body.fall = -world.config.view.jumpSpeed;
		body.grounded = false;
		return true;
	}
	if (body.jump > 0) return false;
	body.jump = JUMP_SECONDS;
	return true;
}

/** Walks the figure by `dt` seconds along the controls' axes. */
export function walk(world: World, body: Body, dt: number): void {
	const { axis } = world.controls;
	const speed = statOf(world, body, 'speed');
	if (world.view === 'side') return walkSide(world, body, dt, speed);
	const control = world.config.game.control;
	if (control === 'ship') return flyShip(world, body, dt);
	if (control === 'grid') {
		walkGrid(world, body, dt);
		follow(world, body.x, body.y);
		return;
	}
	if (control === 'slide') return slide(world, body, dt, speed);

	const length = Math.hypot(axis.x, axis.y);
	const moving = length > 0;
	const dx = moving ? (axis.x / length) * speed * dt : 0;
	const dy = moving ? (axis.y / length) * speed * dt : 0;
	advance(world, body, dx + body.vx * dt, dy + body.vy * dt, world.config.game.wrap);
	body.moving = moving;
	if (moving) body.angle = Math.atan2(axis.y, axis.x);
	body.distance += Math.hypot(dx, dy);
	const before = body.jump;
	body.jump = Math.max(0, body.jump - dt);
	if (before > 0 && body.jump === 0) world.events.emit('land', { x: body.x, y: body.y });
	follow(world, body.x, body.y);
}

function walkSide(world: World, body: Body, dt: number, speed: number): void {
	const { axis } = world.controls;
	const dx = axis.x * speed * dt;
	advance(world, body, dx + body.vx * dt, 0, world.config.game.wrap);
	body.moving = axis.x !== 0 && body.grounded;
	if (axis.x !== 0) body.angle = axis.x > 0 ? 0 : Math.PI;
	body.distance += Math.abs(dx);
	// Up jumps; down drops through a platform, or (on the ground) walks the page down.
	if (axis.y < 0) startJump(world, body);
	const onFloor = body.grounded && !isOnPlatform(world, body);
	if (axis.y > 0 && body.grounded) {
		if (onFloor) {
			const sc = world.host.scroll();
			world.host.scrollTo(sc.x, sc.y + SCROLL_SPEED * dt);
		} else {
			body.drop = 0.25;
			body.grounded = false;
		}
	}
	fall(world, body, dt);
	if (body.grounded) body.airLeft = world.config.view.airJumps;
	follow(world, body.x, body.y);
}

/** A spaceship: left and right turn it, up pushes it forward, and it keeps drifting. */
function flyShip(world: World, body: Body, dt: number): void {
	const { axis } = world.controls;
	const ship = world.config.game.ship;
	body.angle += axis.x * ship.turn * dt;
	let vx = body.vx;
	let vy = body.vy;
	const thrusting = axis.y < 0;
	if (thrusting) {
		vx += Math.cos(body.angle) * ship.thrust * dt;
		vy += Math.sin(body.angle) * ship.thrust * dt;
	}
	// Down brakes hard; with no pedal it slows down gently.
	const slow = Math.exp(-(axis.y > 0 ? 3 : ship.drag) * dt);
	vx *= slow;
	vy *= slow;
	const total = Math.hypot(vx, vy);
	if (total > ship.maxSpeed) {
		vx = (vx / total) * ship.maxSpeed;
		vy = (vy / total) * ship.maxSpeed;
	}
	const x = body.x;
	const y = body.y;
	advance(world, body, vx * dt, vy * dt, world.config.game.wrap);
	// Against an edge it stops pushing into it.
	const wrapped = world.config.game.wrap;
	if (!wrapped && Math.abs(body.x - (x + vx * dt)) > 0.01) vx = 0;
	if (!wrapped && Math.abs(body.y - (y + vy * dt)) > 0.01) vy = 0;
	body.vx = vx;
	body.vy = vy;
	body.moving = thrusting;
	body.distance += Math.hypot(vx, vy) * dt;
	follow(world, body.x, body.y);
}

/** A paddle: slides along one edge of the window, facing the field. */
function slide(world: World, body: Body, dt: number, speed: number): void {
	const { axis } = world.controls;
	const arena = world.config.game.arena === 'screen' ? arenaOf(world) : viewRect(world);
	const inset = SLIDE_INSET;
	if (world.config.game.slideAxis === 'x') {
		body.angle = -Math.PI / 2;
		body.y = arena.bottom - inset;
		body.x = Math.min(
			arena.right - HARD_EDGE,
			Math.max(arena.left + HARD_EDGE, body.x + axis.x * speed * dt)
		);
		body.moving = axis.x !== 0;
	} else {
		body.angle = 0;
		body.x = arena.left + inset;
		body.y = Math.min(
			arena.bottom - HARD_EDGE,
			Math.max(arena.top + HARD_EDGE, body.y + axis.y * speed * dt)
		);
		body.moving = axis.y !== 0;
	}
	body.distance += speed * dt * (body.moving ? 1 : 0);
	follow(world, body.x, body.y);
}

function isOnPlatform(world: World, body: Body): boolean {
	return [...world.host.platforms(), ...itemPlatforms(world)].some(
		(platform) =>
			body.x >= platform.x1 && body.x <= platform.x2 && Math.abs(platform.y - body.y) < 2
	);
}
