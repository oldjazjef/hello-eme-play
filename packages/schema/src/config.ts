/**
 * The JSON configuration. Everything is optional: `resolveConfig` fills in the defaults and turns
 * nonsense into sensible values, so a hand-written or outdated JSON never breaks a website.
 * Plain data only (no DOM): the CMS plugin imports this file too.
 */
import { isObject, problems, resolve, toJsonSchema } from './dsl.js';
import { migrate } from './migrate.js';
import { SCHEMA_VERSION } from './version.js';
import { PLAY_SCHEMA } from './schema.js';
import type { PlayConfig } from './types.js';

const DEFAULT_ENTITIES = (resolve(PLAY_SCHEMA, {}) as PlayConfig).entities;

/** What an entity looks like, how big it is and how it behaves when its definition doesn't say. */
const KIND_DEFAULTS = {
	figure: { look: 'figure', size: 50, behavior: 'stand' },
	monster: { look: 'enemy', size: 50, behavior: 'chase' },
	vehicle: { look: 'car', size: 90, behavior: 'arrive' }
} as const;

function build(json: unknown): PlayConfig {
	const config = resolve(PLAY_SCHEMA, json) as PlayConfig;
	config.version = SCHEMA_VERSION;
	const given = isObject(json) && isObject(json.entities) ? json.entities : {};
	for (const [id, entity] of Object.entries(config.entities)) {
		const source = isObject(given[id]) ? given[id] : {};
		const defaults = KIND_DEFAULTS[entity.kind];
		for (const key of ['look', 'size', 'behavior'] as const) {
			if (source[key] === undefined) Object.assign(entity, { [key]: defaults[key] });
		}
	}
	// The played figure must exist, or there is nothing to steer.
	if (!config.entities[config.game.player]) {
		const fallback = DEFAULT_ENTITIES[config.game.player] ?? DEFAULT_ENTITIES.hero;
		if (fallback) config.entities[config.game.player] = fallback;
	}
	return config;
}

/** The complete default (classic) configuration. */
export const DEFAULT_CONFIG: PlayConfig = build({});

/** The JSON (parsed, any shape; old versions are migrated) as a complete configuration. */
export function resolveConfig(json: unknown): PlayConfig {
	return build(migrate(json));
}

/**
 * What `resolveConfig` would change or ignore in the JSON, as readable messages (for editors).
 * Empty when the JSON is fine as it is.
 */
export function configProblems(json: unknown): string[] {
	if (!isObject(json)) return ['The configuration must be a JSON object.'];
	const migrated = migrate(json);
	const resolved = resolveConfig(migrated);
	const found = problems(PLAY_SCHEMA, migrated, resolved);
	const player = resolved.entities[resolved.game.player];
	if (player && player.kind !== 'figure') {
		found.push(`"game.player" must name an entity of kind "figure".`);
	}
	for (const [index, rule] of resolved.spawns.entries()) {
		const kind = resolved.entities[rule.entity]?.kind;
		if (kind === 'figure') found.push(`"spawns[${index}].entity" can't be a figure.`);
	}
	return found;
}

/** The configuration as JSON Schema, for editors' autocompletion and validation. */
export function playJsonSchema(): Record<string, unknown> {
	return {
		$schema: 'https://json-schema.org/draft/2020-12/schema',
		$id: 'https://github.com/oldjazjef/hello-eme-play/blob/main/packages/schema/play.schema.json',
		...toJsonSchema(PLAY_SCHEMA)
	};
}
