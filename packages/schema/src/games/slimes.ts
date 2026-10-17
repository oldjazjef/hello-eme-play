import type { Preset } from '../presets.js';
import { t } from '../dsl.js';
import { creature, icon, person, sprite } from './art.js';
import { drop, monster, MOVES, say, SOUNDS, spawn } from './helpers.js';

export const slimes: Preset = {
	label: t('Schleim-Alarm (Vermehrung)', 'Slime Alert (breeding)'),
	description: t(
		'Die Schleime vermehren sich und wachsen. Räum auf, bevor es zu viele werden: mit dem Wischmopp, Salzbomben (G) und Salzstreuern (T). Am Ende wartet der Schleimkönig.',
		'The slimes breed and grow. Clean up before there are too many: with the mop, salt bombs (G) and salt shakers (T). The Slime King waits at the end.'
	),
	config: {
		game: { lives: 3, breakPoints: 10 },
		visits: { enabled: false, whilePlaying: false },
		sprites: {
			cleaner: sprite(
				person({ shirt: '#0ea5e9', hat: 'cap', hatColor: '#f59e0b', holds: 'wrench' }),
				56
			),
			slimeling: sprite(
				creature({ body: '#4ade80', feature: 'none', belly: '#bbf7d0', accent: '#16a34a' }),
				38
			),
			goo: sprite(
				creature({ body: '#22d3ee', feature: 'antenna', accent: '#0891b2', cyclops: true }),
				44
			),
			blob: sprite(
				creature({
					body: '#a3e635',
					feature: 'spikes',
					accent: '#4d7c0f',
					pattern: 'spots',
					mood: 'angry'
				}),
				60
			),
			king: sprite(
				creature({
					body: '#16a34a',
					feature: 'crown',
					accent: '#ef4444',
					fangs: true,
					mood: 'angry',
					pattern: 'spots'
				}),
				130
			),
			saltbomb: sprite(icon('bomb', '#e2e8f0', '#64748b'), 30),
			salt: sprite(icon('gem', '#f8fafc', '#94a3b8'), 16),
			saltbag: sprite(icon('box', '#e2e8f0', '#64748b'), 32),
			heart: sprite(icon('heart', '#ef4444'), 28)
		},
		entities: {
			hero: {
				kind: 'figure',
				label: 'Hausmeister',
				sprite: 'cleaner',
				size: 56,
				stats: { hp: 100, attack: 1.2, defense: 0, speed: 210, dex: 0, luck: 0 },
				behavior: 'stand',
				moves: ['mop', 'kick']
			},
			slimeling: monster({
				label: 'Schleimchen',
				sprite: 'slimeling',
				size: 38,
				hp: 2,
				attack: 3,
				speed: 55,
				behavior: 'wander',
				points: 15,
				extra: {
					breed: { every: { min: 5, max: 9 }, count: { min: 1, max: 2 }, max: 24 },
					evolve: { every: 22, maxLevel: 2, stats: { hp: 2, attack: 1 }, size: 8, into: 'goo' }
				}
			}),
			goo: monster({
				label: 'Glibber',
				sprite: 'goo',
				size: 44,
				hp: 5,
				attack: 5,
				speed: 60,
				points: 40,
				drops: [{ item: 'saltbag', chance: 20 }],
				extra: {
					breed: {
						every: { min: 9, max: 14 },
						count: { min: 1, max: 1 },
						max: 14,
						into: 'slimeling'
					},
					evolve: { every: 35, maxLevel: 2, stats: { hp: 3, attack: 2 }, size: 8, into: 'blob' }
				}
			}),
			blob: monster({
				label: 'Klumpen',
				sprite: 'blob',
				size: 60,
				hp: 14,
				attack: 10,
				defense: 2,
				speed: 55,
				moves: ['slam'],
				points: 120,
				drops: [{ item: 'heart', chance: 30 }]
			}),
			king: monster({
				label: 'Schleimkönig',
				sprite: 'king',
				size: 130,
				hp: 200,
				attack: 15,
				defense: 3,
				speed: 60,
				moves: ['slam'],
				points: 2500,
				extra: {
					boss: true,
					breed: {
						every: { min: 6, max: 6 },
						count: { min: 2, max: 3 },
						max: 14,
						into: 'slimeling'
					},
					phases: [
						{ below: 50, label: 'Der Schleimkönig schwillt an!', stats: { attack: 8 } },
						{
							below: 25,
							label: 'Schleimflut!',
							do: [{ do: 'spawn', entity: 'goo', count: 5, where: 'edge' }]
						}
					]
				}
			})
		},
		moves: {
			mop: { ...MOVES.punch, label: 'Wischmopp', power: 1.5, reach: 54, cooldown: 0.3 },
			kick: MOVES.kick,
			bite: MOVES.bite,
			slam: MOVES.slam
		},
		throwables: {
			saltbomb: {
				label: 'Salzbombe',
				sprite: 'saltbomb',
				look: 'bomb',
				size: 30,
				keys: ['KeyG'],
				where: 'foot',
				speed: 400,
				fuse: 1.3,
				bounce: 0.3,
				radius: 140,
				power: 5,
				push: 500,
				breaks: true,
				cooldown: 0.6,
				ammo: 5,
				maxAmmo: 14,
				sound: 'throw',
				explodeSound: 'boom'
			},
			salt: {
				label: 'Salzstreuer',
				sprite: 'salt',
				look: 'rock',
				size: 16,
				keys: ['KeyT'],
				where: 'foot',
				speed: 560,
				fuse: 0,
				radius: 40,
				power: 1.4,
				push: 150,
				breaks: false,
				cooldown: 0.35,
				unlimited: true,
				sound: 'throw'
			}
		},
		items: {
			saltbag: {
				label: 'Salzsack',
				sprite: 'saltbag',
				size: 32,
				lifetime: 30,
				do: [{ do: 'ammo', throwable: 'saltbomb', amount: 3 }, say('+3 Salzbomben')]
			},
			heart: {
				label: 'Pause',
				sprite: 'heart',
				size: 28,
				lifetime: 20,
				do: [{ do: 'heal', amount: 40 }]
			}
		},
		upgrades: {
			mop: { label: 'Profi-Mopp', help: '+1 Angriff', cost: 150, max: 5, stats: { attack: 1 } },
			salt: {
				label: 'Salzvorrat',
				help: '+3 Salzbomben',
				cost: 120,
				max: 6,
				do: [{ do: 'ammo', throwable: 'saltbomb', amount: 3 }]
			},
			boots: {
				label: 'Gummistiefel',
				help: '+20 Tempo, +3 Verteidigung',
				cost: 200,
				max: 3,
				stats: { speed: 20, defense: 3 }
			}
		},
		spawns: [
			spawn('slimeling', [14, 22], [2, 3], 8),
			spawn('goo', [30, 45], [1, 1], 3, [2, 100]),
			spawn('king', [4, 4], [1, 1], 1, [3, 100])
		],
		itemSpawns: [drop('saltbag', [20, 32], 2), drop('heart', [30, 50], 1)],
		levels: [
			{ label: 'Keller: Erste Pfütze', goal: { type: 'kills', amount: 40 } },
			{ label: 'Kanal: Es wird eng', goal: { type: 'kills', amount: 70 } },
			{ label: 'Der Schleimkönig', goal: { type: 'boss', amount: 1 } }
		],
		triggers: [
			{
				on: 'start',
				once: true,
				do: [
					say('Schleimchen vermehren sich und wachsen. Putz sie weg, bevor sie zu viele werden!')
				]
			},
			{ on: 'evolve', only: 'blob', do: [say('Ein Klumpen ist entstanden!')] },
			{
				on: 'kill',
				only: 'king',
				do: [say('Der Schleimkönig ist weggewischt!'), { do: 'points', amount: 2000 }]
			}
		],
		texts: {
			keyboardHint:
				'Pfeiltasten oder WASD: laufen · Leertaste: wischen · G: Salzbombe · T: Salz streuen · U: Upgrades · Esc: beenden',
			sideHint:
				'Pfeiltasten oder WASD: laufen · Leertaste: wischen · G: Salzbombe · T: Salz streuen · U: Upgrades · Esc: beenden'
		},
		audio: {
			enabled: true,
			sounds: SOUNDS,
			events: { kill: 'hit', pickup: 'coin', levelUp: 'level', explode: 'boom' }
		}
	}
};
