import type { Preset } from '../../presets.js';
import { t } from '../../dsl.js';
import { icon, sprite } from '../art.js';
import { drop, monster, MOVES, say, SOUNDS } from '../helpers.js';
import { colossus, drone, knight, orb } from './art.js';

export const titan: Preset = {
	label: t('Titan-Arena (Bosskampf)', 'Titan Arena (boss fight)'),
	description: t(
		'Drei Bosskämpfe in einer Arena. Jeder Boss zeigt vor jedem Angriff kurz an, was kommt (roter Ring), und wechselt in Phasen sein Muster: Schusskreise, Sturmangriffe, Bombenregen, Drohnen und Sprünge. Von hinten trifft man ihn doppelt so hart; solange seine Drohnen leben, schützt ihn ein Schild.',
		'Three boss fights in one arena. Before every attack the boss shows what is coming (a red ring) and changes its pattern in phases: rings of shots, charges, bomb rain, drones and jumps. From behind you hit it twice as hard; while its drones live a shield protects it.'
	),
	config: {
		game: { lives: 3, arena: 'screen', wrap: false, respawn: 'death' },
		visits: { enabled: false },
		sprites: {
			knight: sprite(knight('#38bdf8'), 50, 'right', true),
			warden: sprite(colossus('#64748b', '#94a3b8'), 50),
			sentinel: sprite(colossus('#7c3aed', '#c4b5fd'), 50),
			colossus: sprite(colossus('#b91c1c', '#fde047'), 50),
			drone: sprite(drone('#38bdf8'), 50),
			orb: sprite(orb('#f87171'), 20),
			dagger: sprite(orb('#fde047'), 14),
			mine: sprite(icon('bomb', '#7f1d1d', '#fde047'), 30),
			heart: sprite(icon('heart', '#ef4444'), 30)
		},
		entities: {
			hero: {
				kind: 'figure',
				label: 'Ritter',
				sprite: 'knight',
				size: 48,
				stats: { hp: 120, attack: 2, defense: 0, speed: 250, dex: 0, luck: 0 },
				behavior: 'stand',
				moves: ['sword']
			},
			drone: monster({
				label: 'Drohne',
				sprite: 'drone',
				size: 40,
				hp: 4,
				attack: 8,
				speed: 110,
				moves: ['nip'],
				points: 40,
				drops: [{ item: 'heart', chance: 35 }]
			}),
			warden: monster({
				label: 'Torwächter',
				sprite: 'warden',
				size: 120,
				hp: 160,
				attack: 16,
				defense: 2,
				speed: 40,
				moves: ['smash'],
				points: 800,
				extra: {
					boss: true,
					weakSpot: { side: 'back', multiplier: 2.5, other: 0.6 },
					attacks: [
						{ kind: 'fan', every: 3.5, windup: 0.9, throwable: 'orb', count: 8, spread: 360 },
						{ kind: 'charge', every: 7, windup: 1, boost: 450, seconds: 0.8, fromPhase: 1 }
					],
					phases: [{ below: 50, label: 'Der Wächter wird wütend!', stats: { speed: 25 } }]
				}
			}),
			sentinel: monster({
				label: 'Wächter',
				sprite: 'sentinel',
				size: 128,
				hp: 230,
				attack: 18,
				defense: 3,
				speed: 45,
				moves: ['smash'],
				points: 1500,
				extra: {
					boss: true,
					shieldedBy: 'drone',
					weakSpot: { side: 'back', multiplier: 2, other: 0.7 },
					attacks: [
						{ kind: 'summon', every: 9, windup: 0.8, entity: 'drone', count: 2 },
						{ kind: 'fan', every: 3, windup: 0.8, throwable: 'orb', count: 5, spread: 70 },
						{ kind: 'rain', every: 8, windup: 1, throwable: 'mine', count: 3, fromPhase: 1 }
					],
					phases: [{ below: 50, label: 'Mehr Minen!', stats: { attack: 6 } }]
				}
			}),
			colossus: monster({
				label: 'Koloss',
				sprite: 'colossus',
				size: 160,
				hp: 380,
				attack: 22,
				defense: 4,
				speed: 48,
				moves: ['smash'],
				points: 4000,
				extra: {
					boss: true,
					shieldedBy: 'drone',
					weakSpot: { side: 'back', multiplier: 2.5, other: 0.5 },
					attacks: [
						{ kind: 'fan', every: 3.2, windup: 0.8, throwable: 'orb', count: 10, spread: 360 },
						{ kind: 'summon', every: 11, windup: 0.8, entity: 'drone', count: 2, fromPhase: 1 },
						{ kind: 'charge', every: 6, windup: 0.9, boost: 500, seconds: 0.8, fromPhase: 1 },
						{ kind: 'rain', every: 7, windup: 1, throwable: 'mine', count: 4, fromPhase: 2 },
						{ kind: 'teleport', every: 10, windup: 0.6, fromPhase: 3 }
					],
					phases: [
						{ below: 75, label: 'Der Koloss erwacht!', stats: { speed: 10 } },
						{ below: 50, label: 'Bombenregen!', stats: { attack: 6 } },
						{ below: 25, label: 'Letzte Kraft!', stats: { speed: 30 } }
					]
				}
			})
		},
		moves: {
			sword: { ...MOVES.sword, power: 2.5, reach: 62, cooldown: 0.3 },
			nip: {
				label: 'Zwicken',
				power: 1,
				reach: 30,
				cooldown: 1,
				seconds: 0.2,
				push: 100,
				breaks: false,
				pose: 'bite'
			},
			smash: {
				label: 'Hieb',
				power: 1,
				reach: 80,
				cooldown: 1.2,
				seconds: 0.3,
				push: 500,
				breaks: false,
				pose: 'kick'
			}
		},
		throwables: {
			dagger: {
				label: 'Wurfdolch',
				sprite: 'dagger',
				look: 'bullet',
				size: 14,
				keys: ['KeyJ'],
				where: 'foot',
				speed: 760,
				fuse: 0,
				radius: 0,
				power: 0.8,
				push: 0,
				breaks: false,
				cooldown: 0.4,
				unlimited: true,
				auto: true,
				sound: 'throw'
			},
			orb: {
				label: 'Feuerkugel',
				sprite: 'orb',
				look: 'bullet',
				size: 20,
				speed: 300,
				fuse: 0,
				radius: 0,
				power: 0.9,
				breaks: false,
				ammo: 1,
				maxAmmo: 1,
				where: 'foot'
			},
			mine: {
				label: 'Mine',
				sprite: 'mine',
				look: 'mine',
				size: 30,
				speed: 0,
				fuse: 1.4,
				radius: 90,
				power: 1.2,
				push: 350,
				breaks: false,
				ammo: 1,
				maxAmmo: 1,
				where: 'foot',
				explodeSound: 'boom'
			}
		},
		items: {
			heart: {
				label: 'Herz',
				sprite: 'heart',
				size: 30,
				lifetime: 18,
				do: [{ do: 'heal', amount: 30 }]
			}
		},
		upgrades: {
			blade: {
				label: 'Schwert',
				help: '+1 Angriff',
				cost: 500,
				max: 4,
				stats: { attack: 1 }
			},
			armor: {
				label: 'Rüstung',
				help: '+30 Leben',
				cost: 400,
				max: 4,
				stats: { hp: 30 }
			},
			quick: {
				label: 'Flinke Hand',
				help: '+20 Geschick: Schwert und Dolch schneller',
				cost: 350,
				max: 4,
				stats: { dex: 20 }
			}
		},
		itemSpawns: [drop('heart', [22, 34], 2)],
		waves: [
			{
				label: 'Torwächter',
				fromLevel: 1,
				toLevel: 1,
				after: 1,
				steps: [{ at: 0, do: [{ do: 'spawn', entity: 'warden', count: 1, where: 'edge' }] }]
			},
			{
				label: 'Wächter',
				fromLevel: 2,
				toLevel: 2,
				after: 1,
				steps: [{ at: 0, do: [{ do: 'spawn', entity: 'sentinel', count: 1, where: 'edge' }] }]
			},
			{
				label: 'Koloss',
				fromLevel: 3,
				toLevel: 3,
				after: 1,
				steps: [{ at: 0, do: [{ do: 'spawn', entity: 'colossus', count: 1, where: 'edge' }] }]
			}
		],
		levels: [
			{ label: 'Kampf 1: Der Torwächter', goal: { type: 'boss', amount: 1 } },
			{ label: 'Kampf 2: Der Wächter', goal: { type: 'boss', amount: 1 } },
			{ label: 'Kampf 3: Der Koloss', goal: { type: 'boss', amount: 1 } }
		],
		triggers: [
			{
				on: 'start',
				once: true,
				do: [say('Weiche dem roten Ring aus · von hinten triffst du härter')]
			},
			{ on: 'attack', do: [{ do: 'sound', sound: 'encounter' }] },
			{ on: 'kill', only: 'colossus', do: [say('Der Koloss zerfällt zu Staub!')] }
		],
		texts: {
			keyboardHint:
				'Pfeiltasten oder WASD: laufen · Leertaste: Schwert · J: Wurfdolch (halten) · roter Ring: gleich kommt ein Angriff · U: Upgrades · Esc: beenden',
			sideHint:
				'Pfeiltasten oder WASD: laufen · Leertaste: Schwert · J: Wurfdolch (halten) · roter Ring: gleich kommt ein Angriff · U: Upgrades · Esc: beenden'
		},
		audio: {
			enabled: true,
			sounds: SOUNDS,
			events: { kill: 'hit', pickup: 'coin', levelUp: 'level', explode: 'boom', phase: 'evolve' }
		}
	}
};
