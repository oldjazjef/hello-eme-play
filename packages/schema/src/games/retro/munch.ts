import type { Preset } from '../../presets.js';
import { t } from '../../dsl.js';
import { sprite } from '../art.js';
import { monster, say, SOUNDS } from '../helpers.js';
import { dot, ghost, hedgeWall, muncher } from './art.js';

const chaser = (label: string, picture: string, speed: number) =>
	monster({
		label,
		sprite: picture,
		size: 38,
		hp: 1,
		attack: 5,
		speed,
		behavior: 'ghost',
		moves: ['gotcha'],
		points: 200,
		extra: { respawn: 6 }
	});

const legend = {
	'#': { item: 'wall' },
	'.': { item: 'pellet' },
	o: { item: 'power' },
	P: { start: true },
	G: { entity: 'blinky' },
	H: { entity: 'pinky' },
	I: { entity: 'inky' }
};

export const munch: Preset = {
	label: t('Muncher (Pac-Man)', 'Muncher (Pac-Man)'),
	description: t(
		'Frisst alle Punkte im Labyrinth, ohne von den Geistern erwischt zu werden. Die grossen Punkte erschrecken die Geister: dann kannst du sie fressen, und sie kommen später zurück. Der Tunnel an der Seite führt auf die andere Seite.',
		'Eat every dot in the maze without being caught by the ghosts. The big dots scare the ghosts: then you can eat them, and they come back later. The tunnel at the side leads to the other side.'
	),
	config: {
		game: {
			lives: 3,
			control: 'grid',
			arena: 'screen',
			wrap: true,
			respawn: 'hit',
			grid: { cell: 46, auto: true, crash: false, tail: false }
		},
		visits: { enabled: false },
		sprites: {
			muncher: sprite(muncher('#fde047'), 50, 'right', true),
			blinky: sprite(ghost('#ef4444'), 50),
			pinky: sprite(ghost('#f472b6'), 50),
			inky: sprite(ghost('#22d3ee'), 50),
			wall: sprite(hedgeWall('#3b82f6'), 46),
			pellet: sprite(dot('#fde68a', 5), 16),
			power: sprite(dot('#fbbf24', 12), 26)
		},
		entities: {
			hero: {
				kind: 'figure',
				label: 'Muncher',
				sprite: 'muncher',
				size: 38,
				stats: { hp: 1, attack: 1, defense: 0, speed: 175, dex: 0, luck: 0 },
				behavior: 'stand',
				moves: []
			},
			blinky: chaser('Blinky', 'blinky', 120),
			pinky: chaser('Pinky', 'pinky', 108),
			inky: chaser('Inky', 'inky', 100)
		},
		moves: {
			gotcha: {
				label: 'Erwischt',
				power: 1,
				reach: 30,
				cooldown: 0.4,
				seconds: 0.1,
				push: 0,
				breaks: false,
				pose: 'bite'
			}
		},
		items: {
			wall: {
				label: 'Mauer',
				sprite: 'wall',
				size: 46,
				pickup: 'none',
				solid: true,
				box: true,
				lifetime: 0
			},
			pellet: {
				label: 'Punkt',
				sprite: 'pellet',
				size: 16,
				lifetime: 0,
				required: true,
				do: [{ do: 'points', amount: 10 }]
			},
			power: {
				label: 'Kraftpille',
				sprite: 'power',
				size: 26,
				lifetime: 0,
				required: true,
				do: [{ do: 'points', amount: 50 }, { do: 'scare', seconds: 8 }, say('Geister erschreckt!')]
			}
		},
		maps: {
			maze: {
				label: 'Labyrinth',
				cell: 46,
				legend,
				rows: [
					'#############',
					'#o....#....o#',
					'#.##.###.##.#',
					'......H......',
					'#.##.#.#.##.#',
					'#....#G#....#',
					'#.##.# #.##.#',
					'#.....I.....#',
					'#.##.###.##.#',
					'#o....P....o#',
					'#############'
				]
			},
			maze2: {
				label: 'Labyrinth 2',
				cell: 46,
				legend,
				rows: [
					'#############',
					'#o.#.....#.o#',
					'#..#.###.#..#',
					'#.....H.....#',
					'##.##.#.##.##',
					'#....#G#....#',
					'#.##.# #.##.#',
					'#.....I.....#',
					'#.##.###.##.#',
					'#o....P....o#',
					'#############'
				]
			}
		},
		levels: [
			{ label: 'Runde 1', map: 'maze', goal: { type: 'clear', amount: 1 } },
			{ label: 'Runde 2: Neue Wände', map: 'maze2', goal: { type: 'clear', amount: 1 } },
			{ label: 'Runde 3: Schnellere Geister', map: 'maze', goal: { type: 'clear', amount: 1 } }
		],
		triggers: [
			{
				on: 'start',
				once: true,
				do: [say('Frisst alle Punkte · grosse Punkte erschrecken die Geister')]
			},
			{
				on: 'levelUp',
				conditions: [{ if: 'level', min: 2, max: 2 }],
				do: [{ do: 'stat', stat: 'speed', amount: 10, target: 'monsters', seconds: 0 }]
			},
			{
				on: 'levelUp',
				conditions: [{ if: 'level', min: 3, max: 100 }],
				do: [{ do: 'stat', stat: 'speed', amount: 25, target: 'monsters', seconds: 0 }]
			},
			{ on: 'death', do: [say("Erwischt! Weiter geht's.")] }
		],
		texts: {
			keyboardHint:
				'Pfeiltasten oder WASD: lenken · alle Punkte fressen · grosse Punkte: Geister fressen · Esc: beenden',
			sideHint:
				'Pfeiltasten oder WASD: lenken · alle Punkte fressen · grosse Punkte: Geister fressen · Esc: beenden'
		},
		audio: {
			enabled: true,
			sounds: SOUNDS,
			events: { pickup: 'coin', kill: 'hit', levelUp: 'level', death: 'faint' }
		}
	}
};
