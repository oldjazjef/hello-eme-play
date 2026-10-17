/**
 * Everything on screen while the game is not `off`: the world, the canvas loop, the input and the
 * UI. Created when the game starts (or a vehicle visits) and destroyed when it ends. This is where
 * the engine meets the page: strikes break elements, jumps and honks click, the camera scrolls.
 */
import {
	CAR,
	createWorld,
	isSkidding,
	hostile,
	rearWheels,
	sizeOf,
	victimOf,
	type Body,
	type Host,
	type World
} from '@hello-eme/play-core';
import type { PlayConfig } from '@hello-eme/play-schema';
import { createAudio, type Audio } from './audio.js';
import { Input } from './input.js';
import { createPageHost, reducedMotion } from './page.js';
import { loadBest, saveBest } from './progress.js';
import { addMarks, fresh, type SkidMark } from './skid.js';
import {
	BLAST_MS,
	drawBlast,
	drawBody,
	drawHealth,
	drawHideout,
	drawPickup,
	drawProjectile,
	drawShards,
	drawTeamRing,
	drawSkidMarks,
	loadPictures,
	monsterShardColors,
	resolveColors,
	shardColors,
	type Blast,
	type Pictures,
	type Scene,
	type SpriteColors
} from './sprite.js';
import { durationGroup, type EventData, type PlaySource } from './stats.js';
import { activate, clickTarget } from './target.js';
import { textsFor } from './texts.js';
import { GameUi, type Phase, type UpgradeRow, type View } from './ui.js';
import { burst, fly, punchTarget, Wrecker, type Shard } from './wreck.js';

/**
 * For statistics: `visit` (a vehicle drove in by itself), `visit-dismiss` (sent away), `start`
 * (`source`), `car-enter`, `level`, `view`, `pickup`, `upgrade`, `over` (`score`, `won`) and `end`
 * (round summary).
 */
export type GameEvent =
	| 'visit'
	| 'visit-dismiss'
	| 'start'
	| 'car-enter'
	| 'level'
	| 'view'
	| 'pickup'
	| 'upgrade'
	| 'over'
	| 'end';

/**
 * `off`: nothing there. `visiting`: a vehicle drives in by itself and parks; nobody plays yet.
 * `playing`: the visitor steers the figure, which can get into the vehicle.
 */
export type GameState = 'off' | 'visiting' | 'playing';

export interface SessionHooks {
	readonly config: PlayConfig;
	readonly state: GameState;
	readonly source: PlaySource;
	readonly header: string;
	emit(event: GameEvent, data?: EventData): void;
	/** The visiting vehicle drove away by itself. */
	ended(): void;
	/** The visitor ended the game. */
	stop(): void;
	/** The visitor starts playing (from the visit notice). */
	play(): void;
}

export class Session {
	readonly #hooks: SessionHooks;
	readonly #ui: GameUi;
	readonly #input: Input;
	readonly #host: Host;
	/** Punched elements; everything comes back on repair, on a page change and when the game ends. */
	readonly #wrecker = new Wrecker();
	readonly #reducedMotion = reducedMotion();
	readonly #audio: Audio;
	#world: World;
	#unsubscribe: (() => void)[] = [];
	#ctx: CanvasRenderingContext2D | null;
	#request = 0;
	#last = performance.now();
	#frames = 0;

	#phase: Phase = 'visit';
	#hintHidden = false;
	/** When the hint last changed or was opened (ms, like `now`); it folds away after a while. */
	#hintSince = 0;
	#colors: SpriteColors;
	#shards: Shard[] = [];
	#monsterShards: Shard[] = [];
	#marks: SkidMark[] = [];
	#blasts: Blast[] = [];
	/** Rear wheels in the last frame (page coordinates), where new tire marks start. */
	#wheelsBefore: { x: number; y: number }[] = [];
	#pictures: Pictures = {};
	#picturesFor = '';
	#shopOpen = false;
	#best = 0;
	#sendAway = false;
	#restart = false;
	#roundStarted = false;
	#ended = false;

	constructor(hooks: SessionHooks) {
		this.#hooks = hooks;
		this.#host = createPageHost({
			header: hooks.header,
			bottomParts: () => this.#ui.bottomParts,
			platforms: () => hooks.config.view.platforms
		});
		this.#audio = createAudio(hooks.config.audio);
		this.#input = new Input({
			config: () => hooks.config,
			active: () => hooks.state === 'playing' && this.#world.phase === 'playing',
			riding: () => this.#world.riding !== undefined,
			escape: () => this.#escape(),
			toggleShop: () => this.#toggleShop(),
			key: (code) => this.#world.press(code)
		});
		this.#ui = new GameUi(textsFor(hooks.config), {
			releasePad: () => this.#input.releasePad(),
			press: (direction) => this.#input.press(`pad-${direction}`, direction),
			release: (direction) => this.#input.release(`pad-${direction}`),
			use: () => this.#input.request('use'),
			jump: () => this.#input.request(this.#world.riding ? 'honk' : 'jump'),
			move: (id, held) => this.#input.holdMove('pad', id, held),
			throwItem: (id) => this.#input.throwItem(id),
			party: () => this.#input.request('party'),
			handbrake: (held) => (this.#input.handbrake.pad = held),
			steer: (value) => (this.#input.wheel = value),
			pedal: (value) => (this.#input.pedal = value),
			play: () => hooks.play(),
			dismiss: () => {
				this.#sendAway = true;
				hooks.emit('visit-dismiss');
			},
			repair: () => this.#repair(),
			hideHint: (hidden) => {
				this.#hintHidden = hidden;
				this.#hintSince = performance.now();
				this.#render();
			},
			restart: () => (this.#restart = true),
			exit: () => this.#stop(),
			toggleShop: () => this.#toggleShop(),
			buy: (id) => {
				this.#world.buy(id);
				this.#render();
			}
		});
		this.#best = loadBest(hooks.config.progress.key);
		this.#world = this.#createWorld(hooks.state === 'visiting');
		this.#ctx = this.#fitCanvas();
		this.#colors = resolveColors(this.#ui.probe);
		this.#render();

		addEventListener('keydown', this.#input.keydown);
		addEventListener('keyup', this.#input.keyup);
		addEventListener('blur', this.#input.blur);
		addEventListener('resize', this.#onresize);
		addEventListener('pagehide', this.#onpagehide);
		addEventListener('pointerdown', this.#onpointerdown, { capture: true });
		this.#request = requestAnimationFrame(this.#frame);
	}

	/** The world being played, for tests and analytics. */
	get world(): World {
		return this.#world;
	}

	destroy(): void {
		cancelAnimationFrame(this.#request);
		removeEventListener('keydown', this.#input.keydown);
		removeEventListener('keyup', this.#input.keyup);
		removeEventListener('blur', this.#input.blur);
		removeEventListener('resize', this.#onresize);
		removeEventListener('pagehide', this.#onpagehide);
		removeEventListener('pointerdown', this.#onpointerdown, { capture: true });
		this.#endRound();
		this.#input.clear();
		this.#wrecker.repair();
		this.#audio.close();
		for (const off of this.#unsubscribe) off();
		this.#ui.remove();
	}

	configure(): void {
		this.#ui.texts = textsFor(this.#hooks.config);
		this.#audio.configure(this.#hooks.config.audio);
		this.#render();
	}

	pageChanged(): void {
		this.#repair();
	}

	// --- World -----------------------------------------------------------------------------

	#createWorld(lobby: boolean): World {
		for (const off of this.#unsubscribe) off();
		const config = this.#hooks.config;
		const world = createWorld(config, { host: this.#host, lobby });
		const on = world.events.on.bind(world.events);
		this.#unsubscribe = [
			on('strike', ({ at, power }) => this.#strike(at, power)),
			on('land', ({ x, y }) => world.view === 'topdown' && this.#clickAt(x - scrollX, y - scrollY)),
			on('honk', ({ x, y }) =>
				this.#clickAt(x - scrollX, y - (world.view === 'side' ? 12 : 0) - scrollY)
			),
			on('kill', ({ body }) => {
				this.#burst({ x: body.x - 20, y: body.y - 20, width: 40, height: 40 }, 'monster');
			}),
			on('catch', ({ body }) =>
				this.#blasts.push({ x: body.x, y: body.y, radius: 46, at: performance.now() })
			),
			on('explode', ({ x, y, radius }) =>
				this.#blasts.push({ x, y, radius, at: performance.now() })
			),
			on('enterVehicle', () => this.#hooks.emit('car-enter')),
			on('levelUp', ({ level }) => level > 1 && this.#hooks.emit('level', { level })),
			on('viewChange', ({ mode }) => this.#hooks.emit('view', { mode })),
			on('pickup', ({ item }) => this.#hooks.emit('pickup', { item: item.def })),
			on('upgrade', ({ id, level }) => this.#hooks.emit('upgrade', { id, level })),
			on('message', ({ text }) => this.#ui.toast(text)),
			on('sound', ({ id }) => this.#audio.play(id)),
			on('over', ({ won }) => this.#over(won)),
			...Object.entries(config.audio.events).flatMap(([event, sound]) =>
				sound ? [on(event, () => this.#audio.play(sound))] : []
			)
		];
		this.#roundStarted = false;
		if (lobby) world.visit();
		return world;
	}

	#over(won: boolean): void {
		this.#input.clear();
		const score = this.#world.stats.earned;
		this.#best = saveBest(this.#hooks.config.progress.key, score);
		this.#hooks.emit('over', { score, won });
		this.#shopOpen = false;
	}

	#startRound(): void {
		this.#roundStarted = true;
		this.#hintSince = performance.now();
		this.#hooks.emit('start', { source: this.#hooks.source });
	}

	#endRound(): void {
		if (!this.#roundStarted || this.#ended) return;
		this.#ended = true;
		const summary = this.#world.summary();
		this.#hooks.emit('end', {
			...summary,
			source: this.#hooks.source,
			duration: durationGroup(Number(summary.seconds)),
			pages: 1
		});
	}

	#stop(): void {
		this.#input.clear();
		this.#hooks.stop();
	}

	#escape(): void {
		if (this.#shopOpen) this.#toggleShop();
		// Esc gets out of the vehicle first, and ends the game on foot.
		else if (this.#world.riding) this.#input.request('use');
		else this.#stop();
	}

	#toggleShop(): void {
		if (this.#world.phase !== 'playing' || Object.keys(this.#hooks.config.upgrades).length === 0)
			return;
		this.#shopOpen = !this.#shopOpen;
		this.#input.clear();
		this.#render();
	}

	// --- Page ------------------------------------------------------------------------------

	#repair(): void {
		this.#wrecker.repair();
		this.#shards = [];
		this.#marks = [];
		this.#blasts = [];
		this.#render();
	}

	/** A strike that hit no monster: the element in front of the fist cracks, then breaks. */
	#strike(at: { x: number; y: number }, power: number): void {
		const target = punchTarget(document.elementFromPoint(at.x - scrollX, at.y - scrollY), {
			width: innerWidth,
			height: innerHeight
		});
		if (!target) return;
		const box = target.getBoundingClientRect();
		if (this.#wrecker.hit(target, power) !== 'broken') return;
		this.#world.broke();
		this.#burst(
			{ x: box.x + scrollX, y: box.y + scrollY, width: box.width, height: box.height },
			'page'
		);
	}

	/** Clicks whatever lies under (x, y) in the window. */
	#clickAt(x: number, y: number): void {
		const found = clickTarget(document.elementFromPoint(x, y));
		if (found) activate(found);
	}

	#burst(
		box: { x: number; y: number; width: number; height: number },
		into: 'page' | 'monster'
	): void {
		if (this.#reducedMotion.matches) return;
		if (into === 'page')
			this.#shards = [...this.#shards, ...burst(box, shardColors(this.#colors).length)];
		else
			this.#monsterShards = [
				...this.#monsterShards,
				...burst(box, monsterShardColors(this.#colors).length)
			];
	}

	readonly #onresize = (): void => {
		this.#ctx = this.#fitCanvas();
	};

	// Closing the tab or leaving the site ends the round too.
	readonly #onpagehide = (): void => this.#endRound();

	/** On touch screens tapping the vehicle honks (and clicks what it stands on). */
	readonly #onpointerdown = (event: PointerEvent): void => {
		const car = this.#world.riding;
		if (!car) return;
		if (Math.hypot(event.clientX - (car.x - scrollX), event.clientY - (car.y - scrollY)) > 40)
			return;
		event.preventDefault();
		this.#input.request('honk');
	};

	/** Canvas in CSS pixels, sharp on high-density screens. */
	#fitCanvas(): CanvasRenderingContext2D | null {
		const canvas = this.#ui.canvas;
		const ratio = devicePixelRatio || 1;
		canvas.width = Math.round(innerWidth * ratio);
		canvas.height = Math.round(innerHeight * ratio);
		const ctx = canvas.getContext('2d');
		ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
		if (ctx) ctx.imageSmoothingEnabled = false;
		return ctx;
	}

	// --- Frame -----------------------------------------------------------------------------

	readonly #frame = (now: number): void => {
		const dt = Math.min((now - this.#last) / 1000, 0.05);
		this.#last = now;
		const ctx = this.#ctx;
		if (!ctx) return;
		const hooks = this.#hooks;
		let world = this.#world;
		const playing = hooks.state === 'playing';

		if (playing && world.phase === 'lobby') {
			world.begin();
			this.#startRound();
		} else if (playing && !this.#roundStarted) {
			this.#startRound();
		}
		if (this.#restart) {
			this.#restart = false;
			this.#endRound();
			this.#ended = false;
			this.#shards = this.#monsterShards = [];
			world = this.#world = this.#createWorld(false);
			this.#startRound();
		}
		if (!playing && this.#sendAway) {
			this.#sendAway = false;
			world.dismissVisit();
		}

		const paused = this.#shopOpen;
		if (!paused) {
			this.#input.apply(world.controls, world.riding !== undefined);
			world.step(dt);
		}
		if (!playing) {
			if (world.bodies.some((body) => body.kind === 'vehicle')) this.#visited = true;
			else if (this.#visited) {
				// The visiting vehicle drove away: nothing left to show.
				hooks.ended();
				return;
			}
		}

		this.#updateEffects(world, now, dt);
		this.#updatePhase(world, now);
		this.#render();
		this.#expose();

		// Theme or light/dark may change while playing.
		if (++this.#frames % 30 === 0) {
			this.#colors = resolveColors(this.#ui.probe);
			this.#marks = fresh(this.#marks, now);
			this.#blasts = this.#blasts.filter((blast) => now - blast.at < BLAST_MS);
		}
		this.#draw(ctx, now);
		this.#request = requestAnimationFrame(this.#frame);
	};

	#visited = false;

	#updateEffects(world: World, now: number, dt: number): void {
		this.#shards = fly(this.#shards, dt);
		this.#monsterShards = fly(this.#monsterShards, dt);
		const car = world.riding;
		if (!car) {
			this.#wheelsBefore = [];
			return;
		}
		// Tire marks while it slides; none across a jump to the other end of the page.
		const wheels = rearWheels(car, world.config.entities[car.def]?.size);
		const jumped = this.#wheelsBefore.some((before, index) => {
			const wheel = wheels[index];
			return wheel ? Math.hypot(wheel.x - before.x, wheel.y - before.y) > 200 : false;
		});
		if (isSkidding(car) && !jumped && world.view === 'topdown') {
			this.#marks = addMarks(this.#marks, this.#wheelsBefore, wheels, now);
		}
		this.#wheelsBefore = wheels;
	}

	#updatePhase(world: World, now: number): void {
		const near = (): boolean =>
			world.bodies.some(
				(body) =>
					body.kind === 'vehicle' &&
					!body.pilot &&
					Math.hypot(body.x - world.player.x, body.y - world.player.y) <= CAR.reach
			);
		let phase: Phase = 'foot';
		if (this.#hooks.state !== 'playing') phase = 'visit';
		else if (world.riding) phase = 'driving';
		else if (near()) phase = 'near';
		if (phase !== this.#phase) {
			this.#hintSince = now;
			// Next to the vehicle the hint matters again: how to get in.
			if (phase === 'near') this.#hintHidden = false;
		}
		const hideAfter = this.#hooks.config.hint.hideAfter;
		if (
			hideAfter > 0 &&
			phase !== 'visit' &&
			world.phase === 'playing' &&
			!this.#hintHidden &&
			now - this.#hintSince > hideAfter * 1000
		) {
			this.#hintHidden = true;
		}
		this.#phase = phase;
	}

	#render(): void {
		const world = this.#world;
		const config = world.config;
		const texts = textsFor(this.#hooks.config);
		const player = config.entities[config.game.player];
		const boss = world.bodies.find((body) => config.entities[body.def]?.boss);
		const moves = (player?.moves ?? []).flatMap((id) => {
			const move = config.moves[id];
			if (!move || move.where === 'vehicle') return [];
			const known = id === 'punch' || id === 'kick' ? texts[id] : undefined;
			return [{ id, label: known ?? (move.label || id) }];
		});
		const upgrades: UpgradeRow[] = Object.entries(config.upgrades).flatMap(([id, upgrade]) =>
			world.level < upgrade.minLevel
				? []
				: [
						{
							id,
							label: upgrade.label || id,
							help: upgrade.help,
							level: world.upgrades[id] ?? 0,
							max: upgrade.max,
							price:
								(world.upgrades[id] ?? 0) >= upgrade.max
									? undefined
									: upgrade.cost * ((world.upgrades[id] ?? 0) + 1),
							canBuy: world.canBuy(id)
						}
					]
		);
		const view: View = {
			phase: this.#phase,
			side: world.view === 'side',
			broken: this.#wrecker.broken,
			hintHidden: this.#hintHidden,
			hud:
				config.spawns.length > 0 ||
				config.levels.length > 0 ||
				upgrades.length > 0 ||
				world.party.length > 0,
			score: world.score,
			health: victimOf(world).hp,
			maxHealth: world.maxHp(victimOf(world)),
			over: world.phase === 'over' ? 'over' : world.phase === 'won' ? 'won' : 'none',
			level: world.level,
			levels: config.levels.length,
			best: this.#best,
			boss: boss
				? {
						name: config.entities[boss.def]?.label || boss.def,
						hp: boss.hp,
						max: boss.stats.hp ?? boss.hp
					}
				: undefined,
			moves,
			team: world.party.map((member) => ({
				label: config.entities[member.def]?.label || member.def,
				hp: member.id === world.ally?.member ? (world.ally?.hp ?? member.hp) : member.hp,
				max: member.stats.hp ?? 1,
				out: member.id === world.ally?.member
			})),
			throwables: Object.entries(config.throwables).flatMap(([id, item]) =>
				item.where === 'both' || (item.where === 'vehicle') === (world.riding !== undefined)
					? [
							{
								id,
								label: item.label || id,
								ammo: item.unlimited ? '∞' : String(world.ammoOf(id))
							}
						]
					: []
			),
			upgrades,
			shopOpen: this.#shopOpen,
			stats: Object.entries(config.stats).flatMap(([id, stat]) =>
				world.player.stats[id] === undefined
					? []
					: [
							{
								label: stat.label || id,
								value: String(Math.round(world.stat(world.player, id) * 10) / 10)
							}
						]
			)
		};
		this.#ui.render(view);
	}

	/** Positions for tests (the player, the vehicle, the monsters, health and score). */
	#expose(): void {
		const world = this.#world;
		const data = this.#ui.canvas.dataset;
		const at = (body: Body | undefined) =>
			body
				? { x: String(Math.round(body.x - scrollX)), y: String(Math.round(body.y - scrollY)) }
				: { x: '', y: '' };
		const player = at(world.riding ?? world.player);
		data.x = world.phase === 'lobby' ? '' : player.x;
		data.y = world.phase === 'lobby' ? '' : player.y;
		const vehicle = world.riding ?? world.bodies.find((body) => body.kind === 'vehicle');
		const car = at(vehicle);
		data.carX = car.x;
		data.carY = car.y;
		data.driving = String(world.riding !== undefined);
		data.marks = String(this.#marks.length);
		data.shards = String(this.#shards.length);
		const monsters = world.bodies.filter((body) => hostile(body));
		data.enemies = String(monsters.length);
		const first = at(monsters[0]);
		data.enemyX = first.x;
		data.enemyY = first.y;
		data.health = String(Math.round(world.player.hp));
		data.score = String(world.score);
		data.view = world.view;
		data.level = String(world.level);
		data.items = String(world.pickups.length);
		data.projectiles = String(world.projectiles.length);
		data.state = world.phase;
	}

	#draw(ctx: CanvasRenderingContext2D, now: number): void {
		const sprites = this.#hooks.config.sprites;
		const key = JSON.stringify(sprites);
		if (key !== this.#picturesFor) {
			this.#picturesFor = key;
			this.#pictures = loadPictures(sprites);
		}
		const world = this.#world;
		const config = world.config;
		const scene: Scene = {
			colors: this.#colors,
			pictures: this.#pictures,
			reducedMotion: this.#reducedMotion.matches,
			time: now / 1000,
			scroll: { x: scrollX, y: scrollY },
			side: world.view === 'side'
		};
		ctx.clearRect(0, 0, innerWidth, innerHeight);
		drawSkidMarks(ctx, this.#marks, scene, now);
		// Hideouts lie on the ground: they sway when something moves in them or hides in them.
		const walker = world.riding ?? world.player;
		const walking = world.riding ? Math.abs(world.riding.speed) > 20 : world.player.moving;
		world.hideouts.forEach((place, index) => {
			const look = config.hideouts[place.def]?.look;
			if (!look) return;
			const inside = walking && Math.hypot(walker.x - place.x, walker.y - place.y) < place.radius;
			const hiding = world.bodies.some((body) => body.hidden && body.hideout === index);
			drawHideout(ctx, place, look, index, inside ? 1 : hiding ? 0.25 : 0, scene);
		});
		for (const pickup of world.pickups) {
			const definition = config.items[pickup.def];
			if (definition) drawPickup(ctx, pickup, definition, scene);
		}
		for (const projectile of world.projectiles) {
			const definition = config.throwables[projectile.def];
			if (definition) drawProjectile(ctx, projectile, definition, scene);
		}
		// Vehicles first, then monsters, then the figure on top.
		const bodies = [...world.bodies].sort(
			(a, b) => Number(b.kind === 'vehicle') - Number(a.kind === 'vehicle')
		);
		for (const body of bodies) {
			const base = config.entities[body.def];
			if (!base || body.hidden || (body.covered && body.kind === 'monster' && !body.ally)) continue;
			// Evolved monsters are bigger than their definition says.
			const definition = body.level > 0 ? { ...base, size: sizeOf(world, body) } : base;
			if (body.ally) drawTeamRing(ctx, body, definition.size, scene);
			drawBody(ctx, body, definition, scene);
			if (body.kind === 'monster')
				drawHealth(ctx, body, body.stats.hp ?? body.hp, scene, definition.size);
		}
		const hero = config.entities[config.game.player];
		if (hero && world.phase !== 'lobby' && !world.riding) {
			drawBody(ctx, world.player, hero, scene);
		}
		for (const blast of this.#blasts) drawBlast(ctx, blast, scene, now);
		drawShards(ctx, this.#shards, scene, shardColors(this.#colors));
		drawShards(ctx, this.#monsterShards, scene, monsterShardColors(this.#colors));
	}
}
