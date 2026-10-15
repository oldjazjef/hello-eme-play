/**
 * @hello-eme/play: turns any website into a game. See README.md.
 *
 * ```ts
 * import { createPlay } from '@hello-eme/play';
 * const play = createPlay({ config: await (await fetch('/play.json')).json() });
 * play.start();
 * ```
 */
export { createPlay, type Play, type PlayOptions, type PlayState } from './play.js';
export {
	configProblems,
	DEFAULT_CONFIG,
	migrate,
	resolveConfig,
	SCHEMA_VERSION,
	type PlayConfig
} from '@hello-eme/play-schema';
