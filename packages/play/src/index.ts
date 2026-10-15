/**
 * @hello-eme/play: turns any website into a game, configured by one JSON.
 */
export { createPlay, type Play, type PlayOptions } from './play.js';
export type { GameEvent, GameState } from './session.js';
export type { EventData, PlaySource } from './stats.js';
export { textsFor } from './texts.js';
export { addStyles, STYLES } from './styles.js';
export {
	configProblems,
	DEFAULT_CONFIG,
	PRESETS,
	resolveConfig,
	type PlayConfig
} from '@hello-eme/play-schema';
