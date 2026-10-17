/**
 * The resolved configuration as TypeScript types. `schema.ts` is the source of truth for defaults
 * and bounds; `config.test.ts` checks that a resolved default configuration has exactly this shape.
 */
import type { GameTexts, Locale } from './texts.js';

export interface Range {
	min: number;
	max: number;
}

export const VIEW_MODES = ['topdown', 'side'] as const;
export type ViewMode = (typeof VIEW_MODES)[number];

export const ENTITY_KINDS = ['figure', 'monster', 'vehicle'] as const;
export type EntityKind = (typeof ENTITY_KINDS)[number];

export const BEHAVIORS = [
	'chase',
	'wander',
	'flee',
	'stand',
	'arrive',
	'drift',
	'bounce',
	'patrol',
	'ghost',
	'paddle'
] as const;
export type Behavior = (typeof BEHAVIORS)[number];

export const LOOKS = ['figure', 'enemy', 'car'] as const;
export type Look = (typeof LOOKS)[number];

export const CONTROLS = ['walk', 'ship', 'grid', 'slide'] as const;
export type Control = (typeof CONTROLS)[number];

export const PITS = ['none', 'bottom', 'top', 'left', 'right', 'leftright', 'topbottom'] as const;
export type Pit = (typeof PITS)[number];

export const ATTACK_KINDS = ['fan', 'charge', 'rain', 'summon', 'teleport'] as const;
export type AttackKind = (typeof ATTACK_KINDS)[number];

export const WEAK_SIDES = ['any', 'front', 'back', 'flank'] as const;
export type WeakSide = (typeof WEAK_SIDES)[number];

export const ITEM_LOOKS = [
	'heart',
	'star',
	'gem',
	'bolt',
	'wall',
	'spikes',
	'bush',
	'puddle',
	'brick',
	'pellet'
] as const;
export type ItemLook = (typeof ITEM_LOOKS)[number];

export const THROWABLE_LOOKS = ['bomb', 'rock', 'mine', 'ball', 'bullet'] as const;
export type ThrowableLook = (typeof THROWABLE_LOOKS)[number];

export const HIDEOUT_LOOKS = ['grass', 'bush', 'water', 'rocks'] as const;
export type HideoutLook = (typeof HIDEOUT_LOOKS)[number];

export const FACINGS = ['right', 'down', 'left', 'up'] as const;
export type Facing = (typeof FACINGS)[number];

export const POSES = ['punch', 'kick', 'bite'] as const;
export type Pose = (typeof POSES)[number];

export const EVENT_NAMES = [
	'start',
	'interval',
	'kill',
	'hurt',
	'death',
	'levelUp',
	'pickup',
	'upgrade',
	'break',
	'enterVehicle',
	'exitVehicle',
	'viewChange',
	'key',
	'catch',
	'escape',
	'encounter',
	'evolve',
	'faint',
	'throw',
	'explode',
	'breed',
	'wreck',
	'summon',
	'touch',
	'lost',
	'split',
	'stomp',
	'attack'
] as const;
export type EventName = (typeof EVENT_NAMES)[number];

export const GOALS = ['none', 'score', 'kills', 'survive', 'boss', 'clear'] as const;
export type GoalType = (typeof GOALS)[number];

export interface StatDefinition {
	label: string;
	min: number;
	max: number;
}

export const ANIMATIONS = ['idle', 'walk', 'jump', 'hurt', 'punch', 'kick', 'bite'] as const;
export type Animation = (typeof ANIMATIONS)[number];

export interface SpriteDefinition {
	url: string;
	/** Longer side of one frame, px. */
	size: number;
	/** A sprite sheet: frames laid out in a grid, numbered row by row from 0. */
	columns: number;
	rows: number;
	fps: number;
	/** Frame numbers by state; empty falls back to `idle`, then to frame 0. */
	animations: Record<Animation, number[]>;
	facing: Facing;
	/** From above: turn the picture to where it goes (false: it stays upright and only mirrors). */
	rotate: boolean;
}

/**
 * How a vehicle handles (seen from above). The vehicle's stats `speed`, `accel` and `handling` say
 * how fast and how nimble it is; these say how it feels: grip, braking, sliding.
 */
export interface DriveDefinition {
	/** Top speed in reverse, px/s. */
	reverse: number;
	/** Braking while going the other way, px/s². */
	brake: number;
	/** Rolling out with no pedal pressed, px/s². */
	roll: number;
	/** How fast the drift angle fades (1/s) with the tires gripping and with the handbrake. */
	grip: number;
	slideGrip: number;
	/** Largest drift angle, rad. */
	maxDrift: number;
	/** Handbrake: how much tighter it turns, and how much speed it takes away (px/s²). */
	handbrakeTurn: number;
	handbrakeDrag: number;
}

/** What a vehicle does to monsters it runs into. */
export interface RamDefinition {
	/** Multiplies the vehicle's `attack` (which also grows with its speed). */
	power: number;
	/** Hurts from this speed on (px/s); 0: `game.overrunSpeed`. */
	minSpeed: number;
}

export interface EntityDefinition {
	kind: EntityKind;
	label: string;
	/** Key into `sprites`; empty: the built-in picture (`look`). */
	sprite: string;
	look: Look;
	/** Length of the picture's longer side on the page, px. */
	size: number;
	/** Start values by stat id. */
	stats: Record<string, number>;
	behavior: Behavior;
	/** Keys into `moves`. */
	moves: string[];
	reward: { points: number; drops: { item: string; chance: number }[] };
	/** Shows a health bar at the top and counts for the `boss` goal. */
	boss: boolean;
	/** Bosses: run once each when health drops below `below` percent (any order of listing). */
	phases: BossPhase[];
	/** Vehicles: how it handles, what it does to monsters, whether it takes the hits for the driver. */
	drive: DriveDefinition;
	ram: RamDefinition;
	absorbs: boolean;
	/** Monsters: what it throws or drops at the figure, from how far, and how often. */
	throws: MonsterThrow[];
	/** Monsters: how easily a ball catches it, percent of the ball's strength (0: can't be caught). */
	catchRate: number;
	/** Monsters: key into `hideouts`; it spawns hidden there until the figure comes close. */
	hideIn: string;
	/** Monsters: has offspring now and then. */
	breed: BreedDefinition;
	/** Monsters: grows stronger over time or by hitting, and may turn into something else. */
	evolve: EvolveDefinition;
	/** `drift` and `bounce`: the direction it starts in, degrees (0 = right, 90 = down; -1: any). */
	heading: number;
	/** Round, or a thin bar (a paddle) as long as `size` across the way it slides. */
	shape: 'round' | 'bar';
	/** Monsters: breaks into smaller ones when beaten. */
	split: SplitDefinition;
	/** Monsters: comes back at its start place this many seconds after being beaten (0: never). */
	respawn: number;
	/** Bosses: takes more (or less) damage depending on where the attacker stands. */
	weakSpot: WeakSpotDefinition;
	/** Bosses: cannot be hurt while one of this kind is alive (empty: none). */
	shieldedBy: string;
	/** Bosses: the attacks it cycles through, each with its own pause, from and to a phase. */
	attacks: BossAttack[];
}

export interface SplitDefinition {
	/** Key into `entities`; empty: it just goes. */
	into: string;
	count: Range;
	/** Faster than the parent by this many percent. */
	faster: number;
}

export interface WeakSpotDefinition {
	/** Where the attacker has to stand, seen from the boss' facing. */
	side: WeakSide;
	/** Damage factor from that side, and from everywhere else. */
	multiplier: number;
	other: number;
}

export interface BossAttack {
	kind: AttackKind;
	/** Seconds between two uses. */
	every: number;
	/** Seconds the boss shows what is coming (and can be dodged) before it happens. */
	windup: number;
	/** Used from this phase on (0: from the start) up to `toPhase` (0: to the end). */
	fromPhase: number;
	toPhase: number;
	/** `fan`, `rain`: key into `throwables`. `summon`: key into `entities`. */
	throwable: string;
	entity: string;
	/** Shots, falling objects or summoned monsters. */
	count: number;
	/** `fan`: angle covered, degrees (360: all around). */
	spread: number;
	/** Only while the figure is closer than this (0: from anywhere), px. */
	range: number;
	/** `charge`: speed in percent of its own, and how long it lasts (seconds). */
	boost: number;
	seconds: number;
}

export interface BreedDefinition {
	/** Seconds between litters (max 0: never). */
	every: Range;
	/** Young per litter. */
	count: Range;
	/** No litter while this many of the young's kind are alive. */
	max: number;
	/** Key into `entities`; empty: its own kind. */
	into: string;
}

export interface EvolveDefinition {
	/** Seconds until the next level (0: not by time). */
	every: number;
	/** Hits on the figure until the next level (0: not by hitting). */
	hits: number;
	/** Monsters beaten until the next level (0: not by beating; counts for team members). */
	kills: number;
	maxLevel: number;
	/** Added to its stats for each level (`hp` heals by the same amount). */
	stats: Record<string, number>;
	/** Added to its size for each level, px. */
	size: number;
	/** Key into `entities`: what it becomes at its top level (empty: stays). */
	into: string;
}

export interface MonsterThrow {
	/** Key into `throwables`. */
	throwable: string;
	/** Throws when the figure is closer than this (px). */
	range: number;
	/** Seconds until it throws again. */
	cooldown: number;
}

export interface BossPhase {
	/** Percent of maximum health. */
	below: number;
	/** Shown as a message when the phase starts (empty: none). */
	label: string;
	/** Added to the boss' stats for good (`hp` heals by the same amount). */
	stats: Record<string, number>;
	do: Action[];
}

export interface MoveDefinition {
	label: string;
	/** Keyboard keys (for the figure); monsters use their moves on their own. */
	keys: string[];
	/** Multiplies the attacker's `attack` stat. */
	power: number;
	/** Distance from the attacker's center, px. */
	reach: number;
	/** Seconds until the next move (shortened by `dex`). */
	cooldown: number;
	/** Seconds the pose is shown. */
	seconds: number;
	/** Knockback in px/s. */
	push: number;
	/** Hits page elements (cracks, then breaks them). */
	breaks: boolean;
	pose: Pose;
	sound: string;
	/** Where the move can be used. */
	where: 'foot' | 'vehicle' | 'both';
}

export interface SpawnRule {
	entity: string;
	every: Range;
	count: Range;
	max: number;
	fromLevel: number;
	toLevel: number;
	/** Added to every stat in percent for each level beyond `fromLevel` (harder later). */
	scalePerLevel: number;
}

export interface ItemSpawnRule {
	item: string;
	/** How many are placed over the page when the round starts. */
	initial: number;
	every: Range;
	max: number;
	fromLevel: number;
	toLevel: number;
}

export interface ItemDefinition {
	label: string;
	sprite: string;
	look: ItemLook;
	size: number;
	/** `touch`: picked up by walking onto it. `use`: the use key picks it up. `none`: an object that stays. */
	pickup: 'touch' | 'use' | 'none';
	/** Seconds until it vanishes (0: stays). */
	lifetime: number;
	/** Blocks the way: figures, monsters and vehicles can't walk through it. */
	solid: boolean;
	/** Whatever stands in it is hidden: invisible monsters, a figure monsters can't see. */
	hides: boolean;
	/** Objects (`pickup: none`): seconds between two runs of `do` while the figure touches it. */
	every: number;
	/** Health lost per second by whoever touches it (negative: gained). */
	damage: number;
	/** Who it hurts (or heals): the figure and its team, the monsters, or everyone. */
	damageWho: 'figure' | 'monsters' | 'all';
	/** A rectangular hit area (`aspect` = width ÷ height) instead of a round one. */
	box: boolean;
	aspect: number;
	/** Side view: can be stood on from above (and stays where it is instead of falling). */
	platform: boolean;
	/** Side view: stays in the air where it is, instead of falling to the ground. */
	float: boolean;
	/** Hits a bouncing ball takes before it breaks and runs `do` (0: unbreakable). */
	hp: number;
	/** The `clear` goal waits until every such item is gone. */
	required: boolean;
	do: Action[];
}

/** Something the figure throws or drops (a bomb, a rock, a mine) and that goes off. */
export interface ThrowableDefinition {
	label: string;
	sprite: string;
	look: ThrowableLook;
	size: number;
	/** Keyboard keys (the touch screen gets a button anyway). */
	keys: string[];
	/** Where it can be used. */
	where: 'foot' | 'vehicle' | 'both';
	/** From a vehicle: out of the front or the back. */
	direction: 'front' | 'back';
	/** Launch speed, px/s (0: dropped on the spot). A vehicle's own speed is added. */
	speed: number;
	/** Seconds until it goes off (0: when it touches a monster, or lands, or comes to rest). */
	fuse: number;
	/** Side view, with a fuse: how much of its speed it keeps bouncing off the ground (0..1). */
	bounce: number;
	/** Multiplies the thrower's `attack`. */
	power: number;
	/** Blast radius, px (0: only the monster it touches). */
	radius: number;
	/** Knockback in px/s. */
	push: number;
	/** The blast breaks page elements. */
	breaks: boolean;
	/** The blast also hurts the figure (and its vehicle) when close. */
	hurtsFigure: boolean;
	/** Seconds until the next one. */
	cooldown: number;
	/** A ball: tries to catch the monster it touches instead of hurting it (strength 1–100, 0: no). */
	catch: number;
	/** How many the figure starts with, and the most it can carry. */
	ammo: number;
	maxAmmo: number;
	/** Never runs out. */
	unlimited: boolean;
	/** Holding the key keeps using it (as often as the cooldown allows). */
	auto: boolean;
	/** Keys into `audio.sounds`. */
	sound: string;
	explodeSound: string;
}

/** Places on the page where monsters can hide: tall grass, bushes, a pond, rocks. */
export interface HideoutDefinition {
	label: string;
	/** Key into `sprites`: drawn instead of the built-in look, several times over the patch. */
	sprite: string;
	look: HideoutLook;
	/** How many patches there are on the page. */
	count: number;
	/** Size of a patch, px (radius). */
	radius: Range;
	/** Chance (percent per second) that a hidden monster jumps out while the figure walks through. */
	encounter: number;
}

export interface UpgradeDefinition {
	label: string;
	help: string;
	/** Points per level. */
	cost: number;
	/** How often it can be bought. */
	max: number;
	/** Added to the figure's stats per level. */
	stats: Record<string, number>;
	/** The vehicle gets the stats too. */
	vehicle: boolean;
	minLevel: number;
	do: Action[];
}

export type Action =
	| { do: 'spawn'; entity: string; count: number; where: 'edge' | 'near' | 'figure' }
	| { do: 'setView'; mode: ViewMode }
	| { do: 'points'; amount: number }
	| { do: 'heal'; amount: number }
	| {
			do: 'stat';
			stat: string;
			amount: number;
			target: 'figure' | 'vehicle' | 'monsters';
			seconds: number;
	  }
	| { do: 'dropItem'; item: string }
	| { do: 'ammo'; throwable: string; amount: number }
	| { do: 'recruit'; entity: string }
	| { do: 'healParty'; amount: number }
	| { do: 'callTeam' }
	| { do: 'hazard'; throwable: string; where: 'figure' | 'near' | 'edge'; count: number }
	| { do: 'grow'; amount: number }
	| { do: 'toStart' }
	| { do: 'checkpoint' }
	| { do: 'launch'; speed: number }
	| { do: 'scare'; seconds: number }
	| { do: 'nextLevel' }
	| { do: 'message'; text: string }
	| { do: 'sound'; sound: string }
	| { do: 'win' }
	| { do: 'lose' };

export type Condition =
	| { if: 'level'; min: number; max: number }
	| { if: 'score'; min: number }
	| { if: 'view'; mode: ViewMode }
	| { if: 'health'; below: number }
	| { if: 'chance'; percent: number }
	| { if: 'kills'; entity: string; min: number }
	| { if: 'ammo'; throwable: string; min: number }
	| { if: 'team'; min: number }
	| { if: 'riding'; entity: string };

export interface Trigger {
	on: EventName;
	/** Only for events about this entity / item / upgrade (empty: any). */
	only: string;
	/** For `interval`: seconds between two runs. */
	every: number;
	/** For `key`: the key codes that set it off. */
	keys: string[];
	once: boolean;
	conditions: Condition[];
	do: Action[];
}

export interface WaveStep {
	/** Seconds after the wave started. */
	at: number;
	/** Seconds between repeats (used when `repeat` is above 0). */
	every: number;
	/** How many more times it runs after the first (0: once). */
	repeat: number;
	do: Action[];
}

/** A timed script: starts `after` seconds into each level of its range, then runs its steps. */
export interface Wave {
	label: string;
	fromLevel: number;
	toLevel: number;
	after: number;
	steps: WaveStep[];
}

/** A configuration for some pages: the partial JSON is merged over the base. */
export interface PageRule {
	/** Glob on the page's path: `*` matches any characters (`/blog/*`, `/projects`, `*`). */
	match: string;
	/** Partial configuration JSON (never contains `pages`). */
	config: Record<string, unknown>;
}

export interface Goal {
	type: GoalType;
	amount: number;
}

/** A character of a map and what it puts on the page. */
export interface MapSymbol {
	/** Key into `items` (empty: none). */
	item: string;
	/** Key into `entities` (empty: none). */
	entity: string;
	/** Degrees an entity starts in (0 = right, 90 = down; -1: its own `heading`). */
	angle: number;
	/** Where the figure starts. */
	start: boolean;
}

/** A level drawn as text: every character of a row is one cell, placed in the middle of the window. */
export interface MapDefinition {
	label: string;
	rows: string[];
	/** Size of a cell, px (also the grid of `grid` control). It shrinks when the map does not fit the window. */
	cell: number;
	/** Where it stands in the window: in the middle, or on the ground (side view). */
	align: 'center' | 'bottom';
	/** Character → what is there. Characters not listed (and spaces) stay empty. */
	legend: Record<string, MapSymbol>;
}

export interface LevelDefinition {
	label: string;
	/** Key into `maps`: put on the page when the level starts (empty: none). */
	map: string;
	/** Switches the view when the level starts (empty: keeps it). */
	view: '' | ViewMode;
	goal: Goal;
}

export interface SoundDefinition {
	wave: 'sine' | 'square' | 'sawtooth' | 'triangle';
	/** Hz at start and end (a slide), and length in seconds. */
	from: number;
	to: number;
	seconds: number;
	volume: number;
}

export interface PlayConfig {
	version: number;
	enabled: boolean;
	locale: Locale;
	view: {
		mode: ViewMode;
		/** Side view: px/s². */
		gravity: number;
		/** Side view: take-off speed of a jump, px/s. */
		jumpSpeed: number;
		/** Side view: page elements to stand on. */
		platforms: { selector: string; minWidth: number };
		/** Side view: how often the figure can jump again in the air. */
		airJumps: number;
	};
	game: {
		/** The entity the visitor plays. */
		player: string;
		lives: number;
		/** Walking out at the end of the page comes back in at the other end. */
		wrap: boolean;
		/** Vehicles run monsters over from this speed (px/s). */
		overrunSpeed: number;
		/** Points per broken page element. */
		breakPoints: number;
		/** How many caught monsters the figure can carry. */
		partySize: number;
		/** How the figure is steered. */
		control: Control;
		/** `slide`: which way the figure slides along its edge of the window. */
		slideAxis: 'x' | 'y';
		/** Where things happen: the whole page, or the window as it is at the start (the page stays put). */
		arena: 'page' | 'screen';
		/** A bouncing ball that leaves the window on this side is lost (the `lost` event). */
		pit: Pit;
		/** `death`: after losing a life the figure starts again at its starting place; `hit`: every hit costs a life. */
		respawn: 'stay' | 'death' | 'hit';
		/** Side view: landing on a monster hurts it for this many times the attack (0: off). */
		stomp: number;
		/** `ship`: how it flies. */
		ship: { thrust: number; turn: number; maxSpeed: number; drag: number };
		/** `grid`: moves cell by cell. */
		grid: { cell: number; auto: boolean; crash: boolean; tail: boolean };
	};
	stats: Record<string, StatDefinition>;
	sprites: Record<string, SpriteDefinition>;
	entities: Record<string, EntityDefinition>;
	moves: Record<string, MoveDefinition>;
	items: Record<string, ItemDefinition>;
	throwables: Record<string, ThrowableDefinition>;
	hideouts: Record<string, HideoutDefinition>;
	upgrades: Record<string, UpgradeDefinition>;
	spawns: SpawnRule[];
	itemSpawns: ItemSpawnRule[];
	/** A vehicle drives in by itself. */
	visits: {
		enabled: boolean;
		vehicle: string;
		/** Seconds after the page loaded (once per browser session, while nobody plays). */
		delay: Range;
		/** Also drives in while playing, after `playDelay` seconds into the round. */
		whilePlaying: boolean;
		playDelay: Range;
	};
	maps: Record<string, MapDefinition>;
	waves: Wave[];
	triggers: Trigger[];
	levels: LevelDefinition[];
	keys: {
		left: string[];
		right: string[];
		up: string[];
		down: string[];
		jump: string[];
		drift: string[];
		honk: string[];
		use: string[];
		shop: string[];
		/** Shows or hides the instructions. */
		hint: string[];
		/** Sends out the next team member (and calls the one out back). */
		party: string[];
	};
	hint: { hideAfter: number; pauseWhileOpen: boolean };
	audio: {
		enabled: boolean;
		volume: number;
		sounds: Record<string, SoundDefinition>;
		events: Record<string, string>;
	};
	progress: { save: boolean; key: string };
	/** Empty: the default text of `locale`. */
	texts: GameTexts;
	/** Different settings per page; see `resolveConfigFor`. */
	pages: PageRule[];
}
