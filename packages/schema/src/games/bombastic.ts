import type { Preset } from '../presets.js';
import { t } from '../dsl.js';
import { creature, icon, person, sprite } from './art.js';
import { drop, monster, MOVES, say, SOUNDS, spawn } from './helpers.js';

const bomb = (extra: Record<string, unknown>) => ({
	look: 'bomb',
	where: 'foot',
	hurtsFigure: true,
	breaks: true,
	push: 380,
	...extra
});

export const bombastic: Preset = {
	label: t('Bombastic (Bomberman)', 'Bombastic (bomber)'),
	description: t(
		'Lege Bomben (Leertaste), wirf sie (T) oder zünde Megabomben (M). Sprenge Monster und Seitenelemente, aber bleib selbst aus dem Radius. Vier Stufen, am Ende der Bomber-König.',
		'Drop bombs (space), throw them (T) or set off mega bombs (M). Blast monsters and page elements, but stay out of the radius yourself. Four stages, the Bomber King at the end.'
	),
	config: {
		game: { lives: 3, breakPoints: 25 },
		visits: { enabled: false, whilePlaying: false },
		sprites: {
			bomber: sprite(
				person({ shirt: '#e2e8f0', hat: 'helmet', hatColor: '#2563eb', holds: 'bomb' }),
				56
			),
			balloon: sprite(
				creature({ body: '#fb7185', feature: 'antenna', accent: '#fde047', cyclops: true }),
				52
			),
			ghost: sprite(
				creature({ body: '#e2e8f0', feature: 'none', mood: 'sleepy', belly: '#ffffff' }),
				54
			),
			robot: sprite(
				creature({ body: '#94a3b8', feature: 'antenna', accent: '#ef4444', mood: 'angry' }),
				58
			),
			king: sprite(
				creature({
					body: '#7c3aed',
					feature: 'crown',
					accent: '#ef4444',
					fangs: true,
					mood: 'angry'
				}),
				110
			),
			bombIcon: sprite(icon('bomb', '#334155'), 30),
			megaIcon: sprite(icon('bomb', '#7f1d1d', '#fde047'), 40),
			up: sprite(icon('bomb', '#16a34a'), 30),
			mega: sprite(icon('bomb', '#dc2626', '#fde047'), 32),
			heart: sprite(icon('heart', '#ef4444'), 28),
			star: sprite(icon('star', '#facc15'), 28),
			boots: sprite(icon('boot', '#22c55e'), 30)
		},
		entities: {
			hero: {
				kind: 'figure',
				label: 'Bomber',
				sprite: 'bomber',
				size: 56,
				stats: { hp: 100, attack: 1, defense: 0, speed: 200, dex: 0, luck: 0 },
				behavior: 'stand',
				moves: []
			},
			balloon: monster({
				label: 'Ballon',
				sprite: 'balloon',
				hp: 3,
				attack: 6,
				speed: 55,
				behavior: 'wander',
				points: 50,
				drops: [{ item: 'bombUp', chance: 20 }]
			}),
			ghost: monster({
				label: 'Geist',
				sprite: 'ghost',
				hp: 5,
				attack: 9,
				speed: 95,
				points: 100,
				drops: [{ item: 'heart', chance: 15 }]
			}),
			robot: monster({
				label: 'Wurf-Roboter',
				sprite: 'robot',
				size: 62,
				hp: 12,
				attack: 8,
				defense: 2,
				speed: 60,
				points: 200,
				drops: [{ item: 'megaPick', chance: 25 }],
				extra: { throws: [{ throwable: 'robobomb', range: 380, cooldown: 4 }] }
			}),
			king: monster({
				label: 'Bomber-König',
				sprite: 'king',
				size: 110,
				hp: 160,
				attack: 14,
				defense: 3,
				speed: 65,
				moves: ['slam'],
				points: 2000,
				extra: {
					boss: true,
					throws: [{ throwable: 'robobomb', range: 520, cooldown: 2.5 }],
					phases: [
						{ below: 60, label: 'Der König wirft schneller!', stats: { speed: 25 } },
						{
							below: 30,
							label: 'Der König ruft Ballons!',
							do: [{ do: 'spawn', entity: 'balloon', count: 5, where: 'edge' }]
						}
					]
				}
			})
		},
		moves: MOVES,
		throwables: {
			bomb: bomb({
				label: 'Bombe',
				sprite: 'bombIcon',
				keys: ['Space', 'KeyG'],
				size: 30,
				speed: 0,
				fuse: 2.2,
				radius: 95,
				power: 4,
				cooldown: 0.4,
				ammo: 2,
				maxAmmo: 8,
				sound: 'throw',
				explodeSound: 'boom'
			}),
			throwbomb: bomb({
				label: 'Wurfbombe',
				sprite: 'bombIcon',
				keys: ['KeyT'],
				size: 26,
				speed: 420,
				fuse: 1.6,
				radius: 80,
				power: 3,
				bounce: 0.5,
				cooldown: 0.5,
				ammo: 3,
				maxAmmo: 6,
				sound: 'throw',
				explodeSound: 'boom'
			}),
			megabomb: bomb({
				label: 'Megabombe',
				sprite: 'megaIcon',
				keys: ['KeyM'],
				size: 40,
				speed: 0,
				fuse: 3,
				radius: 175,
				power: 9,
				push: 600,
				cooldown: 1,
				ammo: 0,
				maxAmmo: 4,
				sound: 'throw',
				explodeSound: 'boom'
			}),
			robobomb: {
				label: 'Roboter-Bombe',
				sprite: 'bombIcon',
				size: 26,
				speed: 340,
				fuse: 1.4,
				radius: 80,
				power: 3,
				breaks: true,
				ammo: 1,
				maxAmmo: 1,
				where: 'foot'
			}
		},
		items: {
			bombUp: {
				label: 'Bomben-Plus',
				sprite: 'up',
				size: 30,
				lifetime: 25,
				do: [
					{ do: 'ammo', throwable: 'bomb', amount: 2 },
					{ do: 'ammo', throwable: 'throwbomb', amount: 1 },
					say('+2 Bomben')
				]
			},
			megaPick: {
				label: 'Megabombe',
				sprite: 'mega',
				size: 32,
				lifetime: 25,
				do: [{ do: 'ammo', throwable: 'megabomb', amount: 1 }, say('Eine Megabombe!')]
			},
			heart: {
				label: 'Herz',
				sprite: 'heart',
				size: 28,
				lifetime: 20,
				do: [{ do: 'heal', amount: 35 }]
			},
			star: {
				label: 'Stern',
				sprite: 'star',
				size: 28,
				lifetime: 25,
				do: [{ do: 'points', amount: 250 }]
			},
			boots: {
				label: 'Turbo-Schuhe',
				sprite: 'boots',
				size: 30,
				lifetime: 25,
				do: [
					{ do: 'stat', stat: 'speed', amount: 90, target: 'figure', seconds: 10 },
					say('Turbo!')
				]
			}
		},
		upgrades: {
			bombs: {
				label: 'Mehr Bomben',
				help: '+2 Bomben',
				cost: 150,
				max: 4,
				do: [{ do: 'ammo', throwable: 'bomb', amount: 2 }]
			},
			mega: {
				label: 'Megabomben',
				help: '+1 Megabombe',
				cost: 300,
				max: 3,
				minLevel: 2,
				do: [{ do: 'ammo', throwable: 'megabomb', amount: 1 }]
			},
			vest: {
				label: 'Schutzweste',
				help: '+4 Verteidigung',
				cost: 200,
				max: 4,
				stats: { defense: 4 }
			},
			shoes: { label: 'Schuhe', help: '+25 Tempo', cost: 150, max: 3, stats: { speed: 25 } }
		},
		spawns: [
			spawn('balloon', [4, 8], [1, 3], 8, [1, 100], 10),
			spawn('ghost', [8, 14], [1, 2], 5, [2, 100], 10),
			spawn('robot', [14, 22], [1, 1], 3, [3, 100]),
			spawn('king', [4, 4], [1, 1], 1, [4, 100])
		],
		itemSpawns: [
			drop('bombUp', [12, 20], 2),
			drop('heart', [25, 40], 1),
			drop('star', [20, 35], 2),
			drop('boots', [40, 60], 1, [2, 100]),
			drop('megaPick', [35, 55], 1, [2, 100])
		],
		waves: [
			{
				label: 'Ballon-Schwarm',
				fromLevel: 2,
				toLevel: 2,
				after: 8,
				steps: [
					{ at: 0, do: [say('Ballon-Schwarm!')] },
					{
						at: 2,
						every: 6,
						repeat: 3,
						do: [{ do: 'spawn', entity: 'balloon', count: 4, where: 'edge' }]
					}
				]
			}
		],
		levels: [
			{ label: 'Stufe 1: Übungsplatz', goal: { type: 'kills', amount: 8 } },
			{ label: 'Stufe 2: Geister und Ballons', goal: { type: 'score', amount: 1200 } },
			{ label: 'Stufe 3: Die Roboter-Fabrik', goal: { type: 'survive', amount: 50 } },
			{ label: 'Stufe 4: Der Bomber-König', goal: { type: 'boss', amount: 1 } }
		],
		triggers: [
			{
				on: 'start',
				once: true,
				do: [say('Leertaste: Bombe legen. T: werfen. M: Megabombe. Bleib aus dem Radius!')]
			},
			{
				on: 'kill',
				only: 'king',
				do: [say('Der Bomber-König ist gesprengt!'), { do: 'points', amount: 1500 }]
			}
		],
		texts: {
			keyboardHint:
				'Pfeiltasten oder WASD: laufen · Leertaste: Bombe legen · T: Wurfbombe · M: Megabombe · U: Upgrades · Esc: beenden',
			sideHint:
				'Pfeiltasten oder WASD: laufen · Leertaste: Bombe legen · T: Wurfbombe · M: Megabombe · U: Upgrades · Esc: beenden'
		},
		audio: {
			enabled: true,
			sounds: SOUNDS,
			events: { kill: 'hit', pickup: 'coin', levelUp: 'level', explode: 'boom' }
		}
	}
};
