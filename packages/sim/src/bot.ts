/** Bots: simple players that fill the world's controls, so rounds can be simulated without a person. */
import { hostile, statOf, type Body, type World } from '@hello-eme/play-core';

export type Bot = (world: World, dt: number) => void;

export const BOTS = ['idle', 'brawler', 'runner'] as const;
export type BotName = (typeof BOTS)[number];

const near = (from: Body, bodies: readonly { x: number; y: number }[]) =>
	bodies.reduce<{ x: number; y: number } | undefined>(
		(best, body) =>
			!best ||
			Math.hypot(body.x - from.x, body.y - from.y) < Math.hypot(best.x - from.x, best.y - from.y)
				? body
				: best,
		undefined
	);

/** Walks toward `target` (side view: along the ground, jumping when the target is above). */
function walkTo(world: World, target: { x: number; y: number }, stop = 0): void {
	const player = world.player;
	const dx = target.x - player.x;
	const dy = target.y - player.y;
	const length = Math.hypot(dx, dy);
	const { axis } = world.controls;
	if (world.view === 'side') {
		axis.x = Math.abs(dx) > stop ? Math.sign(dx) : 0;
		axis.y = dy < -60 && Math.abs(dx) < 120 ? -1 : 0;
		return;
	}
	axis.x = length > stop ? dx / length : 0;
	axis.y = length > stop ? dy / length : 0;
}

/** Buys the cheapest upgrade it can afford. */
function shop(world: World): void {
	const affordable = Object.keys(world.config.upgrades)
		.filter((id) => world.canBuy(id))
		.sort((a, b) => (world.config.upgrades[a]?.cost ?? 0) - (world.config.upgrades[b]?.cost ?? 0));
	const cheapest = affordable[0];
	if (cheapest) world.buy(cheapest);
}

const idle: Bot = (world) => {
	world.controls.axis.x = 0;
	world.controls.axis.y = 0;
	world.controls.held.clear();
};

/** Hunts the nearest monster and hits it; picks up items when it is quiet; buys upgrades. */
const brawler: Bot = (world) => {
	const { controls, player } = world;
	controls.held.clear();
	shop(world);
	const monsters = world.bodies.filter((body) => hostile(body));
	const monster = near(player, monsters);
	const item = near(player, world.pickups);
	if (monster && Math.hypot(monster.x - player.x, monster.y - player.y) < 400) {
		walkTo(world, monster, 24);
		player.angle = Math.atan2(monster.y - player.y, monster.x - player.x);
		const moves = world.config.entities[world.config.game.player]?.moves ?? [];
		for (const id of moves) if (world.config.moves[id]?.where !== 'vehicle') controls.held.add(id);
	} else if (item) {
		walkTo(world, item, 4);
	} else if (monster) {
		walkTo(world, monster, 24);
	} else {
		controls.axis.x = 0;
		controls.axis.y = 0;
	}
};

/** Keeps away from monsters and never fights: shows how long the figure survives by speed alone. */
const runner: Bot = (world) => {
	const { controls, player } = world;
	controls.held.clear();
	const monster = near(
		player,
		world.bodies.filter((body) => hostile(body))
	);
	if (!monster) {
		controls.axis.x = 0;
		controls.axis.y = 0;
		return;
	}
	const away = { x: player.x - (monster.x - player.x), y: player.y - (monster.y - player.y) };
	walkTo(world, away);
	if (statOf(world, player, 'speed') <= 0) controls.axis.x = controls.axis.y = 0;
};

export const botByName: Record<BotName, Bot> = { idle, brawler, runner };
