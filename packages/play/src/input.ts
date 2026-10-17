/** Keyboard and touch input → the world's controls. */
import type { Controls } from '@hello-eme/play-core';
import type { PlayConfig } from '@hello-eme/play-schema';
import { isEditable } from './target.js';

export type Direction = 'up' | 'down' | 'left' | 'right';

/** What a key press asks the game to do beyond steering. */
export interface InputHooks {
	config(): PlayConfig;
	/** Whether the visitor plays (keys belong to the page otherwise). */
	active(): boolean;
	riding(): boolean;
	/** Esc: get out of the vehicle, close the shop, or end the game. */
	escape(): void;
	toggleShop(): void;
	/** The key that shows or hides the instructions. */
	toggleHint(): void;
	/** Any other key press (once per press, not for held-down repeats): `key` triggers listen. */
	key(code: string): void;
}

/** Whether the event happened on a button of the game itself (restart, repair …). */
const inGameUi = (event: KeyboardEvent) =>
	event.target instanceof Element && event.target.closest('[data-play-ui]') !== null;

/**
 * Holds what keys and touch buttons currently ask for. Read once per frame by `apply`, so it is
 * deliberately plain (not reactive) state.
 */
export class Input {
	readonly #held = new Map<string, Direction>();
	readonly #moves = new Map<string, Set<string>>();
	/** Moves pressed since the last frame, so a tap that ends within one frame still counts. */
	readonly #tapped = new Set<string>();
	readonly #pressed = new Set<'jump' | 'honk' | 'use' | 'party'>();
	/** Throwables asked for since the last frame (a key or a touch button). */
	readonly #throws = new Set<string>();
	/** Throwables whose key is held down and keeps firing, by key code. */
	readonly #autoThrows = new Map<string, string>();
	readonly #hooks: InputHooks;
	/** Touch driving controls: the wheel (-1..1) and the pedals (-1 gas, 1 brake). */
	wheel = 0;
	pedal = 0;
	readonly handbrake = { key: false, pad: false };

	constructor(hooks: InputHooks) {
		this.#hooks = hooks;
	}

	press(source: string, direction: Direction): void {
		this.#held.set(source, direction);
	}

	release(source: string): void {
		this.#held.delete(source);
	}

	/** A move button held (touch) or released. */
	holdMove(source: string, move: string, held: boolean): void {
		const sources = this.#moves.get(move) ?? new Set<string>();
		if (held) {
			sources.add(source);
			this.#tapped.add(move);
		} else sources.delete(source);
		this.#moves.set(move, sources);
	}

	request(action: 'jump' | 'honk' | 'use' | 'party'): void {
		this.#pressed.add(action);
	}

	/** A throwable that keeps firing while its touch button is held. */
	holdThrow(id: string, held: boolean): void {
		if (held) this.#autoThrows.set(`pad-${id}`, id);
		else this.#autoThrows.delete(`pad-${id}`);
	}

	/** Throw or drop one (an id of `config.throwables`). */
	throwItem(id: string): void {
		this.#throws.add(id);
	}

	/** Lets go of everything the on-screen pad holds (its buttons were replaced, no release will come). */
	releasePad(): void {
		for (const source of [...this.#held.keys()])
			if (source.startsWith('pad-')) this.#held.delete(source);
		for (const sources of this.#moves.values()) sources.delete('pad');
		this.handbrake.pad = false;
	}

	clear(): void {
		this.#autoThrows.clear();
		this.#held.clear();
		this.#moves.clear();
		this.#tapped.clear();
		this.#pressed.clear();
		this.#throws.clear();
		this.handbrake.key = this.handbrake.pad = false;
		this.wheel = this.pedal = 0;
	}

	/** Opposite directions cancel out. */
	axis(): { x: number; y: number } {
		const directions = new Set(this.#held.values());
		return {
			x: (directions.has('right') ? 1 : 0) - (directions.has('left') ? 1 : 0),
			y: (directions.has('down') ? 1 : 0) - (directions.has('up') ? 1 : 0)
		};
	}

	/** Copies the current state into the world's controls (once per frame). */
	apply(controls: Controls, riding: boolean): void {
		const held = this.axis();
		controls.axis.x = held.x || (riding ? this.wheel : 0);
		controls.axis.y = held.y || (riding ? this.pedal : 0);
		controls.drift = riding && (this.handbrake.key || this.handbrake.pad);
		controls.held.clear();
		for (const [move, sources] of this.#moves) if (sources.size > 0) controls.held.add(move);
		for (const move of this.#tapped) controls.held.add(move);
		this.#tapped.clear();
		for (const action of this.#pressed) controls.pressed.add(action);
		this.#pressed.clear();
		for (const id of this.#throws) controls.throws.add(id);
		this.#throws.clear();
		for (const id of this.#autoThrows.values()) controls.throws.add(id);
	}

	readonly keydown = (event: KeyboardEvent): void => {
		const hooks = this.#hooks;
		// Keys belong to the page unless the visitor plays.
		if (!hooks.active()) return;
		if (event.key === 'Escape') {
			hooks.escape();
			return;
		}
		if (event.ctrlKey || event.metaKey || event.altKey || isEditable(event.target)) return;
		// Reported on top of what the game does with the key, so a trigger can hook onto any key.
		if (!event.repeat && !inGameUi(event)) hooks.key(event.code);
		const config = hooks.config();
		const keys = config.keys;
		const riding = hooks.riding();
		const direction = (['up', 'down', 'left', 'right'] as const).find((name) =>
			keys[name].includes(event.code)
		);
		if (direction) {
			this.press(event.code, direction);
			event.preventDefault();
			return;
		}
		if (keys.use.includes(event.code)) {
			event.preventDefault();
			if (!event.repeat) this.request('use');
			return;
		}
		if (keys.party.includes(event.code) && !inGameUi(event)) {
			event.preventDefault();
			if (!event.repeat) this.request('party');
			return;
		}
		if (keys.hint.includes(event.code) && !inGameUi(event)) {
			event.preventDefault();
			if (!event.repeat) hooks.toggleHint();
			return;
		}
		if (keys.shop.includes(event.code) && !inGameUi(event)) {
			event.preventDefault();
			if (!event.repeat) hooks.toggleShop();
			return;
		}
		const thrown = Object.entries(config.throwables).find(
			([, throwable]) =>
				throwable.keys.includes(event.code) &&
				(throwable.where === 'both' || (throwable.where === 'vehicle') === riding)
		);
		if (thrown) {
			if (inGameUi(event)) return;
			event.preventDefault();
			if (thrown[1].auto) this.#autoThrows.set(event.code, thrown[0]);
			else if (!event.repeat) this.throwItem(thrown[0]);
			return;
		}
		if (riding && keys.drift.includes(event.code)) {
			event.preventDefault();
			this.handbrake.key = true;
			return;
		}
		// On foot: the figure's moves; Enter/space would otherwise also activate a focused button.
		const player = config.entities[config.game.player];
		const move = riding
			? undefined
			: player?.moves.find((id) => config.moves[id]?.keys.includes(event.code));
		if (move) {
			if (inGameUi(event)) return;
			event.preventDefault();
			this.holdMove(`key-${event.code}`, move, true);
			return;
		}
		if (riding && keys.honk.includes(event.code)) {
			if (inGameUi(event)) return;
			event.preventDefault();
			if (!event.repeat) this.request('honk');
		} else if (!riding && keys.jump.includes(event.code)) {
			if (inGameUi(event)) return;
			event.preventDefault();
			if (!event.repeat) this.request('jump');
		}
	};

	readonly keyup = (event: KeyboardEvent): void => {
		this.release(event.code);
		this.#autoThrows.delete(event.code);
		const config = this.#hooks.config();
		if (config.keys.drift.includes(event.code)) this.handbrake.key = false;
		for (const [move, sources] of this.#moves) {
			if (sources.delete(`key-${event.code}`) && sources.size === 0) this.#moves.delete(move);
		}
		if (
			this.#hooks.active() &&
			event.code === 'Space' &&
			!isEditable(event.target) &&
			!inGameUi(event)
		) {
			event.preventDefault();
		}
	};

	/** Held keys are forgotten when the window loses focus (no key-up arrives). */
	readonly blur = (): void => this.clear();
}
