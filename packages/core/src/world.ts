import type { ViewMode } from '@hello-eme/play-schema';
import { resolveConfig, type PlayConfig } from '@hello-eme/play-schema';
import { parkingSpot, think } from './ai.js';
import { createBody, tickBody } from './bodies.js';
import { addPoints, damage as applyDamage, overrun, targetOf, useMove } from './combat.js';
import { createEventBus } from './events.js';
import { createPickup, spawnItems, tickObjects, updatePickups, usePickup } from './items.js';
import { cycleParty, healParty, hidingSpot, placeHideouts, recruit, tickHideouts } from './team.js';
import { ammoOf, giveAmmo, throwItem, updateProjectiles } from './throwables.js';
import { buy, canBuy, checkGoal, spawnMonsters, startLevel, vehicleVisit } from './progress.js';
import { checkPhases } from './phases.js';
import { createRandom } from './random.js';
import { setState, stateOf, type State } from './state.js';
import {
	advance,
	createStaticHost,
	edgePoint,
	floorY,
	follow,
	HARD_EDGE,
	sizeOf
} from './space.js';
import { between, distance, statOf } from './stats.js';
import { installTriggers, runActions, tickIntervals } from './triggers.js';
import type { Body, Controls, Hideout, Host, Stats, World, WorldEvents } from './types.js';
import { autopilot, CAR, doorSide, drive } from './vehicle.js';
import { tickWaves } from './waves.js';
import { startJump, walk } from './walk.js';

export interface WorldOptions {
	/** The page; default a fixed page for tests and simulations. */
	host?: Host;
	/** Same seed, same game. */
	seed?: number;
	/** Start in the lobby (a vehicle visits, nobody plays yet) instead of playing right away. */
	lobby?: boolean;
}

/** The longest step simulated at once, so a slow frame doesn't teleport anything. */
const MAX_STEP = 0.1;

const emptyStats = (): Stats => ({
	seconds: 0,
	drivingSeconds: 0,
	rides: 0,
	moves: 0,
	kills: 0,
	overrun: 0,
	broken: 0,
	jumps: 0,
	honks: 0,
	thrown: 0,
	caught: 0,
	pickups: 0,
	upgrades: 0,
	earned: 0,
	kind: {}
});

export function createWorld(json: PlayConfig | unknown, options: WorldOptions = {}): World {
	const config = isResolved(json) ? json : resolveConfig(json);
	const host = options.host ?? createStaticHost();
	const events = createEventBus<WorldEvents>();
	const random = createRandom(options.seed ?? Date.now());
	const controls: Controls = {
		axis: { x: 0, y: 0 },
		drift: false,
		held: new Set(),
		pressed: new Set(),
		throws: new Set()
	};
	const state: State = {
		nextId: 1,
		spawnDue: [],
		waves: [],
		itemDue: [],
		encounterDue: 0,
		ammo: Object.fromEntries(
			Object.entries(config.throwables).map(([id, throwable]) => [id, throwable.ammo])
		),
		throwDue: {},
		intervalDue: [],
		fired: new Set(),
		kills: {},
		level: { time: 0, earned: 0, kills: 0, boss: false },
		carDue: undefined,
		depth: 0,
		vehicleBonus: {},
		rideSince: undefined,
		ridden: 0
	};

	const heroDefinition = config.entities[config.game.player];
	if (!heroDefinition) throw new Error(`The played figure "${config.game.player}" is not defined.`);
	const vp = host.viewport();
	const sc = host.scroll();
	const player = createBody(
		state.nextId++,
		config.game.player,
		heroDefinition,
		sc.x + vp.width / 2,
		config.view.mode === 'side'
			? sc.y + vp.height - HARD_EDGE
			: sc.y + vp.top + (vp.height - vp.top) / 2
	);
	player.cooldown = 0;

	const hideouts: Hideout[] = [];
	const world: World = {
		config,
		events,
		random,
		host,
		controls,
		phase: options.lobby ? 'lobby' : 'playing',
		view: config.view.mode,
		time: 0,
		level: 1,
		score: 0,
		lives: config.game.lives,
		player,
		riding: undefined,
		bodies: [],
		pickups: [],
		projectiles: [],
		party: [],
		ally: undefined,
		hideouts,
		upgrades: {},
		stats: emptyStats(),

		step(dt) {
			const seconds = Math.min(Math.max(dt, 0), MAX_STEP);
			if (world.phase === 'lobby') return lobbyStep(world, seconds);
			if (world.phase !== 'playing') return;
			world.time += seconds;
			world.stats.seconds = world.time;
			tickBody(player, seconds);
			if (world.riding) state.ridden += seconds;
			handleActions(world);
			if (world.riding) {
				drive(world, world.riding, seconds);
				player.x = world.riding.x;
				player.y = world.riding.y;
				overrun(world, world.riding);
			} else {
				walk(world, player, seconds);
			}
			for (const id of controls.held) useMove(world, id);
			tickObjects(world, seconds);
			think(world, seconds);
			updatePickups(world, seconds);
			updateProjectiles(world, seconds);
			tickHideouts(world, seconds);
			spawnMonsters(world);
			spawnItems(world);
			vehicleVisit(world);
			tickIntervals(world);
			tickWaves(world);
			checkGoal(world);
		},

		spawn(def, x, y) {
			const definition = config.entities[def];
			if (!definition) return undefined;
			const side = world.view === 'side';
			const body = createBody(
				state.nextId++,
				def,
				definition,
				x,
				side ? Math.min(y, floorY(world)) : y
			);
			if (definition.kind === 'vehicle') {
				for (const [stat, amount] of Object.entries(state.vehicleBonus)) {
					body.stats[stat] = (body.stats[stat] ?? 0) + amount;
				}
				if (definition.behavior === 'arrive') {
					body.pilot = { targets: [parkingSpot(world)], pause: 0, leaving: false };
				} else body.parked = true;
			}
			world.bodies.push(body);
			events.emit('spawn', { body });
			return body;
		},

		spawnAt(def, count, where) {
			const target = targetOf(world);
			return Array.from({ length: count }, () => {
				let spot = edgePoint(world);
				if (where === 'near') {
					const angle = random() * Math.PI * 2;
					const away = 140 + random() * 140;
					spot = { x: target.x + Math.cos(angle) * away, y: target.y + Math.sin(angle) * away };
					const pg = host.page();
					spot.x = Math.min(Math.max(spot.x, HARD_EDGE), pg.width - HARD_EDGE);
					spot.y = Math.min(Math.max(spot.y, HARD_EDGE), pg.height - HARD_EDGE);
				}
				const hideIn = config.entities[def]?.hideIn;
				const hiding = hideIn ? hidingSpot(world, hideIn) : undefined;
				if (!hiding) return world.spawn(def, spot.x, spot.y);
				const hidden = world.spawn(def, hiding.x, hiding.y);
				if (hidden) {
					hidden.hidden = true;
					hidden.hideout = hiding.index;
				}
				return hidden;
			}).filter((body): body is Body => body !== undefined);
		},

		dropItem: (def, x, y) => createPickup(world, def, x, y),

		begin() {
			if (world.phase === 'playing') return;
			const visitor = world.bodies.find(
				(body) => body.kind === 'vehicle' && body.pilot?.leaving !== true
			);
			world.phase = 'playing';
			if (visitor) {
				visitor.pilot = undefined;
				visitor.speed = 0;
				visitor.parked = true;
				enter(world, visitor);
			}
			player.x = visitor?.x ?? player.x;
			player.y = visitor?.y ?? player.y;
			startRound(world);
		},

		visit() {
			const vehicle = world.spawnAt(config.visits.vehicle, 1, 'edge')[0];
			if (vehicle) vehicle.pilot ??= { targets: [parkingSpot(world)], pause: 0, leaving: false };
			return vehicle;
		},

		dismissVisit() {
			const vehicle = world.bodies.find((body) => body.kind === 'vehicle');
			if (!vehicle) return;
			const vp2 = host.viewport();
			const sc2 = host.scroll();
			const left = vehicle.x - sc2.x < vp2.width / 2;
			vehicle.parked = false;
			vehicle.pilot = {
				targets: [{ x: left ? sc2.x - 120 : sc2.x + vp2.width + 120, y: vehicle.y }],
				pause: 0,
				leaving: true
			};
		},

		run: (actions) => runActions(world, actions),

		setView(mode: ViewMode) {
			if (mode === world.view) return;
			world.view = mode;
			for (const body of [player, ...world.bodies]) {
				body.fall = 0;
				body.grounded = false;
				body.drop = 0;
				body.vx = 0;
				body.vy = 0;
				if (mode === 'side') body.y = Math.min(body.y, floorY(world));
			}
			for (const pickup of world.pickups) {
				pickup.fall = 0;
				pickup.grounded = false;
			}
			events.emit('viewChange', { mode });
		},

		nextLevel() {
			world.level += 1;
			startLevel(world);
		},

		stat: (body, id) => statOf(world, body, id),
		maxHp: (body) => statOf(world, body, 'hp'),

		cycleParty: () => cycleParty(world),
		recruit: (def) => recruit(world, def),
		healParty: (percent) => healParty(world, percent),
		throwItem: (id) => throwItem(world, id),
		ammoOf: (id) => ammoOf(world, id),
		giveAmmo: (id, amount) => giveAmmo(world, id, amount),

		wreck(vehicle) {
			const index = world.bodies.indexOf(vehicle);
			if (index < 0) return;
			if (world.riding === vehicle) {
				exit(world);
				world.player.invulnerable = Math.max(world.player.invulnerable, 1.5);
			}
			world.bodies.splice(world.bodies.indexOf(vehicle), 1);
			events.emit('explode', {
				throwable: '',
				x: vehicle.x,
				y: vehicle.y,
				radius: sizeOf(world, vehicle)
			});
			events.emit('wreck', { vehicle });
		},

		use() {
			if (world.phase !== 'playing') return;
			if (world.riding) return exit(world);
			if (usePickup(world)) return;
			const vehicle = world.bodies.find(
				(body) => body.kind === 'vehicle' && !body.pilot && distance(body, player) <= CAR.reach
			);
			if (vehicle) enter(world, vehicle);
		},

		press(code) {
			if (world.phase === 'playing') events.emit('key', { code });
		},

		canBuy: (id) => canBuy(world, id),
		buy: (id) => buy(world, id),

		broke() {
			world.stats.broken += 1;
			addPoints(world, config.game.breakPoints);
			events.emit('break', { points: config.game.breakPoints });
		},

		damage(target, amount, from, source) {
			applyDamage(world, target, amount, from, source);
			checkPhases(world, target);
		},

		end(won) {
			if (world.phase !== 'playing') return;
			world.phase = won ? 'won' : 'over';
			stopRide(world);
			events.emit('over', { won });
		},

		summary() {
			stopRide(world);
			const stats = world.stats;
			return {
				seconds: Math.round(stats.seconds),
				drivingSeconds: Math.round(state.ridden),
				rides: stats.rides,
				moves: stats.moves,
				kills: stats.kills,
				overrun: stats.overrun,
				broken: stats.broken,
				jumps: stats.jumps,
				honks: stats.honks,
				thrown: stats.thrown,
				caught: stats.caught,
				pickups: stats.pickups,
				upgrades: stats.upgrades,
				score: stats.earned,
				level: world.level,
				view: world.view,
				...stats.kind
			};
		}
	};

	setState(world, state);
	hideouts.push(...placeHideouts(world));
	installTriggers(world);
	if (world.phase === 'playing') startRound(world);
	return world;
}

function isResolved(json: unknown): json is PlayConfig {
	return (
		typeof json === 'object' &&
		json !== null &&
		(json as { version?: unknown }).version !== undefined &&
		'entities' in json &&
		'game' in json &&
		'texts' in json &&
		'upgrades' in json
	);
}

/** The first moments of a round: level 1, the vehicle that will drive in, the `start` event. */
function startRound(world: World): void {
	const state = stateOf(world);
	const visits = world.config.visits;
	state.carDue =
		visits.enabled && visits.whilePlaying && !world.riding
			? world.time + between(world, visits.playDelay)
			: undefined;
	state.rideSince = undefined;
	startLevel(world);
	world.events.emit('start', { phase: world.phase });
}

/** Lobby: vehicles drive in and park, or drive away and vanish. */
function lobbyStep(world: World, dt: number): void {
	for (const body of [...world.bodies]) {
		if (body.kind !== 'vehicle') continue;
		const leaving = body.pilot?.leaving === true;
		const done = body.pilot ? autopilot(world, body, dt) : true;
		if (done && leaving) world.bodies.splice(world.bodies.indexOf(body), 1);
		else if (done) body.parked = true;
	}
}

function handleActions(world: World): void {
	const { pressed } = world.controls;
	for (const id of world.controls.throws) world.throwItem(id);
	world.controls.throws.clear();
	if (pressed.has('use')) world.use();
	if (pressed.has('party')) world.cycleParty();
	if (pressed.has('jump')) {
		if (world.riding) honk(world);
		else if (startJump(world, world.player)) world.stats.jumps += 1;
	}
	if (pressed.has('honk') && world.riding) honk(world);
	pressed.clear();
}

function honk(world: World): void {
	world.stats.honks += 1;
	const at = world.riding ?? world.player;
	world.events.emit('honk', { x: at.x, y: at.y });
	world.events.emit('sound', { id: 'honk' });
}

function enter(world: World, vehicle: Body): void {
	const state = stateOf(world);
	world.riding = vehicle;
	vehicle.pilot = undefined;
	vehicle.parked = false;
	world.player.jump = 0;
	world.stats.rides += 1;
	state.rideSince = world.time;
	state.carDue = undefined;
	world.events.emit('enterVehicle', { vehicle });
}

function exit(world: World): void {
	const vehicle = world.riding;
	if (!vehicle) return;
	const door = doorSide(vehicle, sizeOf(world, vehicle));
	const pg = world.host.page();
	world.riding = undefined;
	vehicle.parked = true;
	world.player.x = Math.min(Math.max(door.x, HARD_EDGE), pg.width - HARD_EDGE);
	world.player.y =
		world.view === 'side'
			? vehicle.y
			: Math.min(Math.max(door.y, HARD_EDGE), pg.height - HARD_EDGE);
	world.player.angle = vehicle.angle;
	world.player.grounded = false;
	stopRide(world);
	world.events.emit('exitVehicle', { vehicle });
	advance(world, world.player, 0, 0, false);
	follow(world, world.player.x, world.player.y);
}

/** Closes the driving-time bookkeeping. */
function stopRide(world: World): void {
	const state = stateOf(world);
	state.rideSince = undefined;
}
