import { isObject, resolve } from './dsl.js';
import { PLAY_SCHEMA } from './schema.js';
import { SCHEMA_VERSION } from './version.js';

type Json = Record<string, unknown>;

/** Top-level settings only the old `@hello-eme/page-game` JSON had. */
const LEGACY_KEYS = ['health', 'kick', 'car', 'enemies', 'score'] as const;

const object = (value: unknown): Json => (isObject(value) ? value : {});

/** Whether this is a `@hello-eme/page-game` JSON (it has no `version`). */
export function isLegacy(json: Json): boolean {
	if (json.version !== undefined || 'entities' in json) return false;
	return LEGACY_KEYS.some((key) => key in json);
}

/** Sets `target[key] = value` when the value is defined. */
function put(target: Json, key: string, value: unknown): void {
	if (value !== undefined) target[key] = value;
}

/**
 * Turns an old page-game JSON into the current format: the enemy becomes the entity `blob`, the
 * figure `hero`, the car `car`; waves become a spawn rule. Starts from the complete defaults, so
 * everything the old JSON didn't mention behaves like the old game.
 */
export function fromPageGame(json: Json): Json {
	const next = resolve(PLAY_SCHEMA, {}) as Json;
	const entities = object(next.entities);
	const hero = object(entities.hero);
	const blob = object(entities.blob);
	const car = object(entities.car);
	const moves = object(next.moves);
	const game = object(next.game);
	const visits = object(next.visits);
	const keys = object(next.keys);

	put(next, 'enabled', json.enabled);
	put(next, 'locale', json.locale);
	if (json.texts !== undefined) next.texts = { ...object(next.texts), ...object(json.texts) };
	put(next, 'hint', json.hint);

	if (typeof json.health === 'number') hero.stats = { ...object(hero.stats), hp: json.health };
	if (json.kick === false) hero.moves = ['punch'];

	const sourceKeys = object(json.keys);
	for (const action of ['jump', 'drift', 'honk', 'use'] as const)
		put(keys, action, sourceKeys[action]);
	put(object(moves.punch), 'keys', sourceKeys.punch);
	put(object(moves.kick), 'keys', sourceKeys.kick);

	const enemies = object(json.enemies);
	const stats = object(blob.stats);
	put(stats, 'speed', enemies.speed);
	put(stats, 'hp', enemies.health);
	put(stats, 'attack', enemies.damage);
	blob.stats = stats;
	if (enemies.overrun === false) game.overrunSpeed = 5000;

	const score = object(json.score);
	if (typeof score.enemy === 'number')
		blob.reward = { ...object(blob.reward), points: score.enemy };
	put(game, 'breakPoints', score.broken);

	next.spawns =
		enemies.enabled === false
			? []
			: [
					{
						entity: 'blob',
						every: enemies.delay ?? { min: 12, max: 30 },
						count: enemies.count ?? { min: 1, max: 3 },
						max: enemies.max ?? 8
					}
				];

	const carSettings = object(json.car);
	const visitSettings = object(json.visits);
	visits.enabled = visitSettings.enabled !== false && json.enabled !== false;
	put(visits, 'delay', visitSettings.delay);
	visits.whilePlaying = carSettings.enabled !== false;
	put(visits, 'playDelay', carSettings.delay);

	// Own pictures by kind become the picture library, referenced by hero, blob and car.
	const sprites: Json = {};
	const kinds = { figure: hero, enemy: blob, car } as const;
	for (const [kind, entity] of Object.entries(kinds)) {
		const raw = object(json.sprites)[kind];
		const picture = typeof raw === 'string' ? { url: raw } : object(raw);
		if (typeof picture.url === 'string' && picture.url.trim() !== '') {
			sprites[kind] = picture;
			entity.sprite = kind;
			if (typeof picture.size === 'number') entity.size = picture.size;
		}
	}
	next.sprites = sprites;
	return next;
}

/**
 * Brings a JSON written for an older schema version (or for `@hello-eme/page-game`) up to date.
 * Add a step here whenever `SCHEMA_VERSION` goes up; never change an old step.
 */
export function migrate(json: unknown): unknown {
	if (!isObject(json)) return json;
	if (isLegacy(json)) return { ...fromPageGame(json), version: SCHEMA_VERSION };
	return json;
}
