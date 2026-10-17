/** Pieces the example games share: moves, sounds and a short way to write a monster. */

type Json = Record<string, unknown>;

/** The moves the games pick from. A game that lists `moves` replaces the defaults, so it names them all. */
export const MOVES: Record<string, Json> = {
	punch: {
		label: 'Punch',
		keys: ['Space'],
		power: 1,
		reach: 30,
		cooldown: 0.22,
		seconds: 0.22,
		push: 260,
		pose: 'punch'
	},
	kick: {
		label: 'Kick',
		keys: ['KeyQ'],
		power: 2,
		reach: 40,
		cooldown: 0.4,
		seconds: 0.4,
		push: 520,
		pose: 'kick'
	},
	bite: {
		label: 'Bite',
		keys: [],
		power: 1,
		reach: 30,
		cooldown: 1.1,
		seconds: 0.2,
		push: 0,
		breaks: false,
		pose: 'bite'
	},
	tackle: {
		label: 'Tackle',
		keys: [],
		power: 1,
		reach: 38,
		cooldown: 0.8,
		seconds: 0.25,
		push: 180,
		breaks: false,
		pose: 'kick'
	},
	scratch: {
		label: 'Scratch',
		keys: [],
		power: 1.3,
		reach: 34,
		cooldown: 0.6,
		seconds: 0.2,
		push: 120,
		breaks: false,
		pose: 'punch'
	},
	chomp: {
		label: 'Chomp',
		keys: [],
		power: 1.8,
		reach: 38,
		cooldown: 1,
		seconds: 0.25,
		push: 100,
		breaks: false,
		pose: 'bite'
	},
	slam: {
		label: 'Slam',
		keys: [],
		power: 2.5,
		reach: 60,
		cooldown: 1.6,
		seconds: 0.4,
		push: 480,
		breaks: false,
		pose: 'kick'
	},
	sword: {
		label: 'Sword',
		keys: ['Space'],
		power: 2,
		reach: 50,
		cooldown: 0.35,
		seconds: 0.25,
		push: 300,
		pose: 'punch'
	},
	bash: {
		label: 'Shield bash',
		keys: ['KeyQ'],
		power: 3,
		reach: 42,
		cooldown: 0.8,
		seconds: 0.35,
		push: 700,
		pose: 'kick'
	}
};

/** Short synth sounds for the events games listen to. */
export const SOUNDS: Record<string, Json> = {
	hit: { wave: 'square', from: 220, to: 110, seconds: 0.1 },
	coin: { wave: 'triangle', from: 660, to: 990, seconds: 0.15 },
	level: { wave: 'sawtooth', from: 220, to: 880, seconds: 0.4 },
	throw: { wave: 'triangle', from: 300, to: 500, seconds: 0.08, volume: 0.3 },
	boom: { wave: 'sawtooth', from: 160, to: 40, seconds: 0.35, volume: 0.6 },
	catch: { wave: 'triangle', from: 500, to: 1100, seconds: 0.35 },
	escape: { wave: 'sawtooth', from: 320, to: 120, seconds: 0.25 },
	encounter: { wave: 'square', from: 330, to: 700, seconds: 0.18 },
	evolve: { wave: 'triangle', from: 400, to: 1300, seconds: 0.6 },
	faint: { wave: 'sawtooth', from: 300, to: 70, seconds: 0.5 }
};

export interface MonsterOptions {
	label: string;
	sprite: string;
	size?: number;
	hp: number;
	attack: number;
	speed: number;
	defense?: number;
	behavior?: 'chase' | 'wander' | 'flee' | 'stand';
	moves?: string[];
	points?: number;
	drops?: { item: string; chance: number }[];
	/** Anything else of an entity (`throws`, `breed`, `evolve`, `boss`, `hideIn` …). */
	extra?: Json;
}

/** A monster entity in the JSON form the configuration takes. */
export function monster(options: MonsterOptions): Json {
	return {
		kind: 'monster',
		label: options.label,
		sprite: options.sprite,
		size: options.size ?? 56,
		stats: {
			hp: options.hp,
			attack: options.attack,
			defense: options.defense ?? 0,
			speed: options.speed
		},
		behavior: options.behavior ?? 'chase',
		moves: options.moves ?? ['bite'],
		reward: { points: options.points ?? 50, drops: options.drops ?? [] },
		...options.extra
	};
}

/** A spawn rule in the JSON form. */
export function spawn(
	entity: string,
	every: [number, number],
	count: [number, number],
	max: number,
	levels: [number, number] = [1, 100],
	scalePerLevel = 0
): Json {
	return {
		entity,
		every: { min: every[0], max: every[1] },
		count: { min: count[0], max: count[1] },
		max,
		fromLevel: levels[0],
		toLevel: levels[1],
		scalePerLevel
	};
}

/** An item spawn rule in the JSON form. */
export function drop(
	item: string,
	every: [number, number],
	max: number,
	levels: [number, number] = [1, 100]
): Json {
	return {
		item,
		every: { min: every[0], max: every[1] },
		max,
		fromLevel: levels[0],
		toLevel: levels[1]
	};
}

export const say = (text: string): Json => ({ do: 'message', text });
