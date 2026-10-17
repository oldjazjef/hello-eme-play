/**
 * Triggers: "when this happens, if that holds, do these actions". Actions are a registry, so a
 * new kind (declared in the schema) is one function here.
 */
import type { Action, Condition, EventName } from '@hello-eme/play-schema';
import { hostile } from './bodies.js';
import { addPoints, heal } from './combat.js';
import { stateOf } from './state.js';
import type { Body, World } from './types.js';

type ActionRunners = {
	[Name in Action['do']]: (world: World, action: Extract<Action, { do: Name }>) => void;
};

/** Changes a stat for a while (or for good with `seconds` 0) on the bodies the target names. */
function changeStat(world: World, action: Extract<Action, { do: 'stat' }>): void {
	const state = stateOf(world);
	const bodies: Body[] =
		action.target === 'figure'
			? [world.player]
			: action.target === 'monsters'
				? world.bodies.filter((body) => hostile(body))
				: world.bodies.filter((body) => body.kind === 'vehicle');
	if (action.target === 'vehicle' && action.seconds === 0) {
		state.vehicleBonus[action.stat] = (state.vehicleBonus[action.stat] ?? 0) + action.amount;
	}
	for (const body of bodies) {
		if (action.seconds > 0)
			body.mods.push({ stat: action.stat, amount: action.amount, left: action.seconds });
		else body.stats[action.stat] = (body.stats[action.stat] ?? 0) + action.amount;
	}
}

export const ACTION_RUNNERS: ActionRunners = {
	spawn: (world, action) => void world.spawnAt(action.entity, action.count, action.where),
	setView: (world, action) => world.setView(action.mode),
	points: (world, action) => addPoints(world, action.amount),
	heal: (world, action) => heal(world, action.amount),
	stat: changeStat,
	dropItem: (world, action) =>
		void world.dropItem(
			action.item,
			world.player.x + (world.random() - 0.5) * 120,
			world.player.y - 20
		),
	ammo: (world, action) => world.giveAmmo(action.throwable, action.amount),
	recruit: (world, action) => void world.recruit(action.entity),
	healParty: (world, action) => world.healParty(action.amount),
	nextLevel: (world) => world.nextLevel(),
	message: (world, action) => action.text && world.events.emit('message', { text: action.text }),
	sound: (world, action) => action.sound && world.events.emit('sound', { id: action.sound }),
	win: (world) => world.end(true),
	lose: (world) => world.end(false)
};

const MAX_DEPTH = 8;

/** Runs actions one after the other; actions that trigger more actions stop after a few levels. */
export function runActions(world: World, actions: readonly Action[]): void {
	const state = stateOf(world);
	if (state.depth >= MAX_DEPTH) return;
	state.depth += 1;
	try {
		for (const action of actions) {
			const run = ACTION_RUNNERS[action.do] as (world: World, action: Action) => void;
			run(world, action);
		}
	} finally {
		state.depth -= 1;
	}
}

export function holds(world: World, condition: Condition): boolean {
	const state = stateOf(world);
	switch (condition.if) {
		case 'level':
			return world.level >= condition.min && world.level <= condition.max;
		case 'score':
			return world.score >= condition.min;
		case 'view':
			return world.view === condition.mode;
		case 'health':
			return world.player.hp <= (world.maxHp(world.player) * condition.below) / 100;
		case 'chance':
			return world.random() * 100 < condition.percent;
		case 'kills': {
			const total = condition.entity
				? (state.kills[condition.entity] ?? 0)
				: Object.values(state.kills).reduce((sum, count) => sum + count, 0);
			return total >= condition.min;
		}
	}
}

/** The thing an event is about (a monster, an item, an upgrade), for the trigger's `only`. */
function subject(name: EventName, data: unknown): string | undefined {
	const read = (key: string): string | undefined => {
		const value = (data as Record<string, unknown> | undefined)?.[key];
		return typeof value === 'string' ? value : undefined;
	};
	const body = (data as { body?: Body } | undefined)?.body;
	const item = (data as { item?: { def: string } } | undefined)?.item;
	if (name === 'kill' || name === 'catch' || name === 'escape' || name === 'encounter')
		return body?.def;
	if (name === 'evolve' || name === 'faint') return body?.def;
	if (name === 'pickup') return item?.def;
	if (name === 'upgrade') return read('id');
	return undefined;
}

/** Hooks the configured triggers up to the world's events. */
export function installTriggers(world: World): void {
	const state = stateOf(world);
	const names = new Set(world.config.triggers.map((trigger) => trigger.on));
	for (const name of names) {
		if (name === 'interval') continue;
		world.events.on(name, (data: unknown) => {
			world.config.triggers.forEach((trigger, index) => {
				if (trigger.on !== name) return;
				if (trigger.once && state.fired.has(index)) return;
				// `key` triggers pick by their keys; `only` doesn't apply to them.
				if (name === 'key') {
					if (!trigger.keys.includes((data as { code: string }).code)) return;
				} else if (trigger.only !== '' && trigger.only !== subject(name, data)) return;
				if (!trigger.conditions.every((condition) => holds(world, condition))) return;
				state.fired.add(index);
				runActions(world, trigger.do);
			});
		});
	}
}

/** `interval` triggers run every few seconds. */
export function tickIntervals(world: World): void {
	const state = stateOf(world);
	world.config.triggers.forEach((trigger, index) => {
		if (trigger.on !== 'interval') return;
		const due = state.intervalDue[index] ?? world.time + trigger.every;
		state.intervalDue[index] = due;
		if (world.time < due) return;
		state.intervalDue[index] = world.time + trigger.every;
		if (trigger.once && state.fired.has(index)) return;
		if (!trigger.conditions.every((condition) => holds(world, condition))) return;
		state.fired.add(index);
		runActions(world, trigger.do);
	});
}
