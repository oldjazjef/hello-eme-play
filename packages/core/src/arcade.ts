/** The pieces of arcade games: starting places, scared monsters, monsters that come back, stomping. */
import { hostile } from './bodies.js';
import { gridOf, snapToGrid, TAIL_START } from './grid.js';
import { arenaOf, follow, SLIDE_INSET, radiusOf, sizeOf, viewRect } from './space.js';
import { stateOf } from './state.js';
import { statOf } from './stats.js';
import type { Body, World } from './types.js';

/** Gets the figure ready for the way it is steered, and remembers where it starts. */
export function initFigure(world: World): void {
	const state = stateOf(world);
	const player = world.player;
	const control = world.view === 'topdown' ? world.config.game.control : 'walk';
	player.vx = 0;
	player.vy = 0;
	if (control === 'ship') player.angle = -Math.PI / 2;
	if (control === 'slide') {
		const arena = world.config.game.arena === 'screen' ? arenaOf(world) : viewRect(world);
		if (world.config.game.slideAxis === 'x') {
			player.x = (arena.left + arena.right) / 2;
			player.y = arena.bottom - SLIDE_INSET;
			player.angle = -Math.PI / 2;
		} else {
			player.x = arena.left + SLIDE_INSET;
			player.y = (arena.top + arena.bottom) / 2;
			player.angle = 0;
		}
	}
	if (control === 'grid') {
		snapToGrid(world, player);
		state.tail = { length: world.config.game.grid.tail ? TAIL_START : 0, points: [] };
		world.tail.length = 0;
	}
	state.start = { x: player.x, y: player.y };
}

/** Sends the figure back to its starting place. */
export function toStart(world: World): void {
	const state = stateOf(world);
	const player = world.player;
	player.x = state.start.x;
	player.y = state.start.y;
	player.vx = 0;
	player.vy = 0;
	player.fall = 0;
	player.grid = undefined;
	state.tail.points = [];
	state.tail.length = world.config.game.grid.tail ? TAIL_START : 0;
	world.tail.length = 0;
	if (world.config.game.control === 'grid') gridOf(world);
	follow(world, player.x, player.y);
}

/** Makes this place the new start (a flag in a platform game). */
export function checkpoint(world: World): void {
	stateOf(world).start = { x: world.player.x, y: world.player.y };
}

/** The monsters are scared for a while: they flee, and the figure eats whatever it touches. */
export function scare(world: World, seconds: number): void {
	const state = stateOf(world);
	state.scaredUntil = Math.max(state.scaredUntil, world.time + seconds);
	world.scared = true;
	world.events.emit('scare', { seconds });
}

/** Bookkeeping per step: whether the monsters are still scared, who comes back. */
export function tickArcade(world: World): void {
	const state = stateOf(world);
	world.scared = world.time < state.scaredUntil;
	if (state.respawns.length === 0) return;
	const due = state.respawns.filter((entry) => entry.at <= world.time);
	if (due.length === 0) return;
	state.respawns = state.respawns.filter((entry) => entry.at > world.time);
	for (const entry of due) world.spawn(entry.def, entry.x, entry.y);
}

/** A scared monster the figure touches is eaten. */
export function eatScared(world: World, monster: Body, target: Body): boolean {
	if (!world.scared || !hostile(monster)) return false;
	const reach = radiusOf(sizeOf(world, monster)) + radiusOf(sizeOf(world, target)) + 4;
	if (Math.hypot(monster.x - target.x, monster.y - target.y) > reach) return false;
	world.damage(monster, monster.hp * 2 + 1, world.player, 'trigger');
	return true;
}

/** Side view: landing on a monster hurts it and bounces the figure up again. */
export function tickStomp(world: World): void {
	const factor = world.config.game.stomp;
	const player = world.player;
	if (factor <= 0 || world.view !== 'side' || world.riding || player.fall <= 0) return;
	for (const monster of [...world.bodies]) {
		if (!hostile(monster)) continue;
		const size = sizeOf(world, monster);
		const reach = radiusOf(size) + radiusOf(sizeOf(world, player));
		const above = monster.y - player.y;
		if (Math.abs(monster.x - player.x) > reach || above < size * 0.4 || above > size * 1.1)
			continue;
		player.fall = -world.config.view.jumpSpeed * 0.6;
		player.grounded = false;
		player.invulnerable = Math.max(player.invulnerable, 0.3);
		world.damage(monster, statOf(world, player, 'attack') * factor, player, 'stomp');
		world.events.emit('stomp', { body: monster });
		return;
	}
}
