/**
 * @hello-eme/play-schema: the JSON configuration of @hello-eme/play (types, schema tree,
 * validation, defaults, presets and migrations). No DOM.
 */
export * from './dsl.js';
export { configProblems, DEFAULT_CONFIG, playJsonSchema, resolveConfig } from './config.js';
export { fromPageGame, isLegacy, migrate } from './migrate.js';
export { PRESETS, type Preset } from './presets.js';
export { ACTION, CONDITION, PLAY_SCHEMA } from './schema.js';
export * from './texts.js';
export * from './types.js';
export { SCHEMA_VERSION } from './version.js';
