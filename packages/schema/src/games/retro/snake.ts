import type { Preset } from '../../presets.js';
import { t } from '../../dsl.js';
import { icon, sprite } from '../art.js';
import { drop, say, SOUNDS } from '../helpers.js';
import { hedgeWall, snakeHead } from './art.js';

export const snake: Preset = {
	label: t('Schlange (Snake)', 'Snake'),
	description: t(
		'Die Schlange läuft von selbst, du lenkst. Äpfel lassen den Schwanz wachsen; Wand oder eigener Schwanz kostet ein Leben. Ab Runde 2 stehen Mauern im Weg und es wird schneller.',
		'The snake moves by itself, you steer. Apples make the tail grow; a wall or your own tail costs a life. From round 2 there are walls in the way and it gets faster.'
	),
	config: {
		game: {
			lives: 3,
			control: 'grid',
			arena: 'screen',
			wrap: false,
			respawn: 'hit',
			grid: { cell: 38, auto: true, crash: true, tail: true }
		},
		visits: { enabled: false },
		sprites: {
			head: sprite(snakeHead('#22c55e'), 50, 'right', true),
			apple: sprite(icon('apple', '#ef4444', '#4ade80'), 28),
			golden: sprite(icon('apple', '#fbbf24', '#fef08a'), 30),
			wall: sprite(hedgeWall('#78716c'), 38)
		},
		entities: {
			hero: {
				kind: 'figure',
				label: 'Schlange',
				sprite: 'head',
				size: 40,
				stats: { hp: 1, attack: 1, defense: 0, speed: 190, dex: 0, luck: 0 },
				behavior: 'stand',
				moves: []
			}
		},
		items: {
			apple: {
				label: 'Apfel',
				sprite: 'apple',
				size: 28,
				lifetime: 0,
				do: [
					{ do: 'grow', amount: 1 },
					{ do: 'points', amount: 10 }
				]
			},
			golden: {
				label: 'Goldener Apfel',
				sprite: 'golden',
				size: 30,
				lifetime: 12,
				do: [{ do: 'grow', amount: 3 }, { do: 'points', amount: 50 }, say('Goldener Apfel!')]
			},
			wall: {
				label: 'Mauer',
				sprite: 'wall',
				size: 38,
				pickup: 'none',
				solid: true,
				box: true,
				lifetime: 0
			}
		},
		itemSpawns: [drop('apple', [0.2, 0.2], 1), drop('golden', [18, 28], 1, [2, 100])],
		maps: {
			rooms: {
				label: 'Zimmer',
				cell: 38,
				legend: { '#': { item: 'wall' } },
				rows: [
					'                   ',
					'  ####       ####  ',
					'  #             #  ',
					'  #             #  ',
					'                   ',
					'        ###        ',
					'                   ',
					'  #             #  ',
					'  #             #  ',
					'  ####       ####  ',
					'                   '
				]
			},
			maze: {
				label: 'Irrgarten',
				cell: 38,
				legend: { '#': { item: 'wall' } },
				rows: [
					'                   ',
					' ######   ######   ',
					'                   ',
					'    #  ###  #      ',
					'    #       #      ',
					' ## #  ###  # ##   ',
					'                   ',
					' ######   ######   ',
					'                   ',
					'  #    ###    #    ',
					'                   '
				]
			}
		},
		levels: [
			{ label: 'Runde 1: Wiese', goal: { type: 'score', amount: 120 } },
			{ label: 'Runde 2: Zimmer', map: 'rooms', goal: { type: 'score', amount: 160 } },
			{ label: 'Runde 3: Irrgarten', map: 'maze', goal: { type: 'score', amount: 220 } }
		],
		triggers: [
			{
				on: 'start',
				once: true,
				do: [say('Pfeile: lenken · Äpfel fressen · nicht in Wand oder Schwanz!')]
			},
			{
				on: 'levelUp',
				do: [{ do: 'stat', stat: 'speed', amount: 22, target: 'figure', seconds: 0 }]
			},
			{ on: 'death', do: [say("Autsch! Weiter geht's.")] }
		],
		texts: {
			keyboardHint:
				'Pfeiltasten oder WASD: lenken · die Schlange läuft von selbst · Äpfel fressen · Esc: beenden',
			sideHint:
				'Pfeiltasten oder WASD: lenken · die Schlange läuft von selbst · Äpfel fressen · Esc: beenden'
		},
		audio: {
			enabled: true,
			sounds: SOUNDS,
			events: { pickup: 'coin', levelUp: 'level', death: 'faint' }
		}
	}
};
