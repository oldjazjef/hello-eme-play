import type { Preset } from '../../presets.js';
import { t } from '../../dsl.js';
import { sprite } from '../art.js';
import { say, SOUNDS } from '../helpers.js';
import { brick, paddle, puck, steel } from './art.js';

const rows = (...lines: string[]) => lines.map((line) => line.padEnd(20, ' '));
const empty = '                    ';

const legend = {
	'1': { item: 'red' },
	'2': { item: 'orange' },
	'3': { item: 'yellow' },
	'4': { item: 'green' },
	S: { item: 'steel' }
};

export const bricks: Preset = {
	label: t('Mauerbrecher (Breakout)', 'Wall Breaker (Breakout)'),
	description: t(
		'Ein Schläger am unteren Rand, ein Ball, der abprallt, und eine Mauer aus Ziegeln. Wo der Ball den Schläger trifft, bestimmt den Winkel. Fällt er unten durch, kostet das ein Leben. Mit jedem Ziegel wird der Ball schneller.',
		'A paddle at the bottom, a ball that bounces and a wall of bricks. Where the ball hits the paddle sets its angle. If it falls through the bottom you lose a life. Every brick makes the ball faster.'
	),
	config: {
		game: {
			lives: 3,
			control: 'slide',
			slideAxis: 'x',
			arena: 'screen',
			wrap: false,
			pit: 'bottom',
			respawn: 'hit'
		},
		visits: { enabled: false },
		sprites: {
			paddle: sprite(paddle('#38bdf8'), 50),
			ball: sprite(puck('#fde047'), 50),
			red: sprite(brick('#ef4444'), 64),
			orange: sprite(brick('#f97316'), 64),
			yellow: sprite(brick('#facc15'), 64),
			green: sprite(brick('#22c55e'), 64),
			steel: sprite(steel(), 64)
		},
		entities: {
			hero: {
				kind: 'figure',
				label: 'Schläger',
				sprite: 'paddle',
				size: 120,
				shape: 'bar',
				stats: { hp: 3, attack: 1, defense: 0, speed: 560, dex: 0, luck: 0 },
				behavior: 'stand',
				moves: []
			},
			ball: {
				kind: 'monster',
				label: 'Ball',
				sprite: 'ball',
				size: 22,
				behavior: 'bounce',
				stats: { hp: 999, attack: 0, defense: 0, speed: 380 },
				moves: [],
				reward: { points: 0, drops: [] }
			}
		},
		moves: {},
		items: {
			...Object.fromEntries(
				(
					[
						['red', 'Roter Ziegel', 40],
						['orange', 'Oranger Ziegel', 30],
						['yellow', 'Gelber Ziegel', 20],
						['green', 'Grüner Ziegel', 10]
					] as const
				).map(([id, label, points]) => [
					id,
					{
						label,
						sprite: id,
						size: 64,
						pickup: 'none',
						solid: true,
						box: true,
						aspect: 2,
						hp: 1,
						required: true,
						lifetime: 0,
						do: [
							{ do: 'points', amount: points },
							{ do: 'stat', stat: 'speed', amount: 5, target: 'monsters', seconds: 0 }
						]
					}
				])
			),
			steel: {
				label: 'Stahlblock',
				sprite: 'steel',
				size: 64,
				pickup: 'none',
				solid: true,
				box: true,
				aspect: 2,
				lifetime: 0
			}
		},
		maps: {
			wall1: {
				label: 'Mauer 1',
				cell: 32,
				legend,
				rows: rows(
					'1 1 1 1 1 1 1 1 1 1 ',
					' 2 2 2 2 2 2 2 2 2 2',
					'3 3 3 3 3 3 3 3 3 3 ',
					' 4 4 4 4 4 4 4 4 4 4',
					empty,
					empty,
					empty,
					empty,
					empty,
					empty,
					empty,
					empty,
					empty,
					empty
				)
			},
			wall2: {
				label: 'Mauer 2',
				cell: 32,
				legend,
				rows: rows(
					'S 1 1 1 1 1 1 1 1 S ',
					' 2 2 S 2 2 2 2 S 2 2',
					'3 3 3 3 S 3 3 3 3 3 ',
					' 4 4 4 4 4 4 4 4 4 4',
					'1 1 1 1 1 1 1 1 1 1 ',
					empty,
					empty,
					empty,
					empty,
					empty,
					empty,
					empty,
					empty,
					empty
				)
			},
			wall3: {
				label: 'Mauer 3',
				cell: 32,
				legend,
				rows: rows(
					'S S S 1 1 1 1 S S S ',
					' 1 2 2 2 2 2 2 2 2 1',
					'S 2 3 3 3 3 3 3 2 S ',
					' 1 2 3 4 4 4 4 3 2 1',
					'S 2 3 3 3 3 3 3 2 S ',
					' 1 2 2 2 2 2 2 2 2 1',
					empty,
					empty,
					empty,
					empty,
					empty,
					empty,
					empty,
					empty
				)
			}
		},
		levels: [
			{ label: 'Mauer 1', map: 'wall1', goal: { type: 'clear', amount: 1 } },
			{ label: 'Mauer 2: Stahlblöcke', map: 'wall2', goal: { type: 'clear', amount: 1 } },
			{ label: 'Mauer 3: Die Festung', map: 'wall3', goal: { type: 'clear', amount: 1 } }
		],
		triggers: [
			{
				on: 'levelUp',
				do: [
					{ do: 'spawn', entity: 'ball', count: 1, where: 'figure' },
					say('Links/rechts: Schläger bewegen')
				]
			},
			{
				on: 'lost',
				only: 'bottom',
				do: [
					{ do: 'heal', amount: -1 },
					{ do: 'spawn', entity: 'ball', count: 1, where: 'figure' }
				]
			}
		],
		texts: {
			keyboardHint:
				'Pfeiltasten links/rechts oder A/D: Schläger bewegen · der Ball darf nicht unten durch · Esc: beenden',
			sideHint:
				'Pfeiltasten links/rechts oder A/D: Schläger bewegen · der Ball darf nicht unten durch · Esc: beenden'
		},
		audio: {
			enabled: true,
			sounds: SOUNDS,
			events: { pickup: 'coin', levelUp: 'level', death: 'faint' }
		}
	}
};
