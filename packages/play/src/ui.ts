/**
 * The game's on-screen parts, as plain DOM: the canvas, the touch controls, the score and health
 * bar, the hint at the bottom (which folds into a tab at the left edge), the upgrade shop and
 * messages. `render` updates them from the game's current `View`; buttons call back into the game
 * through `UiActions`.
 */
import type { GameTexts } from '@hello-eme/play-schema';
import { icon, type IconName } from './icons.js';
import { fill } from './texts.js';

/** What the hint shows (and which touch buttons there are). */
export type Phase = 'visit' | 'foot' | 'near' | 'driving';

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface UpgradeRow {
	id: string;
	label: string;
	help: string;
	level: number;
	max: number;
	/** Price of the next level; undefined when everything is bought. */
	price: number | undefined;
	canBuy: boolean;
}

export interface View {
	phase: Phase;
	/** Side view: other hint, up jumps. */
	side: boolean;
	/** Broken page elements. */
	broken: number;
	hintHidden: boolean;
	/** Score and health bar. */
	hud: boolean;
	score: number;
	health: number;
	maxHealth: number;
	over: 'none' | 'over' | 'won';
	level: number;
	/** Number of levels (0: endless). */
	levels: number;
	best: number;
	boss: { name: string; hp: number; max: number } | undefined;
	/** Touch buttons for the figure's moves. */
	moves: { id: string; label: string }[];
	upgrades: UpgradeRow[];
	shopOpen: boolean;
	stats: { label: string; value: string }[];
}

export interface UiActions {
	/** Lets go of all pad buttons (they are rebuilt, so a held one never reports its release). */
	releasePad(): void;
	press(direction: Direction): void;
	release(direction: Direction): void;
	/** Get in or out of the car. */
	use(): void;
	jump(): void;
	move(id: string, held: boolean): void;
	handbrake(held: boolean): void;
	/** The steering wheel, -1 (full left) to 1 (full right); 0 when let go. */
	steer(value: number): void;
	/** The pedals: -1 gas, 1 brake and reverse, 0 none. */
	pedal(value: -1 | 0 | 1): void;
	play(): void;
	dismiss(): void;
	repair(): void;
	hideHint(hidden: boolean): void;
	restart(): void;
	exit(): void;
	toggleShop(): void;
	buy(id: string): void;
}

const PAD: readonly { direction: Direction; icon: IconName; column: number; row: number }[] = [
	{ direction: 'up', icon: 'up', column: 2, row: 1 },
	{ direction: 'left', icon: 'left', column: 1, row: 2 },
	{ direction: 'right', icon: 'right', column: 3, row: 2 },
	{ direction: 'down', icon: 'down', column: 2, row: 3 }
];

/** Marks the game's own UI: the figure never clicks or breaks it. */
const UI_ATTRIBUTE = 'data-play-ui';

function element<K extends keyof HTMLElementTagNameMap>(
	tag: K,
	className: string,
	...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
	const node = document.createElement(tag);
	node.className = className;
	node.append(...children);
	return node;
}

function button(className: string, label: string | Node, onclick?: () => void): HTMLButtonElement {
	const node = element('button', className, label);
	node.type = 'button';
	if (onclick) node.addEventListener('click', onclick);
	return node;
}

function iconButton(name: IconName, label: string, onclick: () => void): HTMLButtonElement {
	const node = button('play-icon-button', icon(name, 'play-small-icon'), onclick);
	node.setAttribute('aria-label', label);
	return node;
}

/** Called while a button is held down (touch), and again with `false` when let go. */
function holdable(node: HTMLElement, hold: (held: boolean) => void): void {
	node.addEventListener('pointerdown', () => hold(true));
	for (const event of ['pointerup', 'pointerleave', 'pointercancel'] as const) {
		node.addEventListener(event, () => hold(false));
	}
	node.addEventListener('contextmenu', (event) => event.preventDefault());
}

/** Degrees the wheel turns at full steering, and the share of its width that counts as straight. */
const WHEEL_TURN = 100;
const WHEEL_DEAD_ZONE = 0.12;

/** A steering wheel to turn by dragging; reports -1..1 (a small dead zone in the middle). */
function steeringWheel(label: string, steer: (value: number) => void): HTMLElement {
	const wheel = element('div', 'play-wheel', element('span', 'play-wheel-hub'));
	wheel.setAttribute('role', 'slider');
	wheel.setAttribute('tabindex', '0');
	wheel.setAttribute('aria-label', label);
	wheel.setAttribute('aria-valuemin', '-100');
	wheel.setAttribute('aria-valuemax', '100');
	wheel.setAttribute('aria-valuenow', '0');
	let active: number | undefined;
	const set = (value: number) => {
		wheel.style.transform = `rotate(${value * WHEEL_TURN}deg)`;
		wheel.setAttribute('aria-valuenow', String(Math.round(value * 100)));
		steer(value);
	};
	const follow = (event: PointerEvent) => {
		const box = wheel.getBoundingClientRect();
		// The wheel is rotated, but its box stays about the same size; the center is what counts.
		const offset = (event.clientX - (box.left + box.width / 2)) / (box.width / 2);
		const value = Math.max(-1, Math.min(1, offset));
		set(Math.abs(value) < WHEEL_DEAD_ZONE ? 0 : value);
	};
	const release = (event: PointerEvent) => {
		if (event.pointerId !== active) return;
		active = undefined;
		set(0);
	};
	wheel.addEventListener('pointerdown', (event) => {
		active = event.pointerId;
		wheel.setPointerCapture(event.pointerId);
		follow(event);
	});
	wheel.addEventListener('pointermove', (event) => {
		if (event.pointerId === active) follow(event);
	});
	wheel.addEventListener('pointerup', release);
	wheel.addEventListener('pointercancel', release);
	wheel.addEventListener('contextmenu', (event) => event.preventDefault());
	return wheel;
}

export class GameUi {
	readonly canvas = element('canvas', 'play-canvas');
	/** Reads CSS colors for the canvas (see `resolveColors`). */
	readonly probe = element('span', 'play-probe');
	readonly #dock = element('div', 'play-dock');
	readonly #toast = element('div', 'play-toast');
	readonly #boss = element('div', 'play-boss');
	#pad: HTMLElement | undefined;
	#hud: HTMLElement | undefined;
	#hint: HTMLElement | undefined;
	#shop: HTMLElement | undefined;
	#texts: GameTexts;
	readonly #actions: UiActions;
	/** What the hint and pad were last built for; they are rebuilt only when this changes. */
	#built = '';
	#view: View | undefined;
	#toastTimer: ReturnType<typeof setTimeout> | undefined;

	constructor(texts: GameTexts, actions: UiActions) {
		this.#texts = texts;
		this.#actions = actions;
		this.canvas.setAttribute('aria-hidden', 'true');
		this.probe.setAttribute('aria-hidden', 'true');
		this.#toast.hidden = true;
		this.#toast.setAttribute('role', 'status');
		this.#toast.setAttribute(UI_ATTRIBUTE, '');
		this.#boss.hidden = true;
		this.#boss.setAttribute(UI_ATTRIBUTE, '');
		document.body.append(this.canvas, this.probe, this.#boss, this.#toast, this.#dock);
	}

	set texts(texts: GameTexts) {
		this.#texts = texts;
		this.#built = '';
		if (this.#view) this.render(this.#view);
	}

	/** Bottom parts the figure should stay above (touch controls, score, hint). */
	get bottomParts(): HTMLElement[] {
		return [
			this.#pad,
			this.#hud,
			this.#view?.hintHidden ? undefined : this.#hint,
			this.#shop
		].filter((part): part is HTMLElement => part !== undefined);
	}

	/** Shows a short message at the top for a few seconds. */
	toast(text: string): void {
		this.#toast.textContent = text;
		this.#toast.hidden = false;
		clearTimeout(this.#toastTimer);
		this.#toastTimer = setTimeout(() => (this.#toast.hidden = true), 2800);
	}

	render(view: View): void {
		this.#view = view;
		const key = [
			view.phase,
			view.side,
			view.hintHidden,
			view.over,
			view.broken > 0,
			view.hud,
			view.levels > 0,
			view.moves.map((move) => move.id).join('+'),
			view.upgrades.length > 0,
			view.shopOpen,
			view.shopOpen ? view.upgrades.map((row) => `${row.level}${row.canBuy}`).join('') : ''
		].join();
		if (key !== this.#built) {
			this.#built = key;
			this.#build(view);
		}
		this.#update(view);
	}

	remove(): void {
		clearTimeout(this.#toastTimer);
		this.canvas.remove();
		this.probe.remove();
		this.#boss.remove();
		this.#toast.remove();
		this.#dock.remove();
	}

	#build(view: View): void {
		const t = this.#texts;
		const a = this.#actions;
		// Controls that disappear while held would otherwise stay "pressed".
		a.steer(0);
		a.pedal(0);
		a.releasePad();
		const lobby = view.phase === 'visit';
		const over = view.over !== 'none';
		this.#pad = lobby || over || view.shopOpen ? undefined : this.#buildPad(view);
		this.#hud = view.hud && !lobby ? this.#buildHud(view) : undefined;
		this.#shop = view.shopOpen && !over ? this.#buildShop(view) : undefined;
		const parts: HTMLElement[] = [];
		if (this.#shop) parts.push(this.#shop);
		if (this.#pad) parts.push(this.#pad);
		if (this.#hud) parts.push(this.#hud);

		if (view.hintHidden && !lobby && !over) {
			// Folded away into a tab at the left edge; the count of broken elements stays.
			const tab = button('play-tab', icon('panelOpen'), () => a.hideHint(false));
			tab.setAttribute('aria-label', t.showHint);
			tab.setAttribute('aria-expanded', 'false');
			tab.setAttribute(UI_ATTRIBUTE, '');
			tab.append(element('span', 'play-count'));
			this.#hint = tab;
		} else {
			this.#hint = this.#buildHint(view);
		}
		parts.push(this.#hint);
		this.#dock.replaceChildren(...parts);
		// Game over: "Play again" is one Enter away.
		if (over) this.#hint.querySelector<HTMLElement>('.play-button')?.focus();
		if (view.shopOpen) this.#shop?.querySelector<HTMLElement>('button')?.focus();
	}

	#buildPad(view: View): HTMLElement {
		const t = this.#texts;
		const a = this.#actions;
		const actions = element('div', 'play-actions');
		let steering: HTMLElement;
		if (view.phase === 'driving') {
			steering = steeringWheel(t.steering, a.steer);
			const round = (name: IconName, label: string, className = 'play-pad-button') => {
				const node = button(className, icon(name));
				node.setAttribute('aria-label', label);
				return node;
			};
			const brake = round('brake', t.brake);
			const gas = round('gas', t.gas, 'play-pad-button play-gas');
			const drift = round('drift', t.drift);
			holdable(brake, (held) => a.pedal(held ? 1 : 0));
			holdable(gas, (held) => a.pedal(held ? -1 : 0));
			holdable(drift, a.handbrake);
			const getOut = round('exit', t.getOut);
			getOut.addEventListener('click', a.use);
			const honk = round('honk', t.honk);
			honk.addEventListener('click', a.jump);
			actions.append(
				element('div', 'play-cluster', getOut, honk, drift),
				element('div', 'play-cluster', brake, gas)
			);
		} else {
			steering = element('div', 'play-dpad');
			for (const { direction, icon: name, column, row } of PAD) {
				const node = button('play-pad-button', icon(name));
				node.setAttribute('aria-label', direction === 'up' && view.side ? t.jump : t[direction]);
				node.style.gridArea = `${row} / ${column}`;
				holdable(node, (held) => (held ? a.press(direction) : a.release(direction)));
				steering.append(node);
			}
			if (view.phase === 'near') actions.append(button('play-pill', t.getIn, a.use));
			for (const move of view.moves) {
				const pill = button('play-pill play-hold', move.label);
				holdable(pill, (held) => a.move(move.id, held));
				actions.append(pill);
			}
			if (!view.side) actions.append(button('play-button play-large play-hold', t.jump, a.jump));
		}
		const pad = element('div', 'play-pad', steering, actions);
		pad.setAttribute('role', 'group');
		pad.setAttribute('aria-label', t.controls);
		pad.setAttribute(UI_ATTRIBUTE, '');
		return pad;
	}

	#buildHud(view: View): HTMLElement {
		const bar = element('div', 'play-health', element('span', ''));
		bar.setAttribute('role', 'meter');
		bar.setAttribute('aria-label', this.#texts.health);
		bar.setAttribute('aria-valuemin', '0');
		const hud = element(
			'div',
			'play-panel play-hud',
			bar,
			element('span', 'play-score'),
			...(view.levels > 0 ? [element('span', 'play-level')] : [])
		);
		if (view.upgrades.length > 0) {
			hud.append(button('play-outline', this.#texts.shop, this.#actions.toggleShop));
		}
		hud.setAttribute(UI_ATTRIBUTE, '');
		return hud;
	}

	#buildShop(view: View): HTMLElement {
		const t = this.#texts;
		const list = element('ul', '');
		for (const row of view.upgrades) {
			const price = row.price;
			const buy = button('play-button', price === undefined ? t.bought : t.buy, () =>
				this.#actions.buy(row.id)
			);
			buy.disabled = !row.canBuy;
			const info = element(
				'div',
				'',
				element('strong', '', `${row.label} ${row.level}/${row.max}`),
				element(
					'small',
					'',
					[row.help, price === undefined ? '' : fill(t.cost, { points: price })]
						.filter(Boolean)
						.join(' · ')
				)
			);
			list.append(element('li', '', info, buy));
		}
		const stats = element('dl', 'play-stats');
		for (const stat of view.stats) {
			stats.append(element('dt', '', stat.label), element('dd', '', stat.value));
		}
		const shop = element(
			'div',
			'play-panel play-shop',
			element('h2', '', t.shop),
			stats,
			list,
			button('play-outline', t.shopClose, this.#actions.toggleShop)
		);
		shop.setAttribute('role', 'dialog');
		shop.setAttribute('aria-label', t.shop);
		shop.setAttribute(UI_ATTRIBUTE, '');
		return shop;
	}

	#buildHint(view: View): HTMLElement {
		const t = this.#texts;
		const a = this.#actions;
		const hint = element('div', 'play-panel play-hint');
		hint.setAttribute('role', 'status');
		hint.setAttribute(UI_ATTRIBUTE, '');

		if (view.phase === 'visit') {
			hint.append(
				element('p', '', t.visitNotice),
				button('play-button', t.getIn, a.play),
				iconButton('close', t.dismiss, a.dismiss)
			);
			return hint;
		}
		if (view.over !== 'none') {
			hint.append(
				element('p', 'play-over'),
				button('play-button', t.restart, a.restart),
				iconButton('close', t.exit, a.exit)
			);
			return hint;
		}
		if (view.phase === 'driving') {
			hint.append(element('p', 'play-fine', t.driveHint));
			hint.append(element('p', 'play-coarse', t.touchDriveHint));
		} else if (view.phase === 'near') {
			hint.append(element('p', '', t.nearHint));
		} else {
			hint.append(element('p', 'play-fine', view.side ? t.sideHint : t.keyboardHint));
			hint.append(element('p', 'play-coarse', t.touchHint));
		}
		if (view.broken > 0) {
			hint.append(
				element(
					'div',
					'play-row',
					element('strong', 'play-count'),
					button('play-outline', t.repair, a.repair)
				)
			);
		}
		const hide = iconButton('panelClose', t.hideHint, () => a.hideHint(true));
		hide.setAttribute('aria-expanded', 'true');
		hint.append(element('div', 'play-row', hide, iconButton('close', t.exit, a.exit)));
		return hint;
	}

	/** Numbers that change often, updated in place (no rebuild, so focus stays). */
	#update(view: View): void {
		const t = this.#texts;
		for (const count of this.#dock.querySelectorAll('.play-count')) {
			const text = this.#hint?.matches('.play-tab')
				? view.broken > 0
					? String(view.broken)
					: ''
				: fill(t.wrecked, { count: view.broken });
			if (count.textContent !== text) count.textContent = text;
		}
		const over = this.#dock.querySelector('.play-over');
		if (over) {
			const text = [
				fill(view.over === 'won' ? t.victory : t.gameOver, { score: view.score }),
				view.best > 0 ? fill(t.highScore, { score: view.best }) : ''
			]
				.filter(Boolean)
				.join(' ');
			if (over.textContent !== text) over.textContent = text;
		}
		this.#updateBoss(view);
		if (!this.#hud) return;
		const set = (selector: string, text: string) => {
			const node = this.#hud?.querySelector(selector);
			if (node && node.textContent !== text) node.textContent = text;
		};
		set('.play-score', fill(t.score, { score: view.score }));
		set('.play-level', fill(t.level, { level: view.level }));
		const bar = this.#hud.querySelector<HTMLElement>('.play-health');
		const fillBar = bar?.querySelector<HTMLElement>('span');
		if (!bar || !fillBar) return;
		const health = Math.max(0, Math.round(view.health));
		bar.setAttribute('aria-valuemax', String(view.maxHealth));
		bar.setAttribute('aria-valuenow', String(health));
		bar.toggleAttribute('data-low', health <= view.maxHealth * 0.3);
		fillBar.style.width = `${(health / Math.max(1, view.maxHealth)) * 100}%`;
	}

	#updateBoss(view: View): void {
		const boss = view.boss;
		this.#boss.hidden = !boss;
		if (!boss) return;
		if (!this.#boss.firstChild) {
			this.#boss.append(
				element('span', 'play-boss-name'),
				element('div', 'play-health', element('span', ''))
			);
		}
		const name = this.#boss.querySelector('.play-boss-name');
		if (name && name.textContent !== boss.name) name.textContent = boss.name;
		const fillBar = this.#boss.querySelector<HTMLElement>('.play-health > span');
		if (fillBar) fillBar.style.width = `${(Math.max(0, boss.hp) / Math.max(1, boss.max)) * 100}%`;
	}
}
