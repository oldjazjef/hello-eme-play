import type {
	Action,
	EntityKind,
	ItemDefinition,
	PlayConfig,
	Pose,
	ViewMode
} from '@hello-eme/play-schema';
import type { EventBus } from './events.js';
import type { Random } from './random.js';

/** A walkable surface in page coordinates (side view): its top edge from x1 to x2. */
export interface Platform {
	x1: number;
	x2: number;
	y: number;
}

/**
 * What the world needs to know about the page it is played on. The browser runtime reads the
 * real page; tests and simulations use `createStaticHost`.
 */
export interface Host {
	/** Visible part of the page, px. `top`: height covered by a sticky header. */
	viewport(): { width: number; height: number; top: number };
	scroll(): { x: number; y: number };
	/** Size of the whole page, px. */
	page(): { width: number; height: number };
	scrollTo(x: number, y: number): void;
	/** Surfaces to stand on in the side view (page coordinates). */
	platforms(): readonly Platform[];
}

/** Something temporary on a stat (a buff from an item or trigger). */
export interface Mod {
	stat: string;
	amount: number;
	/** Seconds left. */
	left: number;
}

/** A figure, monster or vehicle in the world. Positions are page coordinates (px). */
export interface Body {
	id: number;
	/** Key into `config.entities`. */
	def: string;
	kind: EntityKind;
	x: number;
	y: number;
	/** Facing, in radians (0 = right, π/2 = down). */
	angle: number;
	/** Knockback, px/s; fades out. */
	vx: number;
	vy: number;
	/** Side view: vertical speed (px/s, down is positive) and whether it stands. */
	fall: number;
	grounded: boolean;
	/** Side view: seconds it falls through platforms (down pressed). */
	drop: number;
	hp: number;
	/** Base stats; upgrades change these, `mods` come on top. */
	stats: Record<string, number>;
	mods: Mod[];
	/** Seconds until the next move / invulnerable after a hit / "got hit" flash. */
	cooldown: number;
	invulnerable: number;
	hurt: number;
	/** Distance walked, drives the walk animation. */
	distance: number;
	moving: boolean;
	/** Topdown jump: seconds left (0 on the ground). */
	jump: number;
	/** The move being shown: pose and seconds left. */
	pose: { pose: Pose; left: number } | undefined;
	/** Vehicles: speed along the heading (px/s, negative reversing) and drift angle (rad). */
	speed: number;
	drift: number;
	/** Monsters: wander heading and seconds until it changes. */
	wander: { angle: number; left: number };
	/** Vehicles driving by themselves (arriving, leaving). */
	pilot: { targets: { x: number; y: number }[]; pause: number; leaving: boolean } | undefined;
	/** Seconds until the same vehicle can hurt this body again. */
	runOver: number;
	/** Parked and waiting (vehicles). */
	parked: boolean;
	/** Boss phases already started. */
	phase: number;
}

export interface Pickup {
	id: number;
	def: string;
	x: number;
	y: number;
	/** Seconds left; Infinity when it stays. */
	ttl: number;
	/** Side view: vertical speed and whether it rests. */
	fall: number;
	grounded: boolean;
	drop: number;
	age: number;
}

/** What the visitor does, set by the runtime (keyboard, touch, a bot in simulations). */
export interface Controls {
	/** -1..1 per axis. Vehicle: x steers, y is gas (-1) and brake (1). */
	axis: { x: number; y: number };
	/** Handbrake held. */
	drift: boolean;
	/** Moves held down (ids of `config.moves`); they repeat while their cooldown allows. */
	held: Set<string>;
	/** One-shot actions since the last step. */
	pressed: Set<'jump' | 'honk' | 'use'>;
}

export type Phase = 'lobby' | 'playing' | 'over' | 'won';

export type DefeatSource = 'move' | 'overrun' | 'trigger';

export interface WorldEvents extends Record<string, unknown> {
	start: { phase: Phase };
	spawn: { body: Body };
	kill: { body: Body; source: DefeatSource };
	hurt: { amount: number; from: Body | undefined };
	death: { lives: number };
	levelUp: { level: number };
	pickup: { item: Pickup; def: ItemDefinition };
	upgrade: { id: string; level: number };
	break: { points: number };
	enterVehicle: { vehicle: Body };
	exitVehicle: { vehicle: Body };
	viewChange: { mode: ViewMode };
	/** A key was pressed (`code` like `KeyB`) while playing. */
	key: { code: string };
	/** A move landed at `at`: the page layer breaks elements there. */
	strike: {
		at: { x: number; y: number };
		from: { x: number; y: number };
		move: string;
		power: number;
		breaks: boolean;
	};
	move: { move: string; pose: Pose };
	land: { x: number; y: number };
	honk: { x: number; y: number };
	points: { amount: number; total: number };
	message: { text: string };
	sound: { id: string };
	over: { won: boolean };
	/** A step of a wave script ran (`index` into `config.waves`, `step` into its steps). */
	wave: { index: number; label: string; step: number };
	/** A boss phase started (`index` into the entity's `phases`). */
	phase: { body: Body; index: number; label: string };
}

export interface Stats {
	seconds: number;
	drivingSeconds: number;
	rides: number;
	moves: number;
	kills: number;
	overrun: number;
	broken: number;
	jumps: number;
	honks: number;
	pickups: number;
	upgrades: number;
	/** Points earned (spending on upgrades doesn't lower it). */
	earned: number;
	kind: Record<string, number>;
}

export interface World {
	readonly config: PlayConfig;
	readonly events: EventBus<WorldEvents>;
	readonly random: Random;
	readonly host: Host;
	readonly controls: Controls;
	phase: Phase;
	view: ViewMode;
	/** Seconds since the round started. */
	time: number;
	level: number;
	/** Points the visitor has now (upgrades spend them). */
	score: number;
	lives: number;
	readonly player: Body;
	/** The vehicle the figure sits in. */
	riding: Body | undefined;
	readonly bodies: Body[];
	readonly pickups: Pickup[];
	readonly upgrades: Record<string, number>;
	readonly stats: Stats;

	/** Advances the game by `dt` seconds. */
	step(dt: number): void;
	/** A new body of an entity definition; undefined for unknown ones. */
	spawn(def: string, x: number, y: number): Body | undefined;
	/** Monsters (or any entity) at the edge of the visible window / near the figure. */
	spawnAt(def: string, count: number, where: 'edge' | 'near'): Body[];
	dropItem(def: string, x?: number, y?: number): Pickup | undefined;
	/** Starts a round: from the lobby (the figure steps out of the visiting car) or directly. */
	begin(): void;
	/** A vehicle drives in and parks (lobby). */
	visit(): Body | undefined;
	/** The visiting vehicle drives away. */
	dismissVisit(): void;
	/** Runs actions as a trigger would. */
	run(actions: readonly Action[]): void;
	setView(mode: ViewMode): void;
	nextLevel(): void;
	/** Effective value of a stat (base + temporary changes, within the stat's bounds). */
	stat(body: Body, id: string): number;
	maxHp(body: Body): number;
	/** Gets in or out of the vehicle nearby. */
	use(): void;
	/** A key was pressed (its `KeyboardEvent.code`): sets off the triggers bound to it. */
	press(code: string): void;
	canBuy(id: string): boolean;
	buy(id: string): boolean;
	/** The page layer broke an element. */
	broke(): void;
	/** Hurts a body; defeated monsters give points and drops. */
	damage(target: Body, amount: number, from: Body | undefined, source?: DefeatSource): void;
	end(won: boolean): void;
	/** Flat numbers for statistics (see `Stats`). */
	summary(): Record<string, number | string>;
}
