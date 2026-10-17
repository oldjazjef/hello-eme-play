/** Maps: a level drawn as text and put on the page when it starts. */
import { createPickup } from './items.js';
import { arenaOf, HARD_EDGE, viewRect } from './space.js';
import { stateOf } from './state.js';
import type { World } from './types.js';

/** Takes down what the level before left on the page (items, shots and the wild monsters). */
export function clearField(world: World): void {
	world.pickups.length = 0;
	world.projectiles.length = 0;
	const keep = world.bodies.filter((body) => body.kind !== 'monster' || body.ally);
	world.bodies.length = 0;
	world.bodies.push(...keep);
}

/** Puts the map `id` in the middle of the window: items, monsters and where the figure starts. */
export function buildMap(world: World, id: string): void {
	const map = world.config.maps[id];
	if (!map || map.rows.length === 0) return;
	const state = stateOf(world);
	clearField(world);
	const rows = map.rows.map((row) => Array.from(row));
	const cols = Math.max(...rows.map((row) => row.length));
	const rect = world.config.game.arena === 'screen' ? arenaOf(world) : viewRect(world);
	const width = rect.right - rect.left;
	const height = rect.bottom - rect.top;
	const cell = Math.max(8, Math.min(map.cell, width / cols, height / rows.length));
	const x0 = rect.left + (width - cols * cell) / 2;
	const y0 =
		map.align === 'bottom'
			? rect.bottom - HARD_EDGE - rows.length * cell
			: rect.top + (height - rows.length * cell) / 2;
	state.grid = { cell, x0, y0, cols, rows: rows.length, map: true };
	rows.forEach((row, r) => {
		row.forEach((char, c) => {
			const symbol = map.legend[char];
			if (!symbol) return;
			const x = x0 + (c + 0.5) * cell;
			const y = y0 + (r + 0.5) * cell;
			if (symbol.start) {
				world.player.x = x;
				world.player.y = y;
			}
			if (symbol.item) createPickup(world, symbol.item, x, y);
			if (symbol.entity) {
				const body = world.spawn(symbol.entity, x, y);
				if (body && symbol.angle >= 0) body.angle = (symbol.angle * Math.PI) / 180;
			}
		});
	});
}
