import type { Preset } from '../presets.js';
import { t } from '../dsl.js';
import { creature, icon, person, sprite, vehicle } from './art.js';
import { drop, monster, MOVES, say, SOUNDS, spawn } from './helpers.js';

const car = (
	label: string,
	kind: Parameters<typeof vehicle>[0],
	color: string,
	size: number,
	stats: Record<string, number>,
	extra: Record<string, unknown> = {}
) => ({
	kind: 'vehicle',
	label,
	sprite: `v-${label}`,
	size,
	behavior: 'arrive',
	stats: { defense: 0, ...stats },
	moves: [],
	...extra,
	_look: { kind, color }
});

const FLEET = {
	Schrottkarre: car('Schrottkarre', 'car', '#ef4444', 92, {
		hp: 100,
		attack: 3,
		speed: 420,
		accel: 520,
		handling: 3
	}),
	Rennwagen: car(
		'Rennwagen',
		'sports',
		'#3b82f6',
		96,
		{ hp: 70, attack: 3, speed: 600, accel: 720, handling: 4.4 },
		{
			drive: { grip: 11, slideGrip: 1, reverse: 110, brake: 1100 },
			ram: { power: 0.8, minSpeed: 0 }
		}
	),
	Mofa: car(
		'Mofa',
		'bike',
		'#22c55e',
		78,
		{ hp: 40, attack: 2, speed: 520, accel: 900, handling: 5.5 },
		{ drive: { reverse: 70, grip: 55, brake: 1500 }, ram: { power: 0.5, minSpeed: 0 } }
	),
	Lastwagen: car(
		'Lastwagen',
		'truck',
		'#f59e0b',
		118,
		{ hp: 420, attack: 7, defense: 10, speed: 300, accel: 240, handling: 1.5 },
		{
			drive: { brake: 450, roll: 130, slideGrip: 3 },
			ram: { power: 3.5, minSpeed: 90 },
			absorbs: true
		}
	),
	Panzer: car(
		'Panzer',
		'tank',
		'#65a30d',
		112,
		{ hp: 650, attack: 9, defense: 15, speed: 230, accel: 200, handling: 1.3 },
		{ drive: { brake: 600, roll: 200, grip: 60 }, ram: { power: 5, minSpeed: 70 }, absorbs: true }
	)
};

const sprites: Record<string, Record<string, unknown>> = {
	fahrer: sprite(
		person({ shirt: '#f59e0b', hat: 'cap', hatColor: '#334155', holds: 'wrench' }),
		56
	),
	schlurfer: sprite(
		creature({ body: '#84cc16', mood: 'sleepy', feature: 'none', belly: '#d9f99d' }),
		52
	),
	sprinter: sprite(
		creature({ body: '#fb923c', mood: 'angry', feature: 'ears', accent: '#fed7aa', fangs: true }),
		48
	),
	polizist: sprite(
		creature({ body: '#2563eb', feature: 'crown', accent: '#facc15', mood: 'angry' }),
		58
	),
	hog: sprite(
		creature({ body: '#b91c1c', feature: 'horns', accent: '#fde047', fangs: true, mood: 'angry' }),
		120
	),
	mine: sprite(icon('bomb', '#7f1d1d', '#fde047'), 30),
	ziegel: sprite(icon('rock', '#b45309'), 20),
	nitro: sprite(icon('bolt', '#22d3ee'), 30),
	minenbox: sprite(icon('box', '#dc2626', '#fde047'), 32),
	schluessel: sprite(icon('heart', '#f472b6'), 28)
};
const entities: Record<string, Record<string, unknown>> = {
	hero: {
		kind: 'figure',
		label: 'Fahrer',
		sprite: 'fahrer',
		size: 56,
		stats: { hp: 100, attack: 1, defense: 0, speed: 210, dex: 0, luck: 0 },
		behavior: 'stand',
		moves: ['punch', 'kick']
	},
	schlurfer: monster({
		label: 'Schlurfer',
		sprite: 'schlurfer',
		hp: 4,
		attack: 5,
		speed: 45,
		behavior: 'wander',
		points: 40
	}),
	sprinter: monster({
		label: 'Sprinter',
		sprite: 'sprinter',
		size: 48,
		hp: 3,
		attack: 7,
		speed: 130,
		points: 80
	}),
	polizist: monster({
		label: 'Bullenbot',
		sprite: 'polizist',
		hp: 14,
		attack: 6,
		defense: 3,
		speed: 70,
		points: 200,
		drops: [{ item: 'minenbox', chance: 30 }],
		extra: { throws: [{ throwable: 'ziegel', range: 360, cooldown: 3.5 }] }
	}),
	hog: monster({
		label: 'Roadhog',
		sprite: 'hog',
		size: 120,
		hp: 260,
		attack: 16,
		defense: 5,
		speed: 85,
		moves: ['slam'],
		points: 2500,
		extra: {
			boss: true,
			phases: [
				{ below: 60, label: 'Roadhog dreht auf!', stats: { speed: 30, attack: 6 } },
				{
					below: 30,
					label: 'Roadhog ruft Sprinter!',
					do: [{ do: 'spawn', entity: 'sprinter', count: 5, where: 'edge' }]
				}
			]
		}
	})
};
for (const [id, fleet] of Object.entries(FLEET)) {
	const { _look: look, ...entity } = fleet;
	sprites[`v-${id}`] = sprite(vehicle(look.kind, look.color), Number(entity.size), 'right', true);
	entities[id] = entity;
}

export const roadrage: Preset = {
	label: t('Road Rage (Fahrzeuge)', 'Road Rage (vehicles)'),
	description: t(
		'Steig in Schrottkarre, Rennwagen, Mofa, Laster oder Panzer, die sich völlig anders fahren und einstecken. Überfahre Schlurfer, leg Minen (M) hinter dir und besiege Roadhog.',
		'Hop into a banger, race car, moped, truck or tank that all handle and take hits differently. Run over shamblers, drop mines (M) behind you and beat Roadhog.'
	),
	config: {
		game: { lives: 3, overrunSpeed: 120 },
		visits: {
			enabled: true,
			vehicle: 'Schrottkarre',
			whilePlaying: true,
			delay: { min: 2, max: 3 },
			playDelay: { min: 6, max: 12 }
		},
		sprites,
		entities,
		moves: MOVES,
		throwables: {
			mine: {
				label: 'Mine',
				sprite: 'mine',
				look: 'mine',
				size: 30,
				keys: ['KeyM'],
				where: 'vehicle',
				direction: 'back',
				speed: 0,
				fuse: 0,
				radius: 105,
				power: 9,
				push: 600,
				cooldown: 0.5,
				ammo: 3,
				maxAmmo: 10,
				sound: 'throw',
				explodeSound: 'boom'
			},
			ziegel: {
				label: 'Ziegel',
				sprite: 'ziegel',
				look: 'rock',
				size: 20,
				speed: 480,
				fuse: 0,
				radius: 0,
				power: 1.5,
				push: 200,
				breaks: false,
				ammo: 1,
				maxAmmo: 1,
				where: 'foot'
			},
			stein: {
				label: 'Stein',
				sprite: 'ziegel',
				look: 'rock',
				size: 20,
				keys: ['KeyT'],
				where: 'foot',
				speed: 520,
				fuse: 0,
				radius: 0,
				power: 2,
				push: 260,
				breaks: false,
				cooldown: 0.45,
				unlimited: true
			}
		},
		items: {
			nitro: {
				label: 'Nitro',
				sprite: 'nitro',
				size: 30,
				lifetime: 25,
				do: [
					{ do: 'stat', stat: 'speed', amount: 180, target: 'vehicle', seconds: 8 },
					say('Nitro!')
				]
			},
			minenbox: {
				label: 'Minenkiste',
				sprite: 'minenbox',
				size: 32,
				lifetime: 30,
				do: [{ do: 'ammo', throwable: 'mine', amount: 3 }, say('+3 Minen')]
			},
			herz: {
				label: 'Flickzeug',
				sprite: 'schluessel',
				size: 28,
				lifetime: 25,
				do: [{ do: 'heal', amount: 40 }]
			}
		},
		upgrades: {
			engine: {
				label: 'Motor',
				help: '+40 Tempo, +60 Beschleunigung für alle Fahrzeuge',
				cost: 220,
				max: 4,
				vehicle: true,
				stats: { speed: 40, accel: 60 }
			},
			plating: {
				label: 'Panzerung',
				help: '+5 Verteidigung für alle Fahrzeuge',
				cost: 260,
				max: 4,
				vehicle: true,
				stats: { defense: 5 }
			},
			mines: {
				label: 'Minen-Nachschub',
				help: '+3 Minen',
				cost: 150,
				max: 5,
				do: [{ do: 'ammo', throwable: 'mine', amount: 3 }]
			},
			shoes: {
				label: 'Laufschuhe',
				help: '+20 Tempo zu Fuss',
				cost: 120,
				max: 2,
				stats: { speed: 20 }
			}
		},
		spawns: [
			spawn('schlurfer', [4, 7], [2, 4], 12),
			spawn('sprinter', [9, 14], [1, 2], 5, [2, 100]),
			spawn('polizist', [16, 24], [1, 1], 3, [3, 100]),
			spawn('Rennwagen', [40, 60], [1, 1], 1, [1, 100]),
			spawn('Mofa', [35, 55], [1, 1], 1, [1, 100]),
			spawn('Lastwagen', [60, 80], [1, 1], 1, [2, 100]),
			spawn('Panzer', [70, 90], [1, 1], 1, [3, 100]),
			spawn('hog', [4, 4], [1, 1], 1, [4, 100])
		],
		itemSpawns: [
			drop('nitro', [25, 40], 1),
			drop('minenbox', [30, 50], 1),
			drop('herz', [35, 55], 1)
		],
		levels: [
			{ label: 'Innenstadt', goal: { type: 'score', amount: 800 } },
			{ label: 'Autobahn', goal: { type: 'kills', amount: 25 } },
			{ label: 'Rush Hour', goal: { type: 'survive', amount: 60 } },
			{ label: 'Roadhogs Schrottplatz', goal: { type: 'boss', amount: 1 } }
		],
		triggers: [
			{
				on: 'start',
				once: true,
				do: [say('F: einsteigen. Fahrzeuge wechseln: aussteigen und ein anderes nehmen!')]
			},
			{ on: 'enterVehicle', do: [say('Los gehts!')] },
			{ on: 'kill', only: 'hog', do: [say('Roadhog ist platt!'), { do: 'points', amount: 2000 }] }
		],
		texts: {
			keyboardHint:
				'Pfeiltasten oder WASD: laufen · F: einsteigen · im Fahrzeug: Gas, Bremse, lenken, Leertaste driften, M: Mine hinten legen · Esc: beenden',
			sideHint:
				'Pfeiltasten oder WASD: laufen · F: einsteigen · im Fahrzeug: Gas, Bremse, lenken, Leertaste driften, M: Mine hinten legen · Esc: beenden'
		},
		audio: {
			enabled: true,
			sounds: SOUNDS,
			events: { kill: 'hit', pickup: 'coin', levelUp: 'level', explode: 'boom' }
		}
	}
};
