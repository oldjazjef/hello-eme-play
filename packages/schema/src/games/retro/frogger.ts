import type { Preset } from '../../presets.js';
import { t } from '../../dsl.js';
import { icon, sprite, vehicle } from '../art.js';
import { monster, say, SOUNDS } from '../helpers.js';
import { coin, flag, frog } from './art.js';

const car = (label: string, picture: string, size: number, speed: number) =>
	monster({
		label,
		sprite: picture,
		size,
		hp: 99,
		attack: 10,
		speed,
		behavior: 'drift',
		moves: ['splat'],
		points: 0
	});

const symbols = {
	'>': { entity: 'car', angle: 0 },
	'<': { entity: 'car', angle: 180 },
	')': { entity: 'racer', angle: 0 },
	'(': { entity: 'racer', angle: 180 },
	T: { entity: 'truck', angle: 0 },
	t: { entity: 'truck', angle: 180 },
	F: { item: 'flag' },
	o: { item: 'coin' },
	P: { start: true }
};

export const frogger: Preset = {
	label: t('Hüpfer (Frogger)', 'Hopper (Frogger)'),
	description: t(
		'Hüpfe Feld für Feld über die Strasse, ohne überfahren zu werden, und hole alle Fahnen ganz oben. Jeder Treffer kostet ein Leben und schickt dich zurück an den Start. Die Seite selbst ist der Hintergrund.',
		'Hop cell by cell across the road without being run over, and fetch every flag at the top. Every hit costs a life and sends you back to the start. The page itself is the background.'
	),
	config: {
		game: {
			lives: 4,
			control: 'grid',
			arena: 'screen',
			wrap: false,
			respawn: 'hit',
			grid: { cell: 52, auto: false, crash: false, tail: false }
		},
		visits: { enabled: false },
		sprites: {
			frog: sprite(frog('#4ade80'), 50, 'up', true),
			car: sprite(vehicle('car', '#ef4444'), 50, 'right', true),
			racer: sprite(vehicle('sports', '#3b82f6'), 50, 'right', true),
			truck: sprite(vehicle('truck', '#f59e0b'), 50, 'right', true),
			flag: sprite(flag('#ef4444'), 38),
			coin: sprite(coin(), 24),
			heart: sprite(icon('heart', '#ef4444'), 30)
		},
		entities: {
			hero: {
				kind: 'figure',
				label: 'Frosch',
				sprite: 'frog',
				size: 38,
				stats: { hp: 3, attack: 1, defense: 0, speed: 340, dex: 0, luck: 0 },
				behavior: 'stand',
				moves: []
			},
			car: car('Auto', 'car', 64, 95),
			racer: car('Raser', 'racer', 70, 170),
			truck: car('Lastwagen', 'truck', 104, 62)
		},
		moves: {
			splat: {
				label: 'Überfahren',
				power: 1,
				reach: 34,
				cooldown: 0.4,
				seconds: 0.1,
				push: 0,
				breaks: false,
				pose: 'kick'
			}
		},
		items: {
			flag: {
				label: 'Fahne',
				sprite: 'flag',
				size: 38,
				lifetime: 0,
				required: true,
				do: [{ do: 'points', amount: 250 }, { do: 'toStart' }, say('Fahne geholt!')]
			},
			coin: {
				label: 'Münze',
				sprite: 'coin',
				size: 24,
				lifetime: 0,
				do: [{ do: 'points', amount: 50 }]
			}
		},
		maps: {
			road: {
				label: 'Landstrasse',
				cell: 52,
				legend: symbols,
				rows: [
					' F   F   F   F ',
					'               ',
					' >    >    >   ',
					'   <    <   <  ',
					' T       T     ',
					'               ',
					'    t      t   ',
					'  >   >    >   ',
					'o              ',
					'      P        '
				]
			},
			highway: {
				label: 'Autobahn',
				cell: 52,
				legend: symbols,
				rows: [
					' F   F   F   F ',
					'    (   (   (  ',
					' >  >  >  >  > ',
					'  <   <   <    ',
					' T      T      ',
					'               ',
					'   )   )   )   ',
					' t       t     ',
					' >   >   >   > ',
					'      P        '
				]
			},
			rush: {
				label: 'Stosszeit',
				cell: 52,
				legend: symbols,
				rows: [
					'F  F  F  F  F  ',
					' (  (  (  (  ( ',
					'>  >  >  >  >  ',
					' <  <  <  <  < ',
					'T    T    T    ',
					'               ',
					' )   )   )   ) ',
					'  t    t    t  ',
					'>  >  >  >  >  ',
					'      P        '
				]
			}
		},
		levels: [
			{ label: 'Runde 1: Landstrasse', map: 'road', goal: { type: 'clear', amount: 1 } },
			{ label: 'Runde 2: Autobahn', map: 'highway', goal: { type: 'clear', amount: 1 } },
			{ label: 'Runde 3: Stosszeit', map: 'rush', goal: { type: 'clear', amount: 1 } }
		],
		triggers: [
			{
				on: 'start',
				once: true,
				do: [say('Pfeile: ein Feld hüpfen · hole alle Fahnen oben!')]
			},
			{ on: 'death', do: [say('Überfahren! Zurück zum Start.')] }
		],
		texts: {
			keyboardHint:
				'Pfeiltasten oder WASD: ein Feld hüpfen · Fahnen oben holen · Autos meiden · Esc: beenden',
			sideHint:
				'Pfeiltasten oder WASD: ein Feld hüpfen · Fahnen oben holen · Autos meiden · Esc: beenden'
		},
		audio: {
			enabled: true,
			sounds: SOUNDS,
			events: { pickup: 'coin', levelUp: 'level', death: 'faint' }
		}
	}
};
