/**
 * The JSON configuration. Everything is optional: `resolveConfig` fills in the defaults and turns
 * nonsense into sensible values, so a hand-written or outdated JSON never breaks a website.
 * Plain data only (no DOM): the CMS plugin imports this file too.
 */
import { isObject, problems, resolve, toJsonSchema } from './dsl.js';
import { migrate } from './migrate.js';
import { cleanPages, mergeConfig, pageConfigFor, withoutPages } from './pages.js';
import { SCHEMA_VERSION } from './version.js';
import { DRIVE, PAGE_CONFIG, PLAY_SCHEMA } from './schema.js';
import type { DriveDefinition, PlayConfig } from './types.js';

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
	// A page's settings stay as written (a partial JSON); they are resolved after the merge.
	config.pages = cleanPages(isObject(json) ? json.pages : undefined);
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

/** How a vehicle handles when its definition doesn't say (the car's). */
export const DEFAULT_DRIVE = resolve(DRIVE, {}) as DriveDefinition;

/** The complete default (classic) configuration. */
export const DEFAULT_CONFIG: PlayConfig = build({});

/** The JSON (parsed, any shape; old versions are migrated) as a complete configuration. */
export function resolveConfig(json: unknown): PlayConfig {
	return build(migrate(json));
}

/**
 * The JSON for `path`: the matching `pages` entries are merged over the base (in the order they
 * are listed, see `mergeConfig`), then the result is resolved like any configuration.
 */
export function resolveConfigFor(json: unknown, path: string): PlayConfig {
	const migrated = migrate(json);
	const base = resolveConfig(migrated);
	if (base.pages.length === 0 || !isObject(migrated)) return base;
	const merged = mergeConfig(withoutPages(migrated), pageConfigFor(base.pages, path));
	return resolveConfig({ ...(merged as Record<string, unknown>), pages: base.pages });
}

type Json = Record<string, unknown>;

/** What the generic problems can't say: references between sections of the configuration. */
function semanticProblems(json: Json, resolved: PlayConfig, at: string): string[] {
	const prefix = at ? `${at}.` : '';
	const found: string[] = [];
	const given = (key: string) => at === '' || key in json;
	if (at === '' || (isObject(json.game) && 'player' in json.game)) {
		const player = resolved.entities[resolved.game.player];
		if (player && player.kind !== 'figure') {
			found.push(`"${prefix}game.player" must name an entity of kind "figure".`);
		}
	}
	if (given('spawns')) {
		for (const [index, rule] of resolved.spawns.entries()) {
			if (resolved.entities[rule.entity]?.kind === 'figure') {
				found.push(`"${prefix}spawns[${index}].entity" can't be a figure.`);
			}
		}
	}
	const ids =
		at === ''
			? Object.keys(resolved.entities)
			: Object.keys(isObject(json.entities) ? json.entities : {});
	for (const id of ids) {
		const entity = resolved.entities[id];
		if (entity && entity.phases.length > 0 && !(entity.kind === 'monster' && entity.boss)) {
			found.push(`"${prefix}entities.${id}.phases" only work for monsters with "boss": true.`);
		}
	}
	if (given('triggers')) {
		for (const [index, trigger] of resolved.triggers.entries()) {
			if (trigger.on !== 'key') continue;
			const path = `"${prefix}triggers[${index}].keys"`;
			if (trigger.keys.length === 0) found.push(`${path} is empty: the trigger never fires.`);
			if (trigger.keys.includes('Escape')) {
				found.push(`${path} can't contain "Escape": it always leaves the game.`);
			}
		}
	}
	return found;
}

/** The `pages` list: a pattern and a partial configuration each, checked against base + page. */
function pageProblems(pages: unknown, migrated: Json): string[] {
	if (pages === undefined) return [];
	if (!Array.isArray(pages)) return ['"pages" must be a list.'];
	return pages.flatMap((page, index) => {
		const at = `pages[${index}]`;
		if (!isObject(page)) return [`"${at}" must be an object.`];
		const found = Object.keys(page)
			.filter((key) => key !== 'match' && key !== 'config')
			.map((key) => `Unknown setting "${at}.${key}".`);
		if (typeof page.match !== 'string' || page.match.trim() === '') {
			found.push(`"${at}.match" must be a path pattern like "/blog/*".`);
		}
		if (page.config === undefined) return found;
		if (!isObject(page.config)) return [...found, `"${at}.config" must be an object.`];
		const merged = resolveConfig(mergeConfig(withoutPages(migrated), withoutPages(page.config)));
		return [
			...found,
			...problems(PAGE_CONFIG, page.config, merged, `${at}.config`),
			...semanticProblems(page.config, merged, `${at}.config`)
		];
	});
}

/**
 * What `resolveConfig` would change or ignore in the JSON, as readable messages (for editors).
 * Empty when the JSON is fine as it is.
 */
export function configProblems(json: unknown): string[] {
	if (!isObject(json)) return ['The configuration must be a JSON object.'];
	const migrated = migrate(json);
	if (!isObject(migrated)) return [];
	const resolved = resolveConfig(migrated);
	return [
		...problems(PLAY_SCHEMA, withoutPages(migrated), resolved),
		...semanticProblems(migrated, resolved, ''),
		...pageProblems(migrated.pages, migrated)
	];
}

/** The configuration as JSON Schema, for editors' autocompletion and validation. */
export function playJsonSchema(): Record<string, unknown> {
	return {
		$schema: 'https://json-schema.org/draft/2020-12/schema',
		$id: 'https://github.com/oldjazjef/hello-eme-play/blob/main/packages/schema/play.schema.json',
		...toJsonSchema(PLAY_SCHEMA)
	};
}
