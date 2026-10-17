import type { ActiveWave } from './waves.js';
import type { World } from './types.js';

/** Bookkeeping the world keeps for its systems (timers, counters); not part of the public API. */
export interface State {
	nextId: number;
	/** Per spawn rule / item rule / interval trigger: the time (s) it fires next. */
	spawnDue: number[];
	itemDue: number[];
	/** The next time (s) a hidden monster may be revealed again, so two don't jump out at once. */
	encounterDue: number;
	/** Throwables the figure carries, and the time (s) each can be used again. */
	ammo: Record<string, number>;
	throwDue: Record<string, number>;
	intervalDue: number[];
	/** Triggers that already ran (`once`). */
	fired: Set<number>;
	/** The wave scripts of the current level (replaced whenever a level starts). */
	waves: ActiveWave[];
	/** Beaten monsters by entity id. */
	kills: Record<string, number>;
	/** Counters since the current level began. */
	level: { time: number; earned: number; kills: number; boss: boolean };
	/** Time (s) the vehicle drives in; undefined: not planned (or came already). */
	carDue: number | undefined;
	/** Trigger actions running inside each other (recursion guard). */
	depth: number;
	/** Vehicle stats added by upgrades that apply to every vehicle. */
	vehicleBonus: Record<string, number>;
	/** When the figure got into the vehicle (s), for the driving time. */
	rideSince: number | undefined;
	ridden: number;
}

const states = new WeakMap<World, State>();

export function stateOf(world: World): State {
	const state = states.get(world);
	if (!state) throw new Error('The world has no state yet.');
	return state;
}

export function setState(world: World, state: State): void {
	states.set(world, state);
}
