/**
 * The JSON configuration. Everything is optional: `resolveConfig` fills in the defaults and turns
 * nonsense into sensible values, so a hand-written or outdated JSON never breaks a website.
 * Plain data only (no DOM): the CMS plugin imports this file too.
 */

/** Bumped whenever the shape changes in a way old JSONs need a migration for. */
export const SCHEMA_VERSION = 1;

export const VIEW_MODES = ['topdown', 'side'] as const;
export type ViewMode = (typeof VIEW_MODES)[number];

export const ENTITY_KINDS = ['figure', 'monster', 'vehicle'] as const;
export type EntityKind = (typeof ENTITY_KINDS)[number];

export const BEHAVIORS = ['chase', 'wander', 'flee', 'stand'] as const;
export type Behavior = (typeof BEHAVIORS)[number];

/** Seconds (or a count); the actual value is random in between. */
export interface Range {
	min: number;
	max: number;
}

export interface StatDefinition {
	label: string;
	min: number;
	max: number;
}

export interface EntityDefinition {
	kind: EntityKind;
	/** Start values by stat id. */
	stats: Record<string, number>;
	behavior: Behavior;
	/** Key into `sprites`; empty: the built-in picture. */
	sprite: string;
	reward: { points: number };
}

export interface SpawnRule {
	/** Key into `entities`. */
	entity: string;
	/** Seconds between two spawns. */
	every: Range;
	/** Entities per spawn. */
	count: Range;
	/** Most of this entity alive at once. */
	max: number;
	/** The level this rule starts in. */
	fromLevel: number;
}

export interface PlayConfig {
	version: number;
	view: { mode: ViewMode };
	stats: Record<string, StatDefinition>;
	entities: Record<string, EntityDefinition>;
	spawns: SpawnRule[];
}

export const DEFAULT_CONFIG: PlayConfig = {
	version: SCHEMA_VERSION,
	view: { mode: 'topdown' },
	stats: {
		hp: { label: 'HP', min: 0, max: 9999 },
		attack: { label: 'Attack', min: 0, max: 9999 },
		speed: { label: 'Speed', min: 0, max: 1000 }
	},
	entities: {},
	spawns: []
};

/** Upper bounds, so a typo (an extra zero) can't make the game unplayable. */
export const LIMITS = { seconds: 3600, count: 50, max: 200, stat: 1_000_000, level: 100 } as const;

type Json = Record<string, unknown>;

export const isObject = (value: unknown): value is Json =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const object = (value: unknown): Json => (isObject(value) ? value : {});

/** A finite number in [min, max]; anything else is the fallback. */
function number(value: unknown, fallback: number, min: number, max: number): number {
	if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
	return Math.min(max, Math.max(min, value));
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
	return allowed.find((candidate) => candidate === value) ?? fallback;
}

/** A range in the right order even if the two values were swapped. */
function range(value: unknown, fallback: Range, min: number, max: number): Range {
	const source = object(value);
	const a = number(source.min, fallback.min, min, max);
	const b = number(source.max, fallback.max, min, max);
	return { min: Math.min(a, b), max: Math.max(a, b) };
}

function stats(value: unknown): Record<string, StatDefinition> {
	const source = object(value);
	const defined = Object.keys(source).length > 0 ? source : DEFAULT_CONFIG.stats;
	return Object.fromEntries(
		Object.entries(defined).map(([id, raw]) => {
			const stat = object(raw);
			const min = number(stat.min, 0, -LIMITS.stat, LIMITS.stat);
			const max = number(stat.max, LIMITS.stat, min, LIMITS.stat);
			return [
				id,
				{ label: typeof stat.label === 'string' && stat.label ? stat.label : id, min, max }
			];
		})
	);
}

function entities(value: unknown, defined: Record<string, StatDefinition>) {
	return Object.fromEntries(
		Object.entries(object(value)).map(([id, raw]) => {
			const entity = object(raw);
			const start = Object.entries(object(entity.stats)).flatMap(([stat, amount]) => {
				const definition = defined[stat];
				return definition && typeof amount === 'number' && Number.isFinite(amount)
					? [[stat, Math.min(definition.max, Math.max(definition.min, amount))]]
					: [];
			});
			const reward = object(entity.reward);
			const definition: EntityDefinition = {
				kind: oneOf(entity.kind, ENTITY_KINDS, 'monster'),
				stats: Object.fromEntries(start),
				behavior: oneOf(entity.behavior, BEHAVIORS, 'chase'),
				sprite: typeof entity.sprite === 'string' ? entity.sprite : '',
				reward: { points: Math.round(number(reward.points, 0, 0, LIMITS.stat)) }
			};
			return [id, definition];
		})
	);
}

function spawns(value: unknown, known: Record<string, EntityDefinition>): SpawnRule[] {
	if (!Array.isArray(value)) return [];
	return value.flatMap((raw) => {
		const rule = object(raw);
		// A rule for an entity that doesn't exist can't spawn anything.
		if (typeof rule.entity !== 'string' || !(rule.entity in known)) return [];
		const count = range(rule.count, { min: 1, max: 1 }, 1, LIMITS.count);
		return [
			{
				entity: rule.entity,
				every: range(rule.every, { min: 12, max: 30 }, 1, LIMITS.seconds),
				count: { min: Math.round(count.min), max: Math.round(count.max) },
				max: Math.round(number(rule.max, 8, 1, LIMITS.max)),
				fromLevel: Math.round(number(rule.fromLevel, 1, 1, LIMITS.level))
			}
		];
	});
}

/** The JSON (parsed, any shape) as a complete configuration. */
export function resolveConfig(json: unknown): PlayConfig {
	const source = object(json);
	const defined = stats(source.stats);
	const known = entities(source.entities, defined);
	return {
		version: SCHEMA_VERSION,
		view: { mode: oneOf(object(source.view).mode, VIEW_MODES, DEFAULT_CONFIG.view.mode) },
		stats: defined,
		entities: known,
		spawns: spawns(source.spawns, known)
	};
}

/**
 * What `resolveConfig` would change or ignore in the JSON, as readable messages (for editors).
 * Empty when the JSON is fine as it is.
 */
export function configProblems(json: unknown): string[] {
	if (!isObject(json)) return ['The configuration must be a JSON object.'];
	const problems: string[] = [];
	const known = new Set(['version', 'view', 'stats', 'entities', 'spawns']);
	for (const key of Object.keys(json)) {
		if (!known.has(key)) problems.push(`Unknown setting "${key}".`);
	}
	const mode = object(json.view).mode;
	if (mode !== undefined && !VIEW_MODES.some((candidate) => candidate === mode)) {
		problems.push('"view.mode" must be "topdown" or "side".');
	}
	const entityIds = Object.keys(object(json.entities));
	if (Array.isArray(json.spawns)) {
		json.spawns.forEach((raw, index) => {
			const entity = object(raw).entity;
			if (typeof entity !== 'string' || !entityIds.includes(entity)) {
				problems.push(`"spawns[${index}].entity" must name an entity from "entities".`);
			}
		});
	} else if (json.spawns !== undefined) {
		problems.push('"spawns" must be a list.');
	}
	return problems;
}
