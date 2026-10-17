/** Spawn rules, levels and goals, upgrades. */
import { addPoints } from './combat.js';
import { stateOf } from './state.js';
import { between, countIn } from './stats.js';
import { runActions } from './triggers.js';
import type { World } from './types.js';
import { scatterItems } from './items.js';
import { startWaves } from './waves.js';

/** Monsters appear in waves, by the spawn rules of the current level. */
export function spawnMonsters(world: World): void {
	const state = stateOf(world);
	world.config.spawns.forEach((rule, index) => {
		const due = state.spawnDue[index] ?? world.time + between(world, rule.every);
		state.spawnDue[index] = due;
		if (world.time < due) return;
		state.spawnDue[index] = world.time + between(world, rule.every);
		if (world.level < rule.fromLevel || world.level > rule.toLevel) return;
		const alive = world.bodies.filter((body) => body.def === rule.entity).length;
		const count = Math.min(countIn(world, rule.count), rule.max - alive);
		if (count <= 0) return;
		const scale = rule.scalePerLevel * (world.level - rule.fromLevel);
		for (const body of world.spawnAt(rule.entity, count, 'edge')) {
			if (scale <= 0) continue;
			const factor = 1 + scale / 100;
			for (const stat of ['hp', 'attack', 'defense']) {
				if (body.stats[stat] !== undefined) body.stats[stat] *= factor;
			}
			body.hp = body.stats.hp ?? body.hp;
		}
	});
}

/** A vehicle drives in while playing, once per round. */
export function vehicleVisit(world: World): void {
	const state = stateOf(world);
	if (state.carDue === undefined || world.time < state.carDue) return;
	state.carDue = undefined;
	if (world.riding || world.bodies.some((body) => body.kind === 'vehicle')) return;
	world.visit();
}

/** Resets the counters of a level and applies what the level asks for. */
export function startLevel(world: World): void {
	const state = stateOf(world);
	state.level = { time: world.time, earned: world.stats.earned, kills: 0, boss: false };
	startWaves(world);
	scatterItems(world);
	const level = world.config.levels[world.level - 1];
	if (level?.view) world.setView(level.view);
	if (level?.label) world.events.emit('message', { text: level.label });
	world.events.emit('levelUp', { level: world.level });
}

/** Whether the current level's goal is reached; moves on to the next level or wins. */
export function checkGoal(world: World): void {
	const level = world.config.levels[world.level - 1];
	if (!level) return;
	const state = stateOf(world);
	const { type, amount } = level.goal;
	const reached =
		type === 'none'
			? false
			: type === 'score'
				? world.stats.earned - state.level.earned >= amount
				: type === 'kills'
					? state.level.kills >= amount
					: type === 'survive'
						? world.time - state.level.time >= amount
						: state.level.boss;
	if (!reached) return;
	if (world.level >= world.config.levels.length) world.end(true);
	else world.nextLevel();
}

/** What the next level of an upgrade costs (undefined: all bought). */
export function upgradePrice(world: World, id: string): number | undefined {
	const upgrade = world.config.upgrades[id];
	if (!upgrade) return undefined;
	const bought = world.upgrades[id] ?? 0;
	return bought >= upgrade.max ? undefined : upgrade.cost * (bought + 1);
}

export function canBuy(world: World, id: string): boolean {
	const upgrade = world.config.upgrades[id];
	const price = upgradePrice(world, id);
	return (
		world.phase === 'playing' &&
		upgrade !== undefined &&
		price !== undefined &&
		world.level >= upgrade.minLevel &&
		world.score >= price
	);
}

/** Buys the next level of an upgrade: spends points, changes stats, runs its actions. */
export function buy(world: World, id: string): boolean {
	const upgrade = world.config.upgrades[id];
	const price = upgradePrice(world, id);
	if (!upgrade || price === undefined || !canBuy(world, id)) return false;
	addPoints(world, -price);
	const level = (world.upgrades[id] ?? 0) + 1;
	world.upgrades[id] = level;
	const state = stateOf(world);
	for (const [stat, amount] of Object.entries(upgrade.stats)) {
		world.player.stats[stat] = (world.player.stats[stat] ?? 0) + amount;
		if (stat === 'hp') world.player.hp += amount;
		if (!upgrade.vehicle) continue;
		state.vehicleBonus[stat] = (state.vehicleBonus[stat] ?? 0) + amount;
		for (const body of world.bodies) {
			if (body.kind === 'vehicle') body.stats[stat] = (body.stats[stat] ?? 0) + amount;
		}
	}
	world.stats.upgrades += 1;
	world.events.emit('upgrade', { id, level });
	runActions(world, upgrade.do);
	return true;
}
