/** Catching monsters, the team and the monster that fights for the figure, and places to hide. */
import type { HideoutDefinition, ThrowableDefinition } from '@hello-eme/play-schema';
import { hostile } from './bodies.js';
import { advance, floorY, HARD_EDGE, radiusOf, sizeOf } from './space.js';
import { stateOf } from './state.js';
import { between, cooldownOf, distance, hitOf, statOf } from './stats.js';
import type { Body, Hideout, PartyMember, World } from './types.js';

/** Seconds a team member can't be hurt again after a hit. */
const ALLY_HURT_SECONDS = 0.4;
/** The share of the page all hideouts together may cover. */
const MAX_COVER = 0.25;
/** How far an ally looks for something to fight, px. */
const ALLY_SIGHT = 450;
/** How close an ally stays to the figure when nothing is going on, px. */
const FOLLOW_DISTANCE = 90;
/** An ally farther than this from the figure is brought back to its side. */
const TELEPORT_DISTANCE = 900;
/** How far a monster looks for a team member to attack instead of the figure, px. */
const FOE_SIGHT = 220;

// --- Catching ---------------------------------------------------------------------------------

/** The chance (percent) that a ball of this strength catches the monster. */
export function catchChance(world: World, monster: Body, strength: number): number {
	const rate = world.config.entities[monster.def]?.catchRate ?? 0;
	const ratio = Math.min(1, Math.max(0, monster.hp / Math.max(1, statOf(world, monster, 'hp'))));
	return Math.min(100, strength * (rate / 100) * (1 - 0.6 * ratio));
}

/** A ball touches a monster: it is caught (and joins the team) or breaks free. */
export function attemptCatch(
	world: World,
	monster: Body,
	definition: ThrowableDefinition,
	throwable: string
): boolean {
	const chance = catchChance(world, monster, definition.catch);
	const room = world.party.length < world.config.game.partySize;
	if (!room || world.random() * 100 >= chance) {
		world.events.emit('escape', { body: monster, throwable });
		return false;
	}
	const index = world.bodies.indexOf(monster);
	if (index >= 0) world.bodies.splice(index, 1);
	const member: PartyMember = {
		id: stateOf(world).nextId++,
		def: monster.def,
		level: monster.level,
		hp: Math.max(1, monster.hp),
		stats: { ...monster.stats },
		kills: monster.kills
	};
	world.party.push(member);
	world.stats.caught += 1;
	world.events.emit('catch', { body: monster, throwable, member });
	return true;
}

// --- The team ---------------------------------------------------------------------------------

function memberOf(world: World, body: Body): PartyMember | undefined {
	return world.party.find((member) => member.id === body.member);
}

/** The body's current state goes back into its team member. */
function sync(world: World, body: Body): void {
	const member = memberOf(world, body);
	if (!member) return;
	member.def = body.def;
	member.level = body.level;
	member.hp = Math.max(0, body.hp);
	member.stats = { ...body.stats };
	member.kills = body.kills;
}

/** Adds a monster of this kind to the team. */
export function recruit(world: World, def: string): PartyMember | undefined {
	const definition = world.config.entities[def];
	if (!definition || definition.kind !== 'monster') return undefined;
	if (world.party.length >= world.config.game.partySize) return undefined;
	const member: PartyMember = {
		id: stateOf(world).nextId++,
		def,
		level: 0,
		hp: definition.stats.hp ?? 1,
		stats: { ...definition.stats },
		kills: 0
	};
	world.party.push(member);
	return member;
}

/** Heals the whole team by a percent of each one's health; 100 also revives the fainted. */
export function healParty(world: World, percent: number): void {
	for (const member of world.party) {
		const max = member.stats.hp ?? 1;
		if (member.hp <= 0 && percent < 100) continue;
		member.hp = Math.min(max, member.hp + (max * percent) / 100);
	}
	const out = world.ally;
	const member = out && memberOf(world, out);
	if (out && member) out.hp = member.hp;
}

function sendOut(world: World, member: PartyMember): void {
	const near = world.riding ?? world.player;
	const ally = world.spawn(member.def, near.x + 40, near.y + (world.view === 'side' ? 0 : 20));
	if (!ally) return;
	ally.ally = true;
	ally.member = member.id;
	ally.level = member.level;
	ally.kills = member.kills;
	ally.stats = { ...member.stats };
	ally.hp = member.hp;
	ally.cooldown = 0.5;
	world.ally = ally;
	world.events.emit('summon', { body: ally, out: true });
}

function recall(world: World): void {
	const ally = world.ally;
	if (!ally) return;
	sync(world, ally);
	const index = world.bodies.indexOf(ally);
	if (index >= 0) world.bodies.splice(index, 1);
	world.ally = undefined;
	world.events.emit('summon', { body: ally, out: false });
}

/** Sends out the next healthy member (calling the current one back); after the last, none is out. */
export function cycleParty(world: World): void {
	const current = world.ally
		? world.party.findIndex((member) => member.id === world.ally?.member)
		: -1;
	recall(world);
	const next = world.party.find((member, index) => index > current && member.hp > 0);
	if (next) sendOut(world, next);
}

/** A team member hurt by a monster: it blinks, and goes back into the team when out of health. */
export function hurtAlly(world: World, ally: Body, amount: number): void {
	if (ally.invulnerable > 0) return;
	ally.hp -= amount;
	ally.hurt = 0.25;
	ally.invulnerable = ALLY_HURT_SECONDS;
	if (ally.hp > 0) return;
	ally.hp = 0;
	sync(world, ally);
	const member = memberOf(world, ally);
	const index = world.bodies.indexOf(ally);
	if (index >= 0) world.bodies.splice(index, 1);
	if (world.ally === ally) world.ally = undefined;
	if (member) world.events.emit('faint', { body: ally, member });
}

/** The nearest team member within `range` of a monster (a monster fights it instead of the figure). */
export function foeOf(world: World, monster: Body): Body | undefined {
	const ally = world.ally;
	return ally && distance(ally, monster) <= FOE_SIGHT ? ally : undefined;
}

/** What a team member does: fights the nearest monster in sight, else stays close to the figure. */
export function thinkAlly(world: World, ally: Body, dt: number): void {
	sync(world, ally);
	const leader = world.riding ?? world.player;
	const side = world.view === 'side';
	if (distance(ally, leader) > TELEPORT_DISTANCE) {
		ally.x = leader.x + 40;
		ally.y = leader.y;
	}
	let foe: Body | undefined;
	let best = ALLY_SIGHT;
	for (const other of world.bodies) {
		if (!hostile(other)) continue;
		const near = distance(other, ally);
		if (near < best) {
			foe = other;
			best = near;
		}
	}
	const goal = foe ?? leader;
	const stop = foe ? firstReach(world, ally) * 0.8 : FOLLOW_DISTANCE;
	const toX = goal.x - ally.x;
	const toY = side ? 0 : goal.y - ally.y;
	const away = Math.hypot(toX, toY);
	const speed = statOf(world, ally, 'speed') * (foe ? 1 : 1 + Math.min(1, away / 600));
	let dx = 0;
	let dy = 0;
	if (away > stop && away > 0) {
		dx = (toX / away) * speed * dt;
		dy = (toY / away) * speed * dt;
	}
	if (away > 0) ally.angle = Math.atan2(toY, toX);
	advance(world, ally, dx + ally.vx * dt, dy + ally.vy * dt, false);
	ally.vx *= Math.exp(-5 * dt);
	ally.vy *= Math.exp(-5 * dt);
	ally.moving = dx !== 0 || dy !== 0;
	if (foe) allyAttack(world, ally, foe);
}

function firstReach(world: World, body: Body): number {
	const id = world.config.entities[body.def]?.moves[0];
	return (id ? world.config.moves[id]?.reach : undefined) ?? 30;
}

function allyAttack(world: World, ally: Body, foe: Body): void {
	const id = world.config.entities[ally.def]?.moves[0];
	const move = id ? world.config.moves[id] : undefined;
	if (!move || ally.cooldown > 0) return;
	const reach = move.reach + radiusOf(sizeOf(world, foe));
	const side = world.view === 'side';
	if (
		Math.hypot(foe.x - ally.x, side ? 0 : foe.y - ally.y) > reach ||
		(side && Math.abs(foe.y - ally.y) > 80)
	) {
		return;
	}
	ally.cooldown = cooldownOf(world, ally, move.cooldown);
	ally.pose = { pose: move.pose, left: move.seconds };
	if (move.sound) world.events.emit('sound', { id: move.sound });
	const hit = hitOf(world, ally, move.power, foe);
	if (hit.evaded) return;
	const push = Math.atan2(foe.y - ally.y, foe.x - ally.x);
	foe.vx = Math.cos(push) * move.push;
	foe.vy = side ? 0 : Math.sin(push) * move.push;
	world.damage(foe, hit.amount, ally, 'move');
}

// --- Hideouts ---------------------------------------------------------------------------------

/** Scatters the hideouts over the page (once, when the world is made). */
export function placeHideouts(world: World): Hideout[] {
	const pg = world.host.page();
	const vp = world.host.viewport();
	const places: Hideout[] = [];
	// On a small page there is room for fewer: all patches together cover at most a quarter of it.
	let room = pg.width * pg.height * MAX_COVER;
	for (const [def, hideout] of Object.entries(world.config.hideouts)) {
		for (let i = 0; i < hideout.count; i++) {
			const radius = between(world, hideout.radius);
			room -= Math.PI * radius * radius;
			if (room < 0) break;
			const x =
				HARD_EDGE + radius + world.random() * Math.max(0, pg.width - 2 * (HARD_EDGE + radius));
			const top = vp.top + HARD_EDGE + radius;
			const y = top + world.random() * Math.max(0, pg.height - top - HARD_EDGE - radius);
			places.push({ def, x, y, radius });
		}
	}
	return places;
}

/** A hidden spot inside a random hideout of this kind (undefined: there is none). */
export function hidingSpot(
	world: World,
	hideoutId: string
): { x: number; y: number; index: number } | undefined {
	const candidates = world.hideouts.flatMap((hideout, index) =>
		hideout.def === hideoutId ? [{ hideout, index }] : []
	);
	const pick = candidates[Math.floor(world.random() * candidates.length)];
	if (!pick) return undefined;
	const angle = world.random() * Math.PI * 2;
	const away = Math.sqrt(world.random()) * pick.hideout.radius * 0.7;
	return {
		x: pick.hideout.x + Math.cos(angle) * away,
		y: world.view === 'side' ? floorY(world) : pick.hideout.y + Math.sin(angle) * away,
		index: pick.index
	};
}

/** While the figure walks through a hideout, a hidden monster in it may jump out. */
export function tickHideouts(world: World, dt: number): void {
	const state = stateOf(world);
	if (world.time < state.encounterDue) return;
	const walker = world.riding ?? world.player;
	const moving = world.riding ? Math.abs(world.riding.speed) > 20 : world.player.moving;
	if (!moving) return;
	for (const body of world.bodies) {
		if (!body.hidden) continue;
		const place = world.hideouts[body.hideout];
		const definition: HideoutDefinition | undefined = place && world.config.hideouts[place.def];
		if (!place || !definition || distance(walker, place) > place.radius) continue;
		if (world.random() >= (definition.encounter / 100) * dt) continue;
		body.hidden = false;
		body.cooldown = Math.max(body.cooldown, 0.8);
		state.encounterDue = world.time + 1.5;
		world.events.emit('encounter', { body });
		return;
	}
}
