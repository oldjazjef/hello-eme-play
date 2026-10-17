import type { Preset } from '../presets.js';
import { t } from '../dsl.js';
import { creature, icon, person, sprite } from './art.js';
import { drop, monster, MOVES, say, SOUNDS, spawn } from './helpers.js';

const wave = (
	label: string,
	level: number,
	after: number,
	steps: [number, string, number, number?, number?][]
): Record<string, unknown> => ({
	label,
	fromLevel: level,
	toLevel: level,
	after,
	steps: [
		{ at: 0, do: [say(label)] },
		...steps.map(([at, entity, count, every, repeat]) => ({
			at,
			every: every ?? 10,
			repeat: repeat ?? 0,
			do: [{ do: 'spawn', entity, count, where: 'edge' }]
		}))
	]
});

export const laststand: Preset = {
	label: t('Last Stand (Wellen abwehren)', 'Last Stand (wave defense)'),
	description: t(
		'Gestaffelte Angriffswellen: Lege Minen (M), wirf Granaten (G) und Steine (T), halte durch und besiege den Overlord. Monster werfen zurück, Kisten füllen deine Munition auf.',
		'Staggered attack waves: lay mines (M), throw grenades (G) and rocks (T), hold out and beat the Overlord. Monsters throw back, crates refill your ammo.'
	),
	config: {
		game: { lives: 2, breakPoints: 15 },
		visits: { enabled: false, whilePlaying: false },
		sprites: {
			commander: sprite(
				person({ shirt: '#15803d', hat: 'helmet', hatColor: '#facc15', holds: 'bomb' }),
				58
			),
			grunt: sprite(
				creature({ body: '#a16207', feature: 'ears', mood: 'angry', accent: '#fde68a' }),
				50
			),
			sprinter: sprite(
				creature({
					body: '#f97316',
					feature: 'spikes',
					mood: 'angry',
					accent: '#fed7aa',
					fangs: true
				}),
				44
			),
			thrower: sprite(
				creature({ body: '#0ea5e9', feature: 'antenna', accent: '#fde047', cyclops: true }),
				52
			),
			tank: sprite(
				creature({
					body: '#475569',
					feature: 'horns',
					accent: '#94a3b8',
					mood: 'angry',
					fangs: true
				}),
				84
			),
			overlord: sprite(
				creature({
					body: '#7f1d1d',
					feature: 'crown',
					accent: '#facc15',
					mood: 'angry',
					fangs: true,
					pattern: 'stripes'
				}),
				130
			),
			mineIcon: sprite(icon('bomb', '#7f1d1d', '#fde047'), 30),
			grenade: sprite(icon('bomb', '#15803d', '#bbf7d0'), 26),
			junk: sprite(icon('rock', '#78716c'), 20),
			crate: sprite(icon('box', '#65a30d', '#fde047'), 34),
			medkit: sprite(icon('box', '#ffffff', '#dc2626'), 32),
			star: sprite(icon('star', '#facc15'), 28)
		},
		entities: {
			hero: {
				kind: 'figure',
				label: 'Kommandant',
				sprite: 'commander',
				size: 58,
				stats: { hp: 150, attack: 1.5, defense: 2, speed: 190, dex: 0, luck: 0 },
				behavior: 'stand',
				moves: ['punch', 'kick']
			},
			grunt: monster({
				label: 'Grunzer',
				sprite: 'grunt',
				hp: 5,
				attack: 6,
				speed: 65,
				points: 50
			}),
			sprinter: monster({
				label: 'Sprinter',
				sprite: 'sprinter',
				size: 44,
				hp: 3,
				attack: 7,
				speed: 135,
				points: 80
			}),
			thrower: monster({
				label: 'Werfer',
				sprite: 'thrower',
				hp: 8,
				attack: 5,
				speed: 50,
				behavior: 'wander',
				points: 150,
				drops: [{ item: 'crate', chance: 30 }],
				extra: { throws: [{ throwable: 'schrott', range: 400, cooldown: 3 }] }
			}),
			tank: monster({
				label: 'Brocken',
				sprite: 'tank',
				size: 84,
				hp: 40,
				attack: 16,
				defense: 6,
				speed: 45,
				moves: ['slam'],
				points: 300,
				drops: [{ item: 'medkit', chance: 40 }]
			}),
			overlord: monster({
				label: 'Overlord',
				sprite: 'overlord',
				size: 130,
				hp: 300,
				attack: 20,
				defense: 5,
				speed: 60,
				moves: ['slam'],
				points: 4000,
				extra: {
					boss: true,
					throws: [{ throwable: 'schrott', range: 520, cooldown: 2 }],
					phases: [
						{
							below: 66,
							label: 'Overlord ruft Sprinter!',
							do: [{ do: 'spawn', entity: 'sprinter', count: 5, where: 'edge' }]
						},
						{
							below: 33,
							label: 'Overlord rastet aus!',
							stats: { attack: 10, speed: 25 },
							do: [{ do: 'spawn', entity: 'tank', count: 2, where: 'edge' }]
						}
					]
				}
			})
		},
		moves: MOVES,
		throwables: {
			mine: {
				label: 'Mine',
				sprite: 'mineIcon',
				look: 'mine',
				size: 30,
				keys: ['KeyM'],
				where: 'foot',
				speed: 0,
				fuse: 0,
				radius: 95,
				power: 8,
				push: 560,
				breaks: true,
				cooldown: 0.5,
				ammo: 6,
				maxAmmo: 14,
				sound: 'throw',
				explodeSound: 'boom'
			},
			granate: {
				label: 'Granate',
				sprite: 'grenade',
				look: 'bomb',
				size: 26,
				keys: ['KeyG'],
				where: 'foot',
				speed: 480,
				fuse: 1.8,
				bounce: 0.4,
				radius: 125,
				power: 6,
				push: 500,
				breaks: true,
				cooldown: 0.6,
				ammo: 6,
				maxAmmo: 16,
				sound: 'throw',
				explodeSound: 'boom'
			},
			stein: {
				label: 'Stein',
				sprite: 'junk',
				look: 'rock',
				size: 18,
				keys: ['KeyT'],
				where: 'foot',
				speed: 600,
				fuse: 0,
				radius: 0,
				power: 2,
				push: 260,
				breaks: false,
				cooldown: 0.4,
				unlimited: true,
				sound: 'throw'
			},
			schrott: {
				label: 'Schrott',
				sprite: 'junk',
				look: 'rock',
				size: 20,
				speed: 420,
				fuse: 0,
				radius: 0,
				power: 1.4,
				ammo: 1,
				maxAmmo: 1,
				breaks: false,
				where: 'foot'
			}
		},
		items: {
			crate: {
				label: 'Munitionskiste',
				sprite: 'crate',
				size: 34,
				lifetime: 30,
				do: [
					{ do: 'ammo', throwable: 'granate', amount: 3 },
					{ do: 'ammo', throwable: 'mine', amount: 2 },
					say('Munition aufgefüllt')
				]
			},
			medkit: {
				label: 'Verbandskasten',
				sprite: 'medkit',
				size: 32,
				lifetime: 30,
				do: [{ do: 'heal', amount: 50 }]
			},
			star: {
				label: 'Prämie',
				sprite: 'star',
				size: 28,
				lifetime: 25,
				do: [{ do: 'points', amount: 250 }]
			}
		},
		upgrades: {
			grenades: {
				label: 'Granatengürtel',
				help: '+3 Granaten',
				cost: 140,
				max: 6,
				do: [{ do: 'ammo', throwable: 'granate', amount: 3 }]
			},
			mines: {
				label: 'Minenvorrat',
				help: '+3 Minen',
				cost: 130,
				max: 6,
				do: [{ do: 'ammo', throwable: 'mine', amount: 3 }]
			},
			armor: { label: 'Weste', help: '+4 Verteidigung', cost: 220, max: 5, stats: { defense: 4 } },
			legs: {
				label: 'Ausdauer',
				help: '+20 Tempo, +20 Leben',
				cost: 200,
				max: 3,
				stats: { speed: 20, hp: 20 }
			}
		},
		spawns: [spawn('grunt', [7, 11], [1, 2], 6, [1, 100], 6)],
		itemSpawns: [
			drop('crate', [18, 30], 2),
			drop('medkit', [30, 50], 1),
			drop('star', [20, 40], 1)
		],
		waves: [
			wave('Welle 1: Grunzer', 1, 8, [[2, 'grunt', 4, 8, 4]]),
			wave('Welle 2: Sprinter', 1, 55, [[0, 'sprinter', 3, 9, 4]]),
			wave('Welle 3: Werfer', 2, 8, [
				[0, 'thrower', 2, 14, 3],
				[3, 'grunt', 4, 9, 4]
			]),
			wave('Welle 4: Brocken', 2, 50, [
				[0, 'tank', 1, 18, 3],
				[4, 'sprinter', 3, 10, 3]
			]),
			wave('Welle 5: Alles auf einmal', 3, 8, [
				[0, 'grunt', 6, 10, 3],
				[2, 'thrower', 2, 12, 3],
				[5, 'tank', 1, 20, 2]
			])
		],
		levels: [
			{ label: 'Tag 1: Der Wall', goal: { type: 'survive', amount: 90 } },
			{ label: 'Tag 2: Es wird ernst', goal: { type: 'survive', amount: 100 } },
			{ label: 'Tag 3: Der Overlord', goal: { type: 'boss', amount: 1 } }
		],
		triggers: [
			{ on: 'start', once: true, do: [say('M: Mine legen. G: Granate. T: Stein. Halte durch!')] },
			{
				on: 'kill',
				only: 'overlord',
				do: [say('Der Overlord ist gefallen!'), { do: 'points', amount: 3000 }]
			}
		],
		texts: {
			keyboardHint:
				'Pfeiltasten oder WASD: laufen · M: Mine legen · G: Granate · T: Stein · Leertaste: Hieb · U: Upgrades · Esc: beenden',
			sideHint:
				'Pfeiltasten oder WASD: laufen · M: Mine legen · G: Granate · T: Stein · Leertaste: Hieb · U: Upgrades · Esc: beenden'
		},
		audio: {
			enabled: true,
			sounds: SOUNDS,
			events: { kill: 'hit', pickup: 'coin', levelUp: 'level', explode: 'boom' }
		}
	}
};
