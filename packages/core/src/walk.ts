/** The figure on foot: walking over the page (top-down) or running and jumping (side view). */
import { advance, fall, follow } from './space.js';
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

/** Starts a jump (top-down: a hop that clicks on landing; side view: leaves the ground). */
export function startJump(world: World, body: Body): boolean {
	if (world.view === 'side') {
		if (!body.grounded) return false;
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
	follow(world, body.x, body.y);
}

function isOnPlatform(world: World, body: Body): boolean {
	return world.host
		.platforms()
		.some(
			(platform) =>
				body.x >= platform.x1 && body.x <= platform.x2 && Math.abs(platform.y - body.y) < 2
		);
}
