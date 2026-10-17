import type { Preset } from '../presets.js';
import { t } from '../dsl.js';
import { creature, icon, person, sprite, vehicle } from './art.js';
import { drop, monster, MOVES, say, SOUNDS, spawn } from './helpers.js';

const rig = (
	label: string,
	kind: Parameters<typeof vehicle>[0],
	color: string,
	size: number,
	stats: Record<string, number>,
	extra: Record<string, unknown>
) => ({
	entity: {
		kind: 'vehicle',
		label,
		sprite: `v-${label}`,
		size,
		behavior: 'arrive',
		stats: { defense: 0, ...stats },
		moves: [],
		absorbs: true,
		...extra
	},
	picture: sprite(vehicle(kind, color), size, 'right', true)
});

const FLEET = {
	Rammer: rig(
		'Rammer',
		'car',
		'#dc2626',
		92,
		{ hp: 220, attack: 5, defense: 3, speed: 400, accel: 520, handling: 3 },
		{ ram: { power: 2.2, minSpeed: 80 } }
	),
	Drifter: rig(
		'Drifter',
		'sports',
		'#3b82f6',
		96,
		{ hp: 130, attack: 4, speed: 560, accel: 700, handling: 4.4 },
		{ drive: { grip: 8, slideGrip: 0.8, reverse: 110 }, ram: { power: 1.4, minSpeed: 100 } }
	),
	Monstertruck: rig(
		'Monstertruck',
		'monster',
		'#16a34a',
		112,
		{ hp: 420, attack: 8, defense: 8, speed: 300, accel: 260, handling: 1.8 },
		{ drive: { brake: 500, roll: 140, slideGrip: 3 }, ram: { power: 4, minSpeed: 70 } }
	),
	Bulldozer: rig(
		'Bulldozer',
		'tank',
		'#f59e0b',
		112,
		{ hp: 700, attack: 10, defense: 14, speed: 220, accel: 200, handling: 1.2 },
		{ drive: { brake: 650, roll: 220, grip: 70 }, ram: { power: 6, minSpeed: 60 } }
	)
};

const sprites: Record<string, Record<string, unknown>> = {
	mechanic: sprite(
		person({ shirt: '#f97316', hat: 'cap', hatColor: '#334155', holds: 'wrench' }),
		56
	),
	junkbot: sprite(
		creature({ body: '#94a3b8', feature: 'antenna', accent: '#ef4444', mood: 'angry' }),
		46
	),
	sparkbot: sprite(
		creature({ body: '#fbbf24', feature: 'antenna', accent: '#7c2d12', cyclops: true }),
		50
	),
	crusher: sprite(
		creature({ body: '#475569', feature: 'horns', accent: '#f97316', mood: 'angry', fangs: true }),
		84
	),
	titan: sprite(
		creature({
			body: '#334155',
			feature: 'crown',
			accent: '#ef4444',
			mood: 'angry',
			fangs: true,
			pattern: 'stripes'
		}),
		130
	),
	mine: sprite(icon('bomb', '#7f1d1d', '#fde047'), 30),
	bomb: sprite(icon('bomb', '#334155'), 28),
	spark: sprite(icon('bolt', '#fbbf24'), 22),
	nitro: sprite(icon('bolt', '#22d3ee'), 30),
	kit: sprite(icon('box', '#ffffff', '#dc2626'), 32),
	minebox: sprite(icon('box', '#dc2626', '#fde047'), 32),
	cog: sprite(icon('gem', '#fbbf24'), 26)
};
const entities: Record<string, Record<string, unknown>> = {
	hero: {
		kind: 'figure',
		label: 'Mechaniker',
		sprite: 'mechanic',
		size: 56,
		stats: { hp: 100, attack: 1, defense: 0, speed: 210, dex: 0, luck: 0 },
		behavior: 'stand',
		moves: ['punch', 'kick']
	},
	junkbot: monster({
		label: 'Schrottbot',
		sprite: 'junkbot',
		size: 46,
		hp: 4,
		attack: 6,
		speed: 85,
		points: 50,
		extra: { breed: { every: { min: 14, max: 22 }, count: { min: 1, max: 1 }, max: 8 } }
	}),
	sparkbot: monster({
		label: 'Funkenbot',
		sprite: 'sparkbot',
		hp: 7,
		attack: 6,
		speed: 60,
		behavior: 'wander',
		points: 120,
		drops: [{ item: 'nitro', chance: 25 }],
		extra: { throws: [{ throwable: 'funke', range: 360, cooldown: 3 }] }
	}),
	crusher: monster({
		label: 'Brecher',
		sprite: 'crusher',
		size: 84,
		hp: 45,
		attack: 18,
		defense: 6,
		speed: 60,
		moves: ['slam'],
		points: 300,
		drops: [
			{ item: 'kit', chance: 40 },
			{ item: 'minebox', chance: 30 }
		]
	}),
	titan: monster({
		label: 'Schrott-Titan',
		sprite: 'titan',
		size: 130,
		hp: 320,
		attack: 22,
		defense: 6,
		speed: 65,
		moves: ['slam'],
		points: 4000,
		extra: {
			boss: true,
			throws: [{ throwable: 'schrottbombe', range: 520, cooldown: 2.4 }],
			breed: { every: { min: 9, max: 9 }, count: { min: 2, max: 2 }, max: 10, into: 'junkbot' },
			phases: [
				{ below: 50, label: 'Der Titan läuft heiss!', stats: { attack: 10, speed: 25 } },
				{
					below: 25,
					label: 'Der Titan ruft Brecher!',
					do: [{ do: 'spawn', entity: 'crusher', count: 2, where: 'edge' }]
				}
			]
		}
	})
};
for (const [id, rigged] of Object.entries(FLEET)) {
	entities[id] = rigged.entity;
	sprites[`v-${id}`] = rigged.picture;
}

export const derby: Preset = {
	label: t('Schrottplatz-Derby (Fahrzeugkampf)', 'Scrapyard Derby (vehicle battle)'),
	description: t(
		'Vier Fahrzeuge, die Treffer für dich einstecken und irgendwann zu Schrott gehen: Rammer, Drifter, Monstertruck und Bulldozer. Rammen, Bomben (G) vorn und Minen (M) hinten gegen Schrottbots, bis der Schrott-Titan kommt.',
		'Four vehicles that take hits for you and eventually go to scrap: Rammer, Drifter, Monster Truck and Bulldozer. Ram, throw bombs (G) forward and drop mines (M) behind you against scrapbots until the Scrap Titan arrives.'
	),
	config: {
		game: { lives: 3, overrunSpeed: 100, breakPoints: 40 },
		visits: {
			enabled: true,
			vehicle: 'Rammer',
			whilePlaying: true,
			delay: { min: 2, max: 3 },
			playDelay: { min: 5, max: 9 }
		},
		sprites,
		entities,
		moves: MOVES,
		throwables: {
			bombe: {
				label: 'Bombe',
				sprite: 'bomb',
				look: 'bomb',
				size: 28,
				keys: ['KeyG'],
				where: 'vehicle',
				direction: 'front',
				speed: 380,
				fuse: 1.4,
				bounce: 0.3,
				radius: 120,
				power: 7,
				push: 520,
				breaks: true,
				cooldown: 0.7,
				ammo: 4,
				maxAmmo: 12,
				sound: 'throw',
				explodeSound: 'boom'
			},
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
				breaks: true,
				cooldown: 0.5,
				ammo: 3,
				maxAmmo: 10,
				sound: 'throw',
				explodeSound: 'boom'
			},
			funke: {
				label: 'Funke',
				sprite: 'spark',
				look: 'bomb',
				size: 22,
				speed: 380,
				fuse: 1,
				radius: 55,
				power: 2.2,
				ammo: 1,
				maxAmmo: 1,
				breaks: false,
				where: 'foot'
			},
			schrottbombe: {
				label: 'Schrottbombe',
				sprite: 'bomb',
				look: 'bomb',
				size: 30,
				speed: 340,
				fuse: 1.3,
				radius: 90,
				power: 3,
				breaks: true,
				ammo: 1,
				maxAmmo: 1,
				where: 'foot'
			}
		},
		items: {
			nitro: {
				label: 'Nitro',
				sprite: 'nitro',
				size: 30,
				lifetime: 25,
				do: [
					{ do: 'stat', stat: 'speed', amount: 200, target: 'vehicle', seconds: 7 },
					say('Nitro!')
				]
			},
			kit: {
				label: 'Werkzeugkasten',
				sprite: 'kit',
				size: 32,
				lifetime: 30,
				do: [
					{ do: 'heal', amount: 50 },
					{ do: 'stat', stat: 'defense', amount: 10, target: 'vehicle', seconds: 15 },
					say('Verstärkt!')
				]
			},
			minebox: {
				label: 'Minenkiste',
				sprite: 'minebox',
				size: 32,
				lifetime: 30,
				do: [
					{ do: 'ammo', throwable: 'mine', amount: 3 },
					{ do: 'ammo', throwable: 'bombe', amount: 2 },
					say('Neue Munition')
				]
			},
			cog: {
				label: 'Zahnrad',
				sprite: 'cog',
				size: 26,
				lifetime: 25,
				do: [{ do: 'points', amount: 150 }]
			}
		},
		upgrades: {
			engine: {
				label: 'Motor',
				help: '+40 Tempo und Beschleunigung, alle Fahrzeuge',
				cost: 220,
				max: 4,
				vehicle: true,
				stats: { speed: 40, accel: 60 }
			},
			plates: {
				label: 'Panzerplatten',
				help: '+4 Verteidigung, alle Fahrzeuge',
				cost: 240,
				max: 5,
				vehicle: true,
				stats: { defense: 4 }
			},
			bombs: {
				label: 'Munition',
				help: '+3 Bomben, +2 Minen',
				cost: 160,
				max: 6,
				do: [
					{ do: 'ammo', throwable: 'bombe', amount: 3 },
					{ do: 'ammo', throwable: 'mine', amount: 2 }
				]
			},
			boots: {
				label: 'Sicherheitsschuhe',
				help: '+20 Tempo und +20 Leben zu Fuss',
				cost: 120,
				max: 3,
				stats: { speed: 20, hp: 20 }
			}
		},
		spawns: [
			spawn('junkbot', [4, 7], [2, 3], 12, [1, 100], 8),
			spawn('sparkbot', [10, 16], [1, 1], 4, [2, 100]),
			spawn('crusher', [18, 28], [1, 1], 3, [3, 100]),
			spawn('Drifter', [30, 45], [1, 1], 1),
			spawn('Monstertruck', [45, 65], [1, 1], 1, [2, 100]),
			spawn('Bulldozer', [55, 75], [1, 1], 1, [3, 100]),
			spawn('titan', [4, 4], [1, 1], 1, [4, 100])
		],
		itemSpawns: [
			drop('nitro', [22, 36], 1),
			drop('kit', [30, 50], 1),
			drop('minebox', [26, 44], 1),
			drop('cog', [10, 18], 3)
		],
		levels: [
			{ label: 'Runde 1: Aufwärmen', goal: { type: 'kills', amount: 20 } },
			{ label: 'Runde 2: Funken fliegen', goal: { type: 'score', amount: 1600 } },
			{ label: 'Runde 3: Brecher-Zone', goal: { type: 'survive', amount: 60 } },
			{ label: 'Finale: Der Schrott-Titan', goal: { type: 'boss', amount: 1 } }
		],
		triggers: [
			{
				on: 'start',
				once: true,
				do: [say('F: einsteigen. G: Bombe nach vorn, M: Mine nach hinten.')]
			},
			{ on: 'exitVehicle', do: [say('Fahrzeug verlassen. Such dir ein neues!')] },
			{
				on: 'kill',
				only: 'titan',
				do: [say('Der Schrott-Titan ist Altmetall!'), { do: 'points', amount: 3000 }]
			}
		],
		texts: {
			keyboardHint:
				'Pfeiltasten oder WASD: laufen · F: einsteigen · G: Bombe nach vorn · M: Mine nach hinten · Leertaste: driften · Esc: aussteigen',
			sideHint:
				'Pfeiltasten oder WASD: laufen · F: einsteigen · G: Bombe nach vorn · M: Mine nach hinten · Leertaste: driften · Esc: aussteigen'
		},
		audio: {
			enabled: true,
			sounds: SOUNDS,
			events: { kill: 'hit', pickup: 'coin', levelUp: 'level', explode: 'boom' }
		}
	}
};
