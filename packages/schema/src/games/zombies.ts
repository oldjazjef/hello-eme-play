import type { Preset } from '../presets.js';
import { t } from '../dsl.js';
import { creature, icon, person, sprite } from './art.js';
import { drop, monster, MOVES, say, SOUNDS, spawn } from './helpers.js';

export const zombies: Preset = {
	label: t('Zombiewelle (Überleben)', 'Zombie Wave (survival)'),
	description: t(
		'Sporen vermehren sich, werden mit der Zeit zu Zombies, Brutes und Tyrannen: Wer zu lange wartet, wird überrannt. Schlag zu (Leertaste), wirf Brandflaschen (G) und Steine (T) und überlebe drei Nächte.',
		'Spores breed and turn into zombies, brutes and tyrants over time: wait too long and you are overrun. Swing (space), throw fire bottles (G) and rocks (T) and survive three nights.'
	),
	config: {
		game: { lives: 2, breakPoints: 15 },
		visits: { enabled: false, whilePlaying: false },
		sprites: {
			survivor: sprite(
				person({ shirt: '#475569', hat: 'hood', hatColor: '#0f172a', holds: 'wrench' }),
				56
			),
			spore: sprite(
				creature({
					body: '#bef264',
					feature: 'antenna',
					accent: '#65a30d',
					cyclops: true,
					pattern: 'spots'
				}),
				40
			),
			walker: sprite(
				creature({ body: '#84cc16', mood: 'sleepy', accent: '#4d7c0f', pattern: 'stripes' }),
				54
			),
			brute: sprite(
				creature({
					body: '#4d7c0f',
					feature: 'spikes',
					accent: '#a3e635',
					mood: 'angry',
					fangs: true
				}),
				74
			),
			tyrant: sprite(
				creature({
					body: '#365314',
					feature: 'horns',
					accent: '#ef4444',
					mood: 'angry',
					fangs: true
				}),
				92
			),
			zero: sprite(
				creature({
					body: '#14532d',
					feature: 'crown',
					accent: '#ef4444',
					mood: 'angry',
					fangs: true,
					pattern: 'spots'
				}),
				120
			),
			fire: sprite(icon('fireball', '#f97316', '#fde047'), 28),
			stone: sprite(icon('rock', '#78716c'), 18),
			medkit: sprite(icon('box', '#ffffff', '#dc2626'), 32),
			ammobox: sprite(icon('box', '#f97316', '#fde047'), 32),
			adrenalin: sprite(icon('bolt', '#facc15'), 30)
		},
		entities: {
			hero: {
				kind: 'figure',
				label: 'Überlebender',
				sprite: 'survivor',
				size: 56,
				stats: { hp: 110, attack: 1.5, defense: 0, speed: 205, dex: 0, luck: 0 },
				behavior: 'stand',
				moves: ['punch', 'kick']
			},
			spore: monster({
				label: 'Spore',
				sprite: 'spore',
				size: 40,
				hp: 2,
				attack: 2,
				speed: 40,
				behavior: 'wander',
				points: 10,
				extra: {
					breed: { every: { min: 12, max: 20 }, count: { min: 1, max: 2 }, max: 14 },
					evolve: { every: 28, maxLevel: 1, into: 'walker' }
				}
			}),
			walker: monster({
				label: 'Zombie',
				sprite: 'walker',
				size: 54,
				hp: 6,
				attack: 7,
				speed: 55,
				points: 60,
				extra: { evolve: { every: 45, maxLevel: 1, into: 'brute' } }
			}),
			brute: monster({
				label: 'Brute',
				sprite: 'brute',
				size: 74,
				hp: 18,
				attack: 14,
				defense: 3,
				speed: 65,
				moves: ['slam'],
				points: 200,
				drops: [{ item: 'medkit', chance: 35 }],
				extra: { evolve: { every: 60, maxLevel: 1, into: 'tyrant' } }
			}),
			tyrant: monster({
				label: 'Tyrann',
				sprite: 'tyrant',
				size: 92,
				hp: 40,
				attack: 22,
				defense: 6,
				speed: 75,
				moves: ['slam'],
				points: 500,
				drops: [{ item: 'ammobox', chance: 60 }]
			}),
			zero: monster({
				label: 'Patient Null',
				sprite: 'zero',
				size: 120,
				hp: 220,
				attack: 18,
				defense: 4,
				speed: 70,
				moves: ['slam'],
				points: 3000,
				extra: {
					boss: true,
					breed: { every: { min: 8, max: 8 }, count: { min: 2, max: 2 }, max: 12, into: 'spore' },
					phases: [
						{ below: 50, label: 'Patient Null mutiert!', stats: { attack: 8, speed: 25 } },
						{
							below: 25,
							label: 'Patient Null brüllt!',
							do: [{ do: 'spawn', entity: 'walker', count: 5, where: 'edge' }]
						}
					]
				}
			})
		},
		moves: {
			punch: { ...MOVES.punch, label: 'Hieb', power: 1.6, reach: 44 },
			kick: MOVES.kick,
			bite: MOVES.bite,
			slam: MOVES.slam
		},
		throwables: {
			molotov: {
				label: 'Brandflasche',
				sprite: 'fire',
				look: 'bomb',
				size: 28,
				keys: ['KeyG'],
				where: 'foot',
				speed: 430,
				fuse: 1.2,
				bounce: 0.2,
				radius: 125,
				power: 6,
				push: 420,
				breaks: true,
				cooldown: 0.7,
				ammo: 3,
				maxAmmo: 9,
				sound: 'throw',
				explodeSound: 'boom'
			},
			stein: {
				label: 'Stein',
				sprite: 'stone',
				look: 'rock',
				size: 18,
				keys: ['KeyT'],
				where: 'foot',
				speed: 540,
				fuse: 0,
				radius: 0,
				power: 1.8,
				push: 260,
				breaks: false,
				cooldown: 0.4,
				unlimited: true,
				sound: 'throw'
			}
		},
		items: {
			medkit: {
				label: 'Verbandskasten',
				sprite: 'medkit',
				size: 32,
				lifetime: 30,
				do: [{ do: 'heal', amount: 45 }]
			},
			ammobox: {
				label: 'Kiste',
				sprite: 'ammobox',
				size: 32,
				lifetime: 30,
				do: [{ do: 'ammo', throwable: 'molotov', amount: 2 }, say('+2 Brandflaschen')]
			},
			adrenalin: {
				label: 'Adrenalin',
				sprite: 'adrenalin',
				size: 30,
				lifetime: 25,
				do: [
					{ do: 'stat', stat: 'speed', amount: 70, target: 'figure', seconds: 10 },
					say('Adrenalin!')
				]
			}
		},
		upgrades: {
			bat: { label: 'Stärkerer Hieb', help: '+1 Angriff', cost: 180, max: 5, stats: { attack: 1 } },
			fit: {
				label: 'Fitness',
				help: '+25 Leben, +15 Tempo',
				cost: 220,
				max: 3,
				stats: { hp: 25, speed: 15 }
			},
			bag: {
				label: 'Brandsatz',
				help: '+2 Brandflaschen',
				cost: 140,
				max: 5,
				do: [{ do: 'ammo', throwable: 'molotov', amount: 2 }]
			},
			armor: {
				label: 'Schutzkleidung',
				help: '+4 Verteidigung',
				cost: 240,
				max: 4,
				minLevel: 2,
				stats: { defense: 4 }
			}
		},
		spawns: [
			spawn('spore', [10, 16], [1, 2], 4),
			spawn('walker', [8, 14], [1, 2], 6, [1, 100], 8),
			spawn('brute', [25, 40], [1, 1], 2, [2, 100]),
			spawn('zero', [4, 4], [1, 1], 1, [3, 100])
		],
		itemSpawns: [
			drop('medkit', [30, 50], 1),
			drop('ammobox', [25, 45], 1),
			drop('adrenalin', [45, 70], 1, [2, 100])
		],
		waves: [
			{
				label: 'Erste Welle',
				fromLevel: 1,
				toLevel: 1,
				after: 15,
				steps: [
					{ at: 0, do: [say('Sie kommen!')] },
					{
						at: 0,
						every: 12,
						repeat: 4,
						do: [{ do: 'spawn', entity: 'walker', count: 3, where: 'edge' }]
					}
				]
			},
			{
				label: 'Spore-Regen',
				fromLevel: 2,
				toLevel: 2,
				after: 10,
				steps: [
					{ at: 0, do: [say('Sporen überall!')] },
					{
						at: 0,
						every: 8,
						repeat: 5,
						do: [{ do: 'spawn', entity: 'spore', count: 3, where: 'near' }]
					}
				]
			}
		],
		levels: [
			{ label: 'Nacht 1: Der Anfang', goal: { type: 'survive', amount: 60 } },
			{ label: 'Nacht 2: Sporen', goal: { type: 'kills', amount: 30 } },
			{ label: 'Nacht 3: Patient Null', goal: { type: 'boss', amount: 1 } }
		],
		triggers: [
			{
				on: 'start',
				once: true,
				do: [say('Töte Sporen früh: sie werden zu Zombies, Brutes und Tyrannen!')]
			},
			{ on: 'evolve', only: 'tyrant', do: [say('Ein Tyrann ist entstanden!')] },
			{
				on: 'kill',
				only: 'zero',
				do: [say('Patient Null ist erledigt!'), { do: 'points', amount: 2000 }]
			}
		],
		texts: {
			keyboardHint:
				'Pfeiltasten oder WASD: laufen · Leertaste: Hieb · Q: Tritt · G: Brandflasche · T: Stein · U: Upgrades · Esc: beenden',
			sideHint:
				'Pfeiltasten oder WASD: laufen · Leertaste: Hieb · Q: Tritt · G: Brandflasche · T: Stein · U: Upgrades · Esc: beenden'
		},
		audio: {
			enabled: true,
			sounds: SOUNDS,
			events: { kill: 'hit', pickup: 'coin', levelUp: 'level', explode: 'boom', evolve: 'faint' }
		}
	}
};
