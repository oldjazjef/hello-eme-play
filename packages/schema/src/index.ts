/**
 * @hello-eme/play-schema: the JSON configuration of @hello-eme/play (types, schema tree,
 * validation, defaults, presets and migrations). No DOM.
 */
export * from './dsl.js';
export {
	configProblems,
	DEFAULT_CONFIG,
	playJsonSchema,
	resolveConfig,
	resolveConfigFor
} from './config.js';
export { matchPath, mergeConfig, pageConfigFor } from './pages.js';
export { fromPageGame, isLegacy, migrate } from './migrate.js';
export { PRESETS, type Preset } from './presets.js';
export {
	buildReference,
	referenceMarkdown,
	type RefKey,
	type RefLang,
	type RefRow,
	type RefSection,
	type RefVariant,
	type Reference
} from './reference.js';
export { ACTION, CONDITION, PLAY_SCHEMA } from './schema.js';
export * from './texts.js';
export * from './types.js';
export { SCHEMA_VERSION } from './version.js';
