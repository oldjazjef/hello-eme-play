import { createWorld, type World } from '@hello-eme/play-core';
import { migrate, resolveConfig, type PlayConfig } from '@hello-eme/play-schema';

export type PlayState = 'off' | 'playing';

export interface PlayOptions {
	/** The JSON configuration (any shape: it is migrated and corrected). */
	config?: unknown;
	/** Same seed, same game (for tests); default random. */
	seed?: number;
}

export interface Play {
	readonly state: PlayState;
	readonly config: PlayConfig;
	/** The game world while playing; undefined when off. */
	readonly world: World | undefined;
	start(): void;
	stop(): void;
	destroy(): void;
}

/**
 * Creates the game for a page. The skeleton only holds the world; input, the renderer, the
 * perspectives and the page adapter arrive with the milestones in docs/PLAN.md.
 */
export function createPlay(options: PlayOptions = {}): Play {
	const config = resolveConfig(migrate(options.config));
	let state: PlayState = 'off';
	let world: World | undefined;
	return {
		get state() {
			return state;
		},
		get world() {
			return world;
		},
		config,
		start() {
			if (state === 'playing') return;
			state = 'playing';
			world = createWorld(config, { seed: options.seed });
		},
		stop() {
			state = 'off';
			world = undefined;
		},
		destroy() {
			this.stop();
		}
	};
}
