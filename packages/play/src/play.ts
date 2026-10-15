/**
 * The game for a page. `createPlay` returns a controller; the visitor starts it with a toggle
 * (the page's own, or the floating one), or a vehicle drives in by itself and offers a ride.
 * Everything else lives in the `Session` while the game is not `off`.
 */
import type { World } from '@hello-eme/play-core';
import { resolveConfig, type PlayConfig } from '@hello-eme/play-schema';
import { icon } from './icons.js';
import { Session, type GameEvent, type GameState, type SessionHooks } from './session.js';
import { type EventData, type PlaySource } from './stats.js';
import { addStyles } from './styles.js';
import { textsFor } from './texts.js';

export type { GameEvent, GameState } from './session.js';

export interface PlayOptions {
	/** The JSON configuration, any shape (missing values get defaults, old formats are migrated). */
	config?: unknown;
	/** Statistics hook: called for every `GameEvent`. Never gets personal data. */
	onEvent?: (event: GameEvent, data?: EventData) => void;
	/** Called whenever the state changes (e.g. to show a "pressed" toggle). */
	onStateChange?: (state: GameState) => void;
	/** Adds a floating start button (bottom right). Off when the website has its own toggle. */
	toggleButton?: boolean;
	/** The sticky header the figure can walk into (default `header`). */
	header?: string;
	/** Adds the game's stylesheet (default true). */
	styles?: boolean;
}

export interface Play {
	readonly state: GameState;
	readonly config: PlayConfig;
	/** The world being played (undefined while off). */
	readonly world: World | undefined;
	/** Start playing; while a vehicle is visiting, the figure starts inside it. */
	start(): void;
	stop(): void;
	toggle(): void;
	/** A vehicle drives in by itself (only when nobody plays). */
	visit(): void;
	/** A new configuration (texts, pictures and sounds apply at once, the rest in the next round). */
	configure(config: unknown): void;
	/** The website showed another page without reloading: repairs it. */
	pageChanged(): void;
	/** Removes everything (the game, its toggle, its listeners). */
	destroy(): void;
}

const VISITED_KEY = 'play-visited';

/** `sessionStorage`, or null where reading it throws (blocked site data). */
function sessionStorageOrNull(): Storage | null {
	try {
		return sessionStorage;
	} catch {
		return null;
	}
}

export function createPlay(options: PlayOptions = {}): Play {
	let config = resolveConfig(options.config);
	let state: GameState = 'off';
	let source: PlaySource = 'toggle';
	let session: Session | undefined;
	let cancelVisit = () => {};
	let toggleButton: HTMLButtonElement | undefined;

	if (options.styles !== false) addStyles();

	const emit = (event: GameEvent, data?: EventData) => {
		try {
			options.onEvent?.(event, data);
		} catch {
			// Statistics must never break the game.
		}
	};

	const syncToggle = () => {
		if (!toggleButton) return;
		toggleButton.setAttribute('aria-pressed', String(state === 'playing'));
		toggleButton.hidden = !config.enabled || state !== 'off';
	};

	const setState = (next: GameState) => {
		if (next === state) return;
		state = next;
		if (state === 'off') {
			session?.destroy();
			session = undefined;
		} else {
			session ??= new Session(hooks);
		}
		syncToggle();
		options.onStateChange?.(state);
	};

	const hooks: SessionHooks = {
		get config() {
			return config;
		},
		get state() {
			return state;
		},
		get source() {
			return source;
		},
		header: options.header ?? 'header',
		emit,
		ended: () => setState('off'),
		stop: () => controller.stop(),
		play: () => controller.start()
	};

	const scheduleVisits = () => {
		cancelVisit();
		cancelVisit = () => {};
		const { visits, enabled } = config;
		const store = sessionStorageOrNull();
		const seen = (() => {
			try {
				return store?.getItem(VISITED_KEY) === '1';
			} catch {
				return false;
			}
		})();
		// Never with reduced motion: something moving by itself is exactly what that setting avoids.
		if (
			!enabled ||
			!visits.enabled ||
			seen ||
			matchMedia('(prefers-reduced-motion: reduce)').matches
		)
			return;
		const seconds = visits.delay.min + Math.random() * (visits.delay.max - visits.delay.min);
		const timer = setTimeout(() => {
			try {
				store?.setItem(VISITED_KEY, '1');
			} catch {
				// Private mode or blocked storage: it may come again next page load, that's fine.
			}
			controller.visit();
		}, seconds * 1000);
		cancelVisit = () => clearTimeout(timer);
	};

	const controller: Play = {
		get state() {
			return state;
		},
		get config() {
			return config;
		},
		get world() {
			return session?.world;
		},
		start() {
			if (!config.enabled || state === 'playing') return;
			source = state === 'visiting' ? 'visit' : 'toggle';
			setState('playing');
		},
		stop() {
			setState('off');
			document.querySelector<HTMLElement>('[data-play-toggle]')?.focus();
		},
		toggle() {
			if (state === 'playing') controller.stop();
			else controller.start();
		},
		visit() {
			if (state !== 'off' || !config.enabled || !config.visits.enabled) return;
			setState('visiting');
			emit('visit');
		},
		configure(json) {
			const before = JSON.stringify(config.visits);
			config = resolveConfig(json);
			session?.configure();
			if (JSON.stringify(config.visits) !== before) scheduleVisits();
			if (!config.enabled) setState('off');
			syncToggle();
			toggleButton?.setAttribute('aria-label', textsFor(config).toggle);
		},
		pageChanged() {
			session?.pageChanged();
		},
		destroy() {
			cancelVisit();
			setState('off');
			toggleButton?.remove();
		}
	};

	if (options.toggleButton) {
		toggleButton = document.createElement('button');
		toggleButton.type = 'button';
		toggleButton.className = 'play-toggle';
		toggleButton.setAttribute('data-play-toggle', '');
		toggleButton.setAttribute('aria-pressed', 'false');
		toggleButton.setAttribute('aria-label', textsFor(config).toggle);
		toggleButton.hidden = !config.enabled;
		toggleButton.append(icon('gamepad'));
		toggleButton.addEventListener('click', () => controller.toggle());
		document.body.append(toggleButton);
	}
	scheduleVisits();
	return controller;
}
