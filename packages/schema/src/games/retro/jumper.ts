import type { Preset } from '../../presets.js';
import { t } from '../../dsl.js';
import { sprite } from '../art.js';
import { monster, say, SOUNDS } from '../helpers.js';
import { coil, coin, flag, ledge, pool, runner, walker } from './art.js';

const COLS = 24;
const ROWS = 12;

/** A map from where things stand: `at(row, col, char)`. */
function terrain(places: [row: number, col: number, char: string][]): string[] {
	const grid = Array.from({ length: ROWS }, () => Array<string>(COLS).fill(' '));
	for (const [row, col, char] of places) {
		const line = grid[row];
		if (line) line[col] = char;
	}
	return grid.map((line) => line.join(''));
}

const legend = {
	P: { start: true },
	L: { item: 'ledge' },
	F: { item: 'flag' },
	c: { item: 'coin' },
	s: { item: 'spring' },
	v: { item: 'lava' },
	k: { item: 'banner' },
	W: { entity: 'walker' },
	w: { entity: 'walker' },
	G: { entity: 'spiky' }
};

export const jumper: Preset = {
	label: t('Hüpfburg (Platformer)', 'Bounce Castle (Platformer)'),
	description: t(
		'Ein Sidescroller mit Schwerkraft: laufen, springen (in der Luft noch einmal!), auf Plattformen steigen, Pilzwächtern auf den Kopf springen, Federn nutzen, Lava überspringen, Fahne am Ende holen. Flaggen unterwegs sind Startpunkte.',
		'A side-scroller with gravity: run, jump (once more in the air!), climb platforms, stomp on mushroom guards, use springs, hop over lava and fetch the flag at the end. Banners on the way are checkpoints.'
	),
	config: {
		view: { mode: 'side', gravity: 1900, jumpSpeed: 780, airJumps: 1 },
		game: {
			lives: 4,
			arena: 'screen',
			wrap: false,
			respawn: 'death',
			stomp: 3
		},
		visits: { enabled: false },
		sprites: {
			runner: sprite(runner('#38bdf8'), 50),
			walker: sprite(walker('#ef4444'), 50),
			spiky: sprite(walker('#7c3aed', '#fde047'), 50),
			ledge: sprite(ledge('#a16207', '#4ade80'), 128),
			flag: sprite(flag('#ef4444'), 56),
			banner: sprite(flag('#38bdf8'), 44),
			coin: sprite(coin(), 24),
			spring: sprite(coil('#f59e0b'), 36),
			lava: sprite(pool('#ef4444', '#fde047'), 64)
		},
		entities: {
			hero: {
				kind: 'figure',
				label: 'Hüpfer',
				sprite: 'runner',
				size: 54,
				stats: { hp: 60, attack: 3, defense: 0, speed: 240, dex: 0, luck: 0 },
				behavior: 'stand',
				moves: []
			},
			walker: monster({
				label: 'Pilzwächter',
				sprite: 'walker',
				size: 44,
				hp: 3,
				attack: 14,
				speed: 70,
				behavior: 'patrol',
				moves: ['bump'],
				points: 100
			}),
			spiky: monster({
				label: 'Stachelpilz',
				sprite: 'spiky',
				size: 50,
				hp: 6,
				attack: 20,
				speed: 105,
				behavior: 'patrol',
				moves: ['bump'],
				points: 250
			})
		},
		moves: {
			bump: {
				label: 'Rempeln',
				power: 1,
				reach: 28,
				cooldown: 0.7,
				seconds: 0.1,
				push: 160,
				breaks: false,
				pose: 'bite'
			}
		},
		items: {
			ledge: {
				label: 'Plattform',
				sprite: 'ledge',
				size: 128,
				aspect: 3.76,
				pickup: 'none',
				box: true,
				platform: true,
				lifetime: 0
			},
			flag: {
				label: 'Ziel-Fahne',
				sprite: 'flag',
				size: 56,
				lifetime: 0,
				required: true,
				do: [{ do: 'points', amount: 500 }, say('Geschafft!')]
			},
			banner: {
				label: 'Startpunkt',
				sprite: 'banner',
				size: 44,
				lifetime: 0,
				do: [{ do: 'checkpoint' }, say('Startpunkt gesetzt')]
			},
			coin: {
				label: 'Münze',
				sprite: 'coin',
				size: 24,
				lifetime: 0,
				float: true,
				do: [{ do: 'points', amount: 50 }]
			},
			spring: {
				label: 'Sprungfeder',
				sprite: 'spring',
				size: 36,
				pickup: 'none',
				lifetime: 0,
				every: 0.4,
				do: [{ do: 'launch', speed: 1250 }]
			},
			lava: {
				label: 'Lava',
				sprite: 'lava',
				size: 64,
				pickup: 'none',
				lifetime: 0,
				damage: 45,
				damageWho: 'figure'
			}
		},
		maps: {
			hills: {
				label: 'Hügel',
				cell: 42,
				align: 'bottom',
				legend,
				rows: terrain([
					[11, 1, 'P'],
					[11, 9, 'W'],
					[11, 13, 'v'],
					[11, 17, 'W'],
					[11, 21, 's'],
					[9, 4, 'L'],
					[8, 4, 'c'],
					[7, 8, 'L'],
					[6, 8, 'w'],
					[6, 10, 'c'],
					[5, 13, 'L'],
					[4, 13, 'k'],
					[3, 17, 'L'],
					[2, 17, 'c'],
					[2, 21, 'L'],
					[1, 21, 'F']
				])
			},
			caves: {
				label: 'Höhlen',
				cell: 42,
				align: 'bottom',
				legend,
				rows: terrain([
					[11, 1, 'P'],
					[11, 7, 'v'],
					[11, 8, 'v'],
					[11, 12, 'W'],
					[11, 16, 'v'],
					[11, 17, 'v'],
					[11, 21, 'G'],
					[9, 4, 'L'],
					[8, 4, 'c'],
					[8, 9, 'L'],
					[7, 9, 'w'],
					[7, 12, 'c'],
					[6, 14, 'L'],
					[5, 14, 'k'],
					[4, 19, 'L'],
					[3, 19, 'w'],
					[3, 11, 'L'],
					[2, 11, 'c'],
					[2, 5, 'L'],
					[1, 5, 'F']
				])
			},
			tower: {
				label: 'Turm',
				cell: 42,
				align: 'bottom',
				legend,
				rows: terrain([
					[11, 1, 'P'],
					[11, 6, 'W'],
					[11, 10, 'v'],
					[11, 14, 'G'],
					[11, 19, 's'],
					[9, 3, 'L'],
					[9, 8, 'L'],
					[8, 8, 'w'],
					[9, 15, 'L'],
					[7, 12, 'L'],
					[6, 12, 'c'],
					[6, 5, 'L'],
					[5, 5, 'k'],
					[5, 19, 'L'],
					[4, 19, 'c'],
					[4, 12, 'L'],
					[3, 12, 'G'],
					[3, 5, 'L'],
					[2, 5, 'c'],
					[2, 20, 'L'],
					[1, 20, 'F']
				])
			}
		},
		levels: [
			{ label: 'Welt 1: Hügel', map: 'hills', goal: { type: 'clear', amount: 1 } },
			{ label: 'Welt 2: Höhlen', map: 'caves', goal: { type: 'clear', amount: 1 } },
			{ label: 'Welt 3: Turm', map: 'tower', goal: { type: 'clear', amount: 1 } }
		],
		triggers: [
			{
				on: 'start',
				once: true,
				do: [say('Leertaste: springen (in der Luft nochmal) · auf Pilze springen!')]
			},
			{ on: 'stomp', do: [{ do: 'points', amount: 20 }] },
			{ on: 'death', do: [say('Aua! Zurück zum letzten Startpunkt.')] }
		],
		keys: { jump: ['Space', 'KeyE'] },
		texts: {
			keyboardHint:
				'Links/rechts: laufen · Leertaste: springen (in der Luft nochmal) · Hoch: springen · auf Pilze springen · Esc: beenden',
			sideHint:
				'Links/rechts: laufen · Leertaste: springen (in der Luft nochmal) · Hoch: springen · auf Pilze springen · Esc: beenden'
		},
		audio: {
			enabled: true,
			sounds: SOUNDS,
			events: { pickup: 'coin', kill: 'hit', levelUp: 'level', death: 'faint' }
		}
	}
};
