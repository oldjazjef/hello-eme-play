import type { Preset } from '../presets.js';
import { t } from '../dsl.js';
import { creature, icon, person, sprite, type CreatureOptions } from './art.js';
import { drop, monster, say, SOUNDS, spawn } from './helpers.js';

interface Critter {
	id: string;
	label: string;
	look: CreatureOptions;
	size: number;
	speed: number;
	behavior: 'flee' | 'wander' | 'chase';
	hide: string;
	rate: number;
	points: number;
	rare: boolean;
}

const CRITTERS: Critter[] = [
	{
		id: 'hopsi',
		label: 'Hopsi',
		look: { body: '#fde68a', feature: 'ears', accent: '#fda4af' },
		size: 42,
		speed: 140,
		behavior: 'flee',
		hide: 'grass',
		rate: 90,
		points: 50,
		rare: false
	},
	{
		id: 'zirp',
		label: 'Zirp',
		look: { body: '#fb923c', feature: 'wings', accent: '#f59e0b' },
		size: 40,
		speed: 160,
		behavior: 'flee',
		hide: 'grass',
		rate: 80,
		points: 60,
		rare: false
	},
	{
		id: 'kugel',
		label: 'Kugel',
		look: { body: '#84cc16', feature: 'antenna', accent: '#facc15', cyclops: true },
		size: 44,
		speed: 55,
		behavior: 'wander',
		hide: 'bush',
		rate: 100,
		points: 40,
		rare: false
	},
	{
		id: 'floss',
		label: 'Floss',
		look: { body: '#38bdf8', feature: 'fin', accent: '#0ea5e9', pattern: 'spots' },
		size: 46,
		speed: 90,
		behavior: 'flee',
		hide: 'water',
		rate: 75,
		points: 80,
		rare: false
	},
	{
		id: 'moos',
		label: 'Moos',
		look: { body: '#4ade80', feature: 'leaf', accent: '#16a34a', mood: 'sleepy' },
		size: 46,
		speed: 40,
		behavior: 'wander',
		hide: 'bush',
		rate: 95,
		points: 50,
		rare: false
	},
	{
		id: 'funkel',
		label: 'Funkel',
		look: { body: '#e879f9', feature: 'crown', accent: '#7e22ce', pattern: 'spots' },
		size: 48,
		speed: 170,
		behavior: 'flee',
		hide: 'grass',
		rate: 40,
		points: 250,
		rare: true
	},
	{
		id: 'tauch',
		label: 'Tauch',
		look: { body: '#0ea5e9', feature: 'shell', accent: '#1d4ed8', cyclops: true },
		size: 52,
		speed: 110,
		behavior: 'flee',
		hide: 'water',
		rate: 35,
		points: 300,
		rare: true
	},
	{
		id: 'goldi',
		label: 'Goldi',
		look: { body: '#facc15', feature: 'crown', accent: '#f97316', pattern: 'stripes' },
		size: 54,
		speed: 200,
		behavior: 'flee',
		hide: 'rocks',
		rate: 20,
		points: 800,
		rare: true
	}
];

const sprites: Record<string, Record<string, unknown>> = {
	ranger: sprite(person({ shirt: '#15803d', hat: 'hat', hatColor: '#a16207', holds: 'net' }), 56),
	netz: sprite(icon('ball', '#16a34a', '#fef08a'), 26),
	goldnetz: sprite(icon('ball', '#f59e0b', '#fef08a'), 28),
	pack: sprite(icon('box', '#16a34a', '#fef08a'), 32),
	goldpack: sprite(icon('box', '#f59e0b', '#fef9c3'), 32),
	apple: sprite(icon('apple', '#ef4444', '#4ade80'), 28),
	boots: sprite(icon('boot', '#a16207'), 30)
};
const entities: Record<string, Record<string, unknown>> = {
	hero: {
		kind: 'figure',
		label: 'Ranger',
		sprite: 'ranger',
		size: 56,
		stats: { hp: 100, attack: 1, defense: 0, speed: 215, dex: 0, luck: 0 },
		behavior: 'stand',
		moves: []
	}
};
const triggers: Record<string, unknown>[] = [
	{
		on: 'start',
		once: true,
		do: [say('Willkommen in der Safari-Zone! Fang so viele Tiere wie möglich: G Netz, T Goldnetz.')]
	},
	{ on: 'encounter', do: [say('Da raschelt etwas!')] },
	{ on: 'escape', do: [say('Entwischt!')] }
];
const rules: Record<string, unknown>[] = [];
for (const c of CRITTERS) {
	sprites[c.id] = sprite(creature(c.look), c.size);
	entities[c.id] = monster({
		label: c.label,
		sprite: c.id,
		size: c.size,
		hp: 6,
		attack: 1,
		speed: c.speed,
		behavior: c.behavior,
		moves: [],
		points: 0,
		extra: { catchRate: c.rate, hideIn: c.hide }
	});
	triggers.push({
		on: 'catch',
		only: c.id,
		do: [
			{ do: 'points', amount: c.points },
			say(
				c.rare ? `Selten! ${c.label} gefangen (+${c.points})` : `${c.label} gefangen (+${c.points})`
			)
		]
	});
	rules.push(c.rare ? spawn(c.id, [14, 22], [1, 1], 1, [2, 100]) : spawn(c.id, [7, 12], [1, 2], 3));
}

export const safari: Preset = {
	label: t('Safari-Zone (Tiere fangen)', 'Safari Zone (catch critters)'),
	description: t(
		'Ein Fang-Spiel ohne Kampf: Tiere verstecken sich in Gras, Büschen, Teich und Felsen und fliehen vor dir. Fang sie mit Netzen (G) und Goldnetzen (T) – seltene Tiere geben viele Punkte. Drei Zonen à 80 Sekunden.',
		'A catching game without fighting: critters hide in grass, bushes, pond and rocks and run from you. Catch them with nets (G) and gold nets (T) – rare ones give lots of points. Three zones of 80 seconds.'
	),
	config: {
		game: { lives: 1, partySize: 40 },
		visits: { enabled: false, whilePlaying: false },
		hideouts: {
			grass: {
				label: 'Hohes Gras',
				look: 'grass',
				count: 24,
				radius: { min: 70, max: 125 },
				encounter: 60
			},
			bush: {
				label: 'Büsche',
				look: 'bush',
				count: 9,
				radius: { min: 45, max: 75 },
				encounter: 55
			},
			water: {
				label: 'Teich',
				look: 'water',
				count: 3,
				radius: { min: 70, max: 110 },
				encounter: 45
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
		throwables: {
			netz: {
				label: 'Netz',
				sprite: 'netz',
				look: 'ball',
				size: 26,
				keys: ['KeyG'],
				where: 'foot',
				speed: 540,
				fuse: 0,
				radius: 0,
				power: 0,
				push: 0,
				breaks: false,
				cooldown: 0.45,
				catch: 55,
				ammo: 12,
				maxAmmo: 30,
				sound: 'throw'
			},
			goldnetz: {
				label: 'Goldnetz',
				sprite: 'goldnetz',
				look: 'ball',
				size: 28,
				keys: ['KeyT'],
				where: 'foot',
				speed: 560,
				fuse: 0,
				radius: 0,
				power: 0,
				push: 0,
				breaks: false,
				cooldown: 0.6,
				catch: 90,
				ammo: 3,
				maxAmmo: 8,
				sound: 'throw'
			}
		},
		items: {
			pack: {
				label: 'Netz-Päckchen',
				sprite: 'pack',
				size: 32,
				lifetime: 35,
				do: [{ do: 'ammo', throwable: 'netz', amount: 6 }, say('+6 Netze')]
			},
			goldpack: {
				label: 'Goldnetz',
				sprite: 'goldpack',
				size: 32,
				lifetime: 35,
				do: [{ do: 'ammo', throwable: 'goldnetz', amount: 2 }, say('+2 Goldnetze')]
			},
			apple: {
				label: 'Apfel',
				sprite: 'apple',
				size: 28,
				lifetime: 25,
				do: [
					{ do: 'stat', stat: 'speed', amount: 70, target: 'figure', seconds: 12 },
					say('Energie!')
				]
			},
			boots: {
				label: 'Wanderstiefel',
				sprite: 'boots',
				size: 30,
				lifetime: 25,
				do: [{ do: 'points', amount: 100 }]
			}
		},
		upgrades: {
			nets: {
				label: 'Netzvorrat',
				help: '+6 Netze',
				cost: 150,
				max: 6,
				do: [{ do: 'ammo', throwable: 'netz', amount: 6 }]
			},
			gold: {
				label: 'Goldnetze',
				help: '+2 Goldnetze',
				cost: 300,
				max: 4,
				do: [{ do: 'ammo', throwable: 'goldnetz', amount: 2 }]
			},
			shoes: { label: 'Wanderschuhe', help: '+25 Tempo', cost: 200, max: 3, stats: { speed: 25 } }
		},
		spawns: rules,
		itemSpawns: [
			drop('pack', [14, 24], 2),
			drop('goldpack', [35, 55], 1, [2, 100]),
			drop('apple', [30, 45], 1)
		],
		levels: [
			{ label: 'Zone 1: Die Wiese', goal: { type: 'survive', amount: 80 } },
			{ label: 'Zone 2: Teich und Büsche', goal: { type: 'survive', amount: 80 } },
			{ label: 'Zone 3: Die seltenen Tiere', goal: { type: 'survive', amount: 80 } }
		],
		triggers,
		texts: {
			keyboardHint:
				'Pfeiltasten oder WASD: laufen · G: Netz werfen · T: Goldnetz · U: Upgrades · Esc: beenden',
			sideHint:
				'Pfeiltasten oder WASD: laufen · G: Netz werfen · T: Goldnetz · U: Upgrades · Esc: beenden'
		},
		audio: {
			enabled: true,
			sounds: SOUNDS,
			events: {
				catch: 'catch',
				escape: 'escape',
				encounter: 'encounter',
				pickup: 'coin',
				levelUp: 'level'
			}
		}
	}
};
