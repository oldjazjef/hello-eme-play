import type { Preset } from '../presets.js';
import { t } from '../dsl.js';
import { creature, icon, person, sprite, type CreatureOptions } from './art.js';
import { drop, monster, MOVES, say, SOUNDS, spawn } from './helpers.js';

type Json = Record<string, unknown>;

/** The species: a look, stats, where it hides, and what it grows into. */
interface Species {
	id: string;
	label: string;
	look: CreatureOptions;
	size: number;
	hp: number;
	attack: number;
	speed: number;
	defense?: number;
	behavior: 'chase' | 'wander' | 'flee';
	move: string;
	hide?: string;
	into?: string;
	catchRate: number;
	/** Kills as a team member until it evolves. */
	kills?: number;
}

const SPECIES: Species[] = [
	// The starters (given by the three gifts on the ground) and their final forms.
	{
		id: 'flamey',
		label: 'Flamey',
		look: { body: '#f97316', feature: 'flame', accent: '#ef4444' },
		size: 54,
		hp: 34,
		attack: 7,
		speed: 120,
		behavior: 'wander',
		move: 'scratch',
		into: 'blazeon',
		catchRate: 100,
		kills: 4
	},
	{
		id: 'blazeon',
		label: 'Blazeon',
		look: { body: '#dc2626', feature: 'flame', accent: '#fde047', pattern: 'spots' },
		size: 70,
		hp: 70,
		attack: 15,
		speed: 140,
		behavior: 'wander',
		move: 'chomp',
		catchRate: 100
	},
	{
		id: 'aquip',
		label: 'Aquip',
		look: { body: '#38bdf8', feature: 'fin', accent: '#0ea5e9' },
		size: 54,
		hp: 38,
		attack: 6,
		speed: 110,
		behavior: 'wander',
		move: 'tackle',
		into: 'tidal',
		catchRate: 100,
		kills: 4
	},
	{
		id: 'tidal',
		label: 'Tidal',
		look: { body: '#0284c7', feature: 'fin', accent: '#1d4ed8', pattern: 'stripes' },
		size: 70,
		hp: 80,
		attack: 13,
		speed: 125,
		behavior: 'wander',
		move: 'slam',
		catchRate: 100
	},
	{
		id: 'leafo',
		label: 'Leafo',
		look: { body: '#4ade80', feature: 'leaf', accent: '#16a34a' },
		size: 54,
		hp: 36,
		attack: 6,
		speed: 105,
		behavior: 'wander',
		move: 'scratch',
		into: 'florant',
		catchRate: 100,
		kills: 4
	},
	{
		id: 'florant',
		label: 'Florant',
		look: { body: '#16a34a', feature: 'leaf', accent: '#f472b6', pattern: 'spots' },
		size: 72,
		hp: 75,
		attack: 14,
		speed: 120,
		behavior: 'wander',
		move: 'chomp',
		catchRate: 100
	},
	// Hiding in the tall grass.
	{
		id: 'rattly',
		label: 'Rattly',
		look: { body: '#a8a29e', feature: 'ears', accent: '#fda4af', pattern: 'stripes' },
		size: 46,
		hp: 9,
		attack: 3,
		speed: 95,
		behavior: 'chase',
		move: 'scratch',
		hide: 'grass',
		into: 'ratking',
		catchRate: 90,
		kills: 3
	},
	{
		id: 'ratking',
		label: 'Ratking',
		look: { body: '#78716c', feature: 'ears', accent: '#fb7185', fangs: true, mood: 'angry' },
		size: 64,
		hp: 40,
		attack: 9,
		speed: 115,
		behavior: 'chase',
		move: 'chomp',
		catchRate: 55
	},
	{
		id: 'chirpy',
		label: 'Chirpy',
		look: { body: '#fde68a', feature: 'wings', accent: '#f59e0b' },
		size: 44,
		hp: 7,
		attack: 2,
		speed: 150,
		behavior: 'flee',
		move: 'scratch',
		hide: 'grass',
		into: 'skyhawk',
		catchRate: 75,
		kills: 3
	},
	{
		id: 'skyhawk',
		label: 'Skyhawk',
		look: { body: '#f59e0b', feature: 'wings', accent: '#b45309', mood: 'angry' },
		size: 66,
		hp: 36,
		attack: 11,
		speed: 170,
		behavior: 'flee',
		move: 'chomp',
		catchRate: 40
	},
	{
		id: 'wiggle',
		label: 'Wiggle',
		look: { body: '#84cc16', feature: 'antenna', accent: '#facc15', cyclops: true },
		size: 44,
		hp: 8,
		attack: 2,
		speed: 60,
		behavior: 'wander',
		move: 'tackle',
		hide: 'grass',
		into: 'flutterby',
		catchRate: 100,
		kills: 3
	},
	{
		id: 'flutterby',
		label: 'Flutterby',
		look: { body: '#e879f9', feature: 'wings', accent: '#7e22ce', cyclops: true },
		size: 62,
		hp: 34,
		attack: 10,
		speed: 140,
		behavior: 'wander',
		move: 'scratch',
		catchRate: 60
	},
	// Hiding in the bushes.
	{
		id: 'fuzzo',
		label: 'Fuzzo',
		look: { body: '#c084fc', feature: 'ears', accent: '#f0abfc' },
		size: 48,
		hp: 12,
		attack: 3,
		speed: 70,
		behavior: 'wander',
		move: 'tackle',
		hide: 'bush',
		into: 'fuzzard',
		catchRate: 95,
		kills: 3
	},
	{
		id: 'fuzzard',
		label: 'Fuzzard',
		look: { body: '#7e22ce', feature: 'horns', accent: '#fbbf24', fangs: true },
		size: 68,
		hp: 48,
		attack: 12,
		speed: 100,
		behavior: 'chase',
		move: 'chomp',
		catchRate: 50
	},
	{
		id: 'nibble',
		label: 'Nibble',
		look: { body: '#fb7185', feature: 'ears', accent: '#fecdd3', fangs: true, mood: 'angry' },
		size: 42,
		hp: 10,
		attack: 5,
		speed: 130,
		behavior: 'chase',
		move: 'chomp',
		hide: 'bush',
		catchRate: 70
	},
	// Hiding at the pond.
	{
		id: 'bubbo',
		label: 'Bubbo',
		look: { body: '#7dd3fc', feature: 'fin', accent: '#38bdf8', pattern: 'spots' },
		size: 48,
		hp: 11,
		attack: 3,
		speed: 80,
		behavior: 'wander',
		move: 'tackle',
		hide: 'water',
		into: 'torrento',
		catchRate: 85,
		kills: 3
	},
	{
		id: 'torrento',
		label: 'Torrento',
		look: { body: '#0369a1', feature: 'spikes', accent: '#0ea5e9', fangs: true, mood: 'angry' },
		size: 70,
		hp: 52,
		attack: 13,
		speed: 110,
		behavior: 'chase',
		move: 'slam',
		catchRate: 45
	},
	// Hiding between the rocks.
	{
		id: 'pebbl',
		label: 'Pebbl',
		look: { body: '#a8a29e', feature: 'shell', accent: '#78716c', mood: 'sleepy' },
		size: 46,
		hp: 16,
		attack: 4,
		speed: 45,
		behavior: 'wander',
		move: 'tackle',
		hide: 'rocks',
		into: 'boulderon',
		catchRate: 80,
		kills: 3
	},
	{
		id: 'boulderon',
		label: 'Boulderon',
		look: { body: '#57534e', feature: 'spikes', accent: '#a8a29e', mood: 'angry' },
		size: 72,
		hp: 70,
		attack: 12,
		speed: 70,
		behavior: 'chase',
		move: 'slam',
		defense: 6,
		catchRate: 40
	}
];

const sprites: Record<string, Json> = {
	trainer: sprite(person({ shirt: '#dc2626', hat: 'cap', hatColor: '#dc2626', holds: 'ball' }), 56),
	granito: sprite(
		creature({ body: '#57534e', feature: 'spikes', accent: '#a8a29e', mood: 'angry', fangs: true }),
		110
	),
	ememball: sprite(icon('ball', '#ef4444'), 26),
	superball: sprite(icon('ball', '#2563eb', '#fde047'), 26),
	masterball: sprite(icon('ball', '#7c3aed', '#fde047'), 28)
};
const entities: Record<string, Json> = {
	hero: {
		kind: 'figure',
		label: 'Trainer',
		sprite: 'trainer',
		size: 56,
		stats: { hp: 100, attack: 1, defense: 0, speed: 210, dex: 0, luck: 0 },
		behavior: 'stand',
		moves: []
	},
	granito: monster({
		label: 'Arenaleiter Granito',
		sprite: 'granito',
		size: 110,
		hp: 180,
		attack: 14,
		defense: 4,
		speed: 70,
		moves: ['slam'],
		points: 1500,
		extra: {
			boss: true,
			catchRate: 0,
			phases: [
				{ below: 50, label: 'Granito stampft auf!', stats: { attack: 6, speed: 25 } },
				{
					below: 25,
					label: 'Granito ruft seine Pebbls!',
					do: [{ do: 'spawn', entity: 'pebbl', count: 3, where: 'near' }]
				}
			]
		}
	})
};
const spawns: Record<string, Json>[] = [];
const rules: Json[] = [];
for (const s of SPECIES) {
	sprites[s.id] = sprite(creature(s.look), s.size);
	entities[s.id] = monster({
		label: s.label,
		sprite: s.id,
		size: s.size,
		hp: s.hp,
		attack: s.attack,
		defense: s.defense ?? 0,
		speed: s.speed,
		behavior: s.behavior,
		moves: [s.move],
		points: 20,
		extra: {
			catchRate: s.catchRate,
			...(s.hide ? { hideIn: s.hide } : {}),
			...(s.into ? { evolve: { kills: s.kills ?? 3, maxLevel: 1, into: s.into } } : {})
		}
	});
}
void spawns;

const wild: [string, [number, number], [number, number], number, [number, number]][] = [
	['rattly', [6, 10], [1, 2], 5, [1, 100]],
	['chirpy', [8, 12], [1, 2], 4, [1, 100]],
	['wiggle', [10, 16], [1, 1], 3, [1, 100]],
	['fuzzo', [8, 14], [1, 2], 4, [1, 100]],
	['nibble', [14, 20], [1, 1], 3, [2, 100]],
	['bubbo', [8, 14], [1, 2], 4, [1, 100]],
	['pebbl', [9, 15], [1, 2], 4, [2, 100]]
];
for (const [id, every, count, max, levels] of wild)
	rules.push(spawn(id, every, count, max, levels));
rules.push(spawn('granito', [5, 5], [1, 1], 1, [3, 100]));

const ball = (
	label: string,
	look: string,
	strength: number,
	key: string,
	ammo: number,
	max: number
) => ({
	label,
	look: 'ball',
	sprite: look,
	size: 24,
	keys: [key],
	where: 'foot',
	speed: 560,
	fuse: 0,
	radius: 0,
	power: 0,
	push: 0,
	breaks: false,
	cooldown: 0.5,
	catch: strength,
	ammo,
	maxAmmo: max,
	sound: 'throw'
});

const pickup = (
	label: string,
	image: string,
	size: number,
	effect: Json[],
	lifetime = 40,
	how: 'touch' | 'use' = 'touch'
) => ({
	label,
	sprite: image,
	size,
	pickup: how,
	lifetime,
	do: effect
});
sprites.potion = sprite(icon('potion', '#ec4899'), 28);
sprites.elixir = sprite(icon('flask', '#a78bfa'), 28);
sprites.ballpack = sprite(icon('box', '#f97316'), 30);
sprites.superpack = sprite(icon('box', '#3b82f6', '#fde047'), 30);
sprites.masterbox = sprite(icon('box', '#7c3aed', '#fde047'), 32);
sprites.gift = sprite(icon('box', '#fb7185', '#fef08a'), 34);

const starter = (id: string, text: string): Json =>
	pickup(
		`Starter: ${String(entities[id] && (entities[id] as Json).label)}`,
		'gift',
		34,
		[{ do: 'recruit', entity: id }, say(text)],
		0,
		'use'
	);

export const ememons: Preset = {
	label: t('Ememons (Monster fangen)', 'Ememons (catch monsters)'),
	description: t(
		'Ein Pokémon-Klon: Wilde Ememons verstecken sich im hohen Gras, in Büschen, am Teich und zwischen Felsen. Fang sie mit Bällen (G, T, B), rufe dein Team mit R, lass sie kämpfen und sich entwickeln, und besiege den Arenaleiter.',
		'A Pokémon-style game: wild Ememons hide in tall grass, bushes, at the pond and between rocks. Catch them with balls (G, T, B), call your team with R, let them fight and evolve, and beat the gym leader.'
	),
	config: {
		view: { mode: 'topdown' },
		game: { lives: 3, partySize: 6, breakPoints: 5 },
		visits: { enabled: false, whilePlaying: false },
		hideouts: {
			grass: {
				label: 'Hohes Gras',
				look: 'grass',
				count: 22,
				radius: { min: 70, max: 130 },
				encounter: 55
			},
			bush: {
				label: 'Büsche',
				look: 'bush',
				count: 8,
				radius: { min: 45, max: 75 },
				encounter: 50
			},
			water: {
				label: 'Teich',
				look: 'water',
				count: 3,
				radius: { min: 70, max: 110 },
				encounter: 40
			},
			rocks: {
				label: 'Felsen',
				look: 'rocks',
				count: 6,
				radius: { min: 50, max: 90 },
				encounter: 45
			}
		},
		sprites,
		entities,
		moves: MOVES,
		throwables: {
			ememball: ball('Ememball', 'ememball', 38, 'KeyG', 8, 30),
			superball: ball('Superball', 'superball', 65, 'KeyT', 2, 10),
			masterball: ball('Meisterball', 'masterball', 100, 'KeyB', 0, 3)
		},
		items: {
			giftFlamey: starter('flamey', 'Du hast Flamey bekommen! Drücke R, um es zu rufen.'),
			giftAquip: starter('aquip', 'Du hast Aquip bekommen! Drücke R, um es zu rufen.'),
			giftLeafo: starter('leafo', 'Du hast Leafo bekommen! Drücke R, um es zu rufen.'),
			ballpack: pickup('Ball-Päckchen', 'ballpack', 30, [
				{ do: 'ammo', throwable: 'ememball', amount: 5 },
				say('+5 Emembälle')
			]),
			superpack: pickup('Superball-Päckchen', 'superpack', 30, [
				{ do: 'ammo', throwable: 'superball', amount: 2 },
				say('+2 Superbälle')
			]),
			masterbox: pickup('Meisterball', 'masterbox', 32, [
				{ do: 'ammo', throwable: 'masterball', amount: 1 },
				say('Ein Meisterball! Er fängt alles.')
			]),
			potion: pickup('Trank', 'potion', 28, [
				{ do: 'healParty', amount: 50 },
				{ do: 'heal', amount: 30 },
				say('Das Team wurde geheilt.')
			]),
			elixir: pickup('Elixier', 'elixir', 28, [
				{ do: 'healParty', amount: 100 },
				say('Das ganze Team ist wieder fit!')
			])
		},
		upgrades: {
			belt: {
				label: 'Ballgürtel',
				help: '+6 Emembälle',
				cost: 100,
				max: 6,
				do: [{ do: 'ammo', throwable: 'ememball', amount: 6 }]
			},
			superSet: {
				label: 'Superball-Set',
				help: '+2 Superbälle',
				cost: 250,
				max: 4,
				minLevel: 2,
				do: [{ do: 'ammo', throwable: 'superball', amount: 2 }]
			},
			care: {
				label: 'Pflegeset',
				help: 'Team komplett heilen',
				cost: 120,
				max: 12,
				do: [{ do: 'healParty', amount: 100 }]
			},
			shoes: { label: 'Laufschuhe', help: '+20 Tempo', cost: 150, max: 3, stats: { speed: 20 } },
			pack: { label: 'Rucksack', help: '+25 Leben', cost: 200, max: 3, stats: { hp: 25 } }
		},
		spawns: rules,
		itemSpawns: [
			drop('ballpack', [12, 22], 2),
			drop('potion', [25, 40], 1),
			drop('superpack', [40, 60], 1, [2, 100]),
			drop('elixir', [40, 60], 1, [2, 100]),
			drop('masterbox', [60, 90], 1, [3, 100])
		],
		levels: [
			{ label: 'Route 1: Die Wiese', goal: { type: 'score', amount: 600 } },
			{ label: 'Route 2: Teich und Felsen', goal: { type: 'score', amount: 1400 } },
			{ label: 'Arena: Arenaleiter Granito', goal: { type: 'boss', amount: 1 } }
		],
		triggers: [
			{
				on: 'start',
				do: [
					say('Willkommen bei Ememons! Such dir ein Starter-Geschenk aus (F nimmt es auf).'),
					{ do: 'dropItem', item: 'giftFlamey' },
					{ do: 'dropItem', item: 'giftAquip' },
					{ do: 'dropItem', item: 'giftLeafo' }
				],
				once: true
			},
			{ on: 'encounter', do: [say('Ein wildes Ememon springt hervor!')] },
			{
				on: 'catch',
				do: [{ do: 'points', amount: 100 }, say('Gefangen! Es ist jetzt in deinem Team.')]
			},
			{ on: 'escape', do: [say('Mist, es hat sich befreit!')] },
			{
				on: 'evolve',
				do: [say('Dein Ememon hat sich entwickelt!'), { do: 'points', amount: 150 }]
			},
			{ on: 'faint', do: [say('Dein Ememon ist ohnmächtig. Ein Trank oder Elixier hilft!')] },
			{
				on: 'kill',
				only: 'granito',
				do: [say('Du hast den Arenaleiter besiegt!'), { do: 'points', amount: 1000 }]
			}
		],
		texts: {
			keyboardHint:
				'Pfeiltasten oder WASD: laufen · G, T, B: Bälle werfen · R: nächstes Teammitglied rufen · F: aufheben · U: Upgrades · Esc: beenden',
			sideHint:
				'Pfeiltasten oder WASD: laufen · G, T, B: Bälle werfen · R: nächstes Teammitglied rufen · F: aufheben · U: Upgrades · Esc: beenden'
		},
		audio: {
			enabled: true,
			sounds: SOUNDS,
			events: {
				catch: 'catch',
				escape: 'escape',
				encounter: 'encounter',
				evolve: 'evolve',
				faint: 'faint',
				pickup: 'coin',
				levelUp: 'level',
				throw: 'throw'
			}
		}
	}
};
