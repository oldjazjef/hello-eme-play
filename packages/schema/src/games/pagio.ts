import type { Preset } from '../presets.js';
import { t } from '../dsl.js';
import { creature, icon, person, sprite } from './art.js';
import { drop, monster, MOVES, say, SOUNDS, spawn } from './helpers.js';

export const pagio: Preset = {
	label: t('Super Pagio (Jump & Run)', 'Super Pagio (platformer)'),
	description: t(
		'Von der Seite: Die Elemente der Seite sind Plattformen. Spring (Pfeil hoch), sammle Münzen, wirf Feuerbälle (V, springen am Boden ab) und besiege Koopas und den Drachenkönig in der Burg.',
		'From the side: page elements are platforms. Jump (arrow up), collect coins, throw fireballs (V, they bounce on the ground) and beat the koopas and the dragon king in the castle.'
	),
	config: {
		view: { mode: 'side' },
		game: { lives: 3, breakPoints: 20 },
		visits: { enabled: false, whilePlaying: false },
		sprites: {
			pagio: sprite(
				person({ shirt: '#2563eb', pants: '#1d4ed8', hat: 'cap', hatColor: '#dc2626' }),
				56
			),
			schnork: sprite(
				creature({ body: '#a16207', feature: 'ears', accent: '#fde68a', mood: 'angry' }),
				48
			),
			spiky: sprite(
				creature({ body: '#dc2626', feature: 'spikes', accent: '#fecaca', mood: 'angry' }),
				50
			),
			koopa: sprite(
				creature({ body: '#65a30d', feature: 'shell', accent: '#ca8a04', mood: 'angry' }),
				56
			),
			flyer: sprite(
				creature({ body: '#f9a8d4', feature: 'wings', accent: '#ec4899', cyclops: true }),
				46
			),
			dragon: sprite(
				creature({
					body: '#15803d',
					feature: 'horns',
					accent: '#fbbf24',
					fangs: true,
					mood: 'angry',
					pattern: 'spots'
				}),
				120
			),
			fire: sprite(icon('fireball', '#f97316', '#fde047'), 22),
			shell: sprite(icon('rock', '#65a30d', '#d9f99d'), 22),
			coin: sprite(icon('coin', '#facc15'), 26),
			mushroom: sprite(icon('apple', '#ef4444', '#ffffff'), 30),
			star: sprite(icon('star', '#facc15'), 30),
			flower: sprite(icon('gem', '#f97316', '#fde047'), 30)
		},
		entities: {
			hero: {
				kind: 'figure',
				label: 'Pagio',
				sprite: 'pagio',
				size: 56,
				stats: { hp: 100, attack: 1.5, defense: 0, speed: 230, dex: 0, luck: 0 },
				behavior: 'stand',
				moves: ['punch', 'kick']
			},
			schnork: monster({
				label: 'Schnork',
				sprite: 'schnork',
				size: 48,
				hp: 2,
				attack: 8,
				speed: 60,
				points: 50,
				drops: [{ item: 'coin', chance: 50 }]
			}),
			spiky: monster({
				label: 'Stachlig',
				sprite: 'spiky',
				size: 50,
				hp: 5,
				attack: 12,
				defense: 3,
				speed: 50,
				points: 120,
				drops: [{ item: 'mushroom', chance: 20 }]
			}),
			koopa: monster({
				label: 'Koopa',
				sprite: 'koopa',
				size: 56,
				hp: 8,
				attack: 9,
				defense: 2,
				speed: 55,
				points: 150,
				drops: [{ item: 'flower', chance: 20 }],
				extra: { throws: [{ throwable: 'schale', range: 340, cooldown: 3.5 }] }
			}),
			flyer: monster({
				label: 'Flatterer',
				sprite: 'flyer',
				size: 46,
				hp: 3,
				attack: 7,
				speed: 110,
				behavior: 'wander',
				points: 80,
				drops: [{ item: 'coin', chance: 60 }]
			}),
			dragon: monster({
				label: 'Drachenkönig',
				sprite: 'dragon',
				size: 120,
				hp: 190,
				attack: 18,
				defense: 4,
				speed: 75,
				moves: ['slam'],
				points: 3000,
				extra: {
					boss: true,
					throws: [{ throwable: 'bossfeuer', range: 520, cooldown: 2.6 }],
					phases: [
						{ below: 60, label: 'Der Drachenkönig speit schneller!', stats: { speed: 20 } },
						{
							below: 30,
							label: 'Der Drachenkönig ruft Schnorks!',
							do: [{ do: 'spawn', entity: 'schnork', count: 4, where: 'edge' }]
						}
					]
				}
			})
		},
		moves: MOVES,
		throwables: {
			feuerball: {
				label: 'Feuerball',
				sprite: 'fire',
				look: 'bomb',
				size: 22,
				keys: ['KeyV'],
				where: 'foot',
				speed: 520,
				fuse: 1.4,
				bounce: 0.65,
				radius: 45,
				power: 3,
				push: 260,
				breaks: false,
				cooldown: 0.35,
				unlimited: true,
				sound: 'throw',
				explodeSound: 'hit'
			},
			schale: {
				label: 'Panzerschale',
				sprite: 'shell',
				look: 'rock',
				size: 22,
				speed: 420,
				fuse: 0,
				radius: 0,
				power: 1.2,
				ammo: 1,
				maxAmmo: 1,
				breaks: false,
				where: 'foot'
			},
			bossfeuer: {
				label: 'Drachenfeuer',
				sprite: 'fire',
				look: 'bomb',
				size: 26,
				speed: 380,
				fuse: 1.2,
				bounce: 0.4,
				radius: 70,
				power: 2.5,
				breaks: true,
				ammo: 1,
				maxAmmo: 1,
				where: 'foot'
			}
		},
		items: {
			coin: {
				label: 'Münze',
				sprite: 'coin',
				size: 26,
				lifetime: 20,
				do: [{ do: 'points', amount: 50 }]
			},
			mushroom: {
				label: 'Pilz',
				sprite: 'mushroom',
				size: 30,
				lifetime: 25,
				do: [{ do: 'heal', amount: 50 }, say('Mmh!')]
			},
			star: {
				label: 'Stern',
				sprite: 'star',
				size: 30,
				lifetime: 25,
				do: [
					{ do: 'stat', stat: 'attack', amount: 4, target: 'figure', seconds: 12 },
					{ do: 'stat', stat: 'speed', amount: 80, target: 'figure', seconds: 12 },
					say('Super-Stern!')
				]
			},
			flower: {
				label: 'Feuerblume',
				sprite: 'flower',
				size: 30,
				lifetime: 25,
				do: [{ do: 'points', amount: 200 }, say('Feuer frei! (V)')]
			}
		},
		upgrades: {
			jump: { label: 'Sprungfedern', help: '+30 Tempo', cost: 150, max: 3, stats: { speed: 30 } },
			power: { label: 'Kraft', help: '+1 Angriff', cost: 200, max: 4, stats: { attack: 1 } },
			life: { label: 'Extraleben', help: '+30 Leben', cost: 250, max: 3, stats: { hp: 30 } }
		},
		spawns: [
			spawn('schnork', [4, 7], [1, 2], 6, [1, 100], 8),
			spawn('spiky', [9, 14], [1, 1], 3, [2, 100]),
			spawn('flyer', [8, 12], [1, 2], 4, [2, 100]),
			spawn('koopa', [12, 18], [1, 1], 3, [3, 100]),
			spawn('dragon', [4, 4], [1, 1], 1, [4, 100])
		],
		itemSpawns: [
			drop('coin', [3, 6], 6),
			drop('mushroom', [25, 40], 1),
			drop('star', [45, 70], 1, [2, 100])
		],
		levels: [
			{ label: 'Welt 1-1: Wiese', goal: { type: 'score', amount: 700 } },
			{ label: 'Welt 1-2: Höhle', goal: { type: 'kills', amount: 18 } },
			{ label: 'Welt 1-3: Himmel', goal: { type: 'survive', amount: 55 } },
			{ label: 'Welt 1-4: Die Burg', goal: { type: 'boss', amount: 1 } }
		],
		triggers: [
			{ on: 'start', once: true, do: [say('Spring auf Absätze und Buttons! V: Feuerball.')] },
			{
				on: 'kill',
				only: 'dragon',
				do: [say('Die Prinzessin ist gerettet!'), { do: 'points', amount: 3000 }]
			}
		],
		texts: {
			keyboardHint:
				'Pfeiltasten oder WASD: laufen und springen · Leertaste: Hieb · V: Feuerball · U: Upgrades · Esc: beenden',
			sideHint:
				'Pfeiltasten oder WASD: laufen und springen · Leertaste: Hieb · V: Feuerball · U: Upgrades · Esc: beenden'
		},
		audio: {
			enabled: true,
			sounds: SOUNDS,
			events: { kill: 'hit', pickup: 'coin', levelUp: 'level' }
		}
	}
};
