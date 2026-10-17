import type { Preset } from '../../presets.js';
import { t } from '../../dsl.js';
import { sprite } from '../art.js';
import { say, SOUNDS } from '../helpers.js';
import { paddleUpright, puck } from './art.js';

const emptyRow = ' '.repeat(25);
const rows = Array.from({ length: 13 }, (_, row) => (row === 6 ? `${' '.repeat(24)}C` : emptyRow));

export const ping: Preset = {
	label: t('Ping (Pong)', 'Ping (Pong)'),
	description: t(
		'Du links, der Computer rechts. Lenke den Ball mit dem Schläger zurück: je weiter aussen er trifft, desto flacher fliegt er. Geht er rechts durch, bekommst du einen Punkt, links kostet es ein Leben. Der Computer wird von Runde zu Runde schneller.',
		'You on the left, the computer on the right. Send the ball back with the paddle: the farther out it hits, the flatter it flies. Past the right edge you score, past the left one you lose a life. The computer gets faster every round.'
	),
	config: {
		game: {
			lives: 3,
			control: 'slide',
			slideAxis: 'y',
			arena: 'screen',
			wrap: false,
			pit: 'leftright',
			respawn: 'hit'
		},
		visits: { enabled: false },
		sprites: {
			you: sprite(paddleUpright('#38bdf8'), 50),
			cpu: sprite(paddleUpright('#f87171'), 50),
			ball: sprite(puck('#fde047'), 50)
		},
		entities: {
			hero: {
				kind: 'figure',
				label: 'Du',
				sprite: 'you',
				size: 120,
				shape: 'bar',
				stats: { hp: 3, attack: 1, defense: 0, speed: 520, dex: 0, luck: 0 },
				behavior: 'stand',
				moves: []
			},
			cpu: {
				kind: 'monster',
				label: 'Computer',
				sprite: 'cpu',
				size: 120,
				shape: 'bar',
				behavior: 'paddle',
				heading: 180,
				stats: { hp: 999, attack: 0, defense: 0, speed: 210 },
				moves: [],
				reward: { points: 0, drops: [] }
			},
			ball: {
				kind: 'monster',
				label: 'Ball',
				sprite: 'ball',
				size: 24,
				behavior: 'bounce',
				stats: { hp: 999, attack: 0, defense: 0, speed: 430 },
				moves: [],
				reward: { points: 0, drops: [] }
			}
		},
		moves: {},
		maps: {
			court: {
				label: 'Spielfeld',
				cell: 80,
				legend: { C: { entity: 'cpu', angle: 180 } },
				rows
			}
		},
		levels: [
			{ label: 'Runde 1', map: 'court', goal: { type: 'score', amount: 300 } },
			{ label: 'Runde 2: Schnellerer Gegner', map: 'court', goal: { type: 'score', amount: 400 } },
			{ label: 'Runde 3: Profi', map: 'court', goal: { type: 'score', amount: 500 } }
		],
		triggers: [
			{
				on: 'levelUp',
				do: [
					{ do: 'spawn', entity: 'ball', count: 1, where: 'figure' },
					say('Hoch/runter: Schläger bewegen')
				]
			},
			{
				on: 'levelUp',
				conditions: [{ if: 'level', min: 2, max: 2 }],
				do: [{ do: 'stat', stat: 'speed', amount: 70, target: 'monsters', seconds: 0 }]
			},
			{
				on: 'levelUp',
				conditions: [{ if: 'level', min: 3, max: 100 }],
				do: [{ do: 'stat', stat: 'speed', amount: 140, target: 'monsters', seconds: 0 }]
			},
			{
				on: 'lost',
				only: 'right',
				do: [
					{ do: 'points', amount: 100 },
					{ do: 'spawn', entity: 'ball', count: 1, where: 'figure' }
				]
			},
			{
				on: 'lost',
				only: 'left',
				do: [
					{ do: 'heal', amount: -1 },
					{ do: 'spawn', entity: 'ball', count: 1, where: 'figure' }
				]
			}
		],
		texts: {
			keyboardHint:
				'Hoch/runter oder W/S: Schläger bewegen · Punkt, wenn der Ball rechts durchgeht · Esc: beenden',
			sideHint:
				'Hoch/runter oder W/S: Schläger bewegen · Punkt, wenn der Ball rechts durchgeht · Esc: beenden'
		},
		audio: {
			enabled: true,
			sounds: SOUNDS,
			events: { levelUp: 'level', death: 'faint', points: 'coin' }
		}
	}
};
