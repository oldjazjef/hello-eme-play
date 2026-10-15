/**
 * The whole configuration as a tree of nodes (see `dsl.ts`). The defaults describe the classic
 * game: a figure, blobs that come in waves, a car that drives in, punches and kicks.
 */
import {
	t,
	type BooleanNode,
	type KeysNode,
	type ListNode,
	type Node,
	type NumberNode,
	type ObjectNode,
	type RangeNode,
	type RefNode,
	type SelectNode,
	type StringNode,
	type Text,
	type UnionNode
} from './dsl.js';
import { DEFAULT_TEXTS, TEXT_KEYS } from './texts.js';
import {
	BEHAVIORS,
	ENTITY_KINDS,
	EVENT_NAMES,
	FACINGS,
	GOALS,
	ITEM_LOOKS,
	LOOKS,
	POSES,
	VIEW_MODES
} from './types.js';

type Opts<N extends Node> = Partial<Omit<N, 'type' | 'label' | 'default'>>;

const num = (
	label: Text,
	value: number,
	min: number,
	max: number,
	options: Opts<NumberNode> = {}
): NumberNode => ({ type: 'number', label, default: value, min, max, ...options });
const int = (
	label: Text,
	value: number,
	min: number,
	max: number,
	options: Opts<NumberNode> = {}
) => num(label, value, min, max, { int: true, ...options });
const bool = (label: Text, value: boolean, options: Opts<BooleanNode> = {}): BooleanNode => ({
	type: 'boolean',
	label,
	default: value,
	...options
});
const str = (label: Text, value = '', options: Opts<StringNode> = {}): StringNode => ({
	type: 'string',
	label,
	default: value,
	...options
});
const select = (
	label: Text,
	options: readonly string[],
	value: string,
	more: Opts<SelectNode> = {}
): SelectNode => ({ type: 'select', label, options, default: value, ...more });
const range = (
	label: Text,
	min: number,
	max: number,
	bounds: { min: number; max: number },
	options: Opts<RangeNode> = {}
): RangeNode => ({ type: 'range', label, default: { min, max }, ...bounds, ...options });
const keys = (label: Text, value: readonly string[], options: Opts<KeysNode> = {}): KeysNode => ({
	type: 'keys',
	label,
	default: value,
	...options
});
const ref = (label: Text, to: string, optional = false, value = ''): RefNode => ({
	type: 'ref',
	label,
	to,
	optional,
	default: value
});
const object = (label: Text, fields: Record<string, Node>, help?: Text): ObjectNode => ({
	type: 'object',
	label,
	fields,
	...(help ? { help } : {})
});

const POINTS = { min: 0, max: 1_000_000 };

// --- Actions, conditions and triggers ---------------------------------------------------------

export const ACTION: UnionNode = {
	type: 'union',
	label: t('Aktion', 'Action'),
	by: 'do',
	variants: {
		spawn: {
			label: t('Monster erscheinen lassen', 'Spawn monsters'),
			fields: {
				entity: ref(t('Wer', 'Who'), 'entities'),
				count: int(t('Anzahl', 'Count'), 3, 1, 50),
				where: select(t('Wo', 'Where'), ['edge', 'near'], 'edge', {
					optionLabels: {
						edge: t('Am Rand', 'At the edge'),
						near: t('Nahe der Figur', 'Near the figure')
					}
				})
			}
		},
		setView: {
			label: t('Ansicht wechseln', 'Switch view'),
			fields: {
				mode: select(t('Ansicht', 'View'), VIEW_MODES, 'side', {
					optionLabels: {
						topdown: t('Vogelperspektive', 'Top-down'),
						side: t('Sidescroller', 'Side-scroller')
					}
				})
			}
		},
		points: {
			label: t('Punkte geben', 'Give points'),
			fields: { amount: int(t('Punkte', 'Points'), 100, -POINTS.max, POINTS.max) }
		},
		heal: {
			label: t('Leben ändern', 'Change health'),
			fields: {
				amount: num(t('Menge (minus = Schaden)', 'Amount (negative = damage)'), 25, -10_000, 10_000)
			}
		},
		stat: {
			label: t('Wert verändern', 'Change a stat'),
			fields: {
				stat: ref(t('Wert', 'Stat'), 'stats'),
				amount: num(t('Menge', 'Amount'), 10, -10_000, 10_000),
				target: select(t('Für', 'For'), ['figure', 'vehicle', 'monsters'], 'figure', {
					optionLabels: {
						figure: t('Figur', 'Figure'),
						vehicle: t('Fahrzeug', 'Vehicle'),
						monsters: t('Alle Monster', 'All monsters')
					}
				}),
				seconds: num(t('Sekunden (0 = für immer)', 'Seconds (0 = forever)'), 10, 0, 3600)
			}
		},
		dropItem: {
			label: t('Gegenstand fallen lassen', 'Drop an item'),
			fields: { item: ref(t('Gegenstand', 'Item'), 'items') }
		},
		nextLevel: { label: t('Nächstes Level', 'Next level'), fields: {} },
		message: {
			label: t('Meldung zeigen', 'Show a message'),
			fields: { text: str(t('Text', 'Text')) }
		},
		sound: {
			label: t('Ton abspielen', 'Play a sound'),
			fields: { sound: ref(t('Ton', 'Sound'), 'audio.sounds') }
		},
		win: { label: t('Spiel gewinnen', 'Win the game'), fields: {} },
		lose: { label: t('Spiel verlieren', 'Lose the game'), fields: {} }
	}
};

const ACTIONS = (title: Text): Node => ({ type: 'list', label: title, of: ACTION, maxItems: 20 });

export const CONDITION: UnionNode = {
	type: 'union',
	label: t('Bedingung', 'Condition'),
	by: 'if',
	variants: {
		level: {
			label: t('Level', 'Level'),
			fields: { min: int(t('Ab', 'From'), 1, 1, 100), max: int(t('Bis', 'Until'), 100, 1, 100) }
		},
		score: {
			label: t('Punkte', 'Score'),
			fields: { min: int(t('Mindestens', 'At least'), 100, 0, POINTS.max) }
		},
		view: {
			label: t('Ansicht', 'View'),
			fields: { mode: select(t('Ansicht', 'View'), VIEW_MODES, 'topdown') }
		},
		health: {
			label: t('Wenig Leben', 'Low health'),
			fields: { below: num(t('Unter (%)', 'Below (%)'), 30, 0, 100) }
		},
		chance: {
			label: t('Zufall', 'Chance'),
			fields: { percent: num(t('Chance (%)', 'Chance (%)'), 50, 0, 100) }
		},
		kills: {
			label: t('Besiegte Monster', 'Monsters beaten'),
			fields: {
				entity: ref(t('Welche (leer: alle)', 'Which (empty: all)'), 'entities', true),
				min: int(t('Mindestens', 'At least'), 10, 1, 100_000)
			}
		}
	}
};

const TRIGGER = object(t('Auslöser', 'Trigger'), {
	on: select(t('Wenn', 'When'), EVENT_NAMES, 'kill', {
		optionLabels: {
			start: t('Das Spiel startet', 'The game starts'),
			interval: t('Alle x Sekunden', 'Every x seconds'),
			kill: t('Ein Monster besiegt wird', 'A monster is beaten'),
			hurt: t('Die Figur getroffen wird', 'The figure is hurt'),
			death: t('Die Figur stirbt', 'The figure dies'),
			levelUp: t('Ein Level beginnt', 'A level starts'),
			pickup: t('Ein Gegenstand eingesammelt wird', 'An item is picked up'),
			upgrade: t('Ein Upgrade gekauft wird', 'An upgrade is bought'),
			break: t('Ein Seitenelement zerbricht', 'A page element breaks'),
			enterVehicle: t('Die Figur einsteigt', 'The figure gets in'),
			exitVehicle: t('Die Figur aussteigt', 'The figure gets out'),
			viewChange: t('Die Ansicht wechselt', 'The view switches')
		}
	}),
	only: str(
		t('Nur für (Monster, Gegenstand oder Upgrade)', 'Only for (monster, item or upgrade)'),
		'',
		{ help: t('Leer: für alle.', 'Empty: for all.') }
	),
	every: num(
		t('Sekunden (nur „Alle x Sekunden“)', 'Seconds (“every x seconds” only)'),
		30,
		1,
		3600
	),
	once: bool(t('Nur einmal', 'Only once'), false),
	conditions: { type: 'list', label: t('Nur wenn', 'Only if'), of: CONDITION, maxItems: 10 },
	do: ACTIONS(t('Dann', 'Then'))
});

// --- The sections -----------------------------------------------------------------------------

const STAT = object(t('Wert', 'Stat'), {
	label: str(t('Name', 'Name')),
	min: num(t('Kleinster Wert', 'Lowest'), 0, -1_000_000, 1_000_000),
	max: num(t('Grösster Wert', 'Highest'), 9999, -1_000_000, 1_000_000)
});

const frames = (label: Text): ListNode => ({
	type: 'list',
	label,
	of: int(t('Bild Nr.', 'Frame no.'), 0, 0, 4095),
	maxItems: 64,
	default: []
});

const SPRITE = object(t('Bild', 'Picture'), {
	url: str(t('Adresse (PNG, SVG, WebP …)', 'URL (PNG, SVG, WebP …)')),
	size: num(
		t(
			'Länge der längeren Seite (px, bei Sheets eines Einzelbilds)',
			'Longer side (px; of one frame for sheets)'
		),
		50,
		8,
		400
	),
	columns: int(t('Spalten im Sheet', 'Sheet columns'), 1, 1, 64),
	rows: int(t('Zeilen im Sheet', 'Sheet rows'), 1, 1, 64),
	fps: num(t('Bilder pro Sekunde', 'Frames per second'), 8, 1, 60),
	animations: object(
		t(
			'Animationen (Bildnummern ab 0, zeilenweise gezählt)',
			'Animations (frame numbers from 0, row by row)'
		),
		{
			idle: frames(t('Stehen', 'Idle')),
			walk: frames(t('Laufen', 'Walk')),
			jump: frames(t('Springen', 'Jump')),
			hurt: frames(t('Getroffen', 'Hurt')),
			punch: frames(t('Schlag', 'Punch')),
			kick: frames(t('Tritt', 'Kick')),
			bite: frames(t('Biss', 'Bite'))
		},
		t(
			'Leer: Stehen, ist auch das leer, das erste Bild.',
			'Empty: Idle; if that is empty too, the first frame.'
		)
	),
	facing: select(t('Blickt nach', 'Looks'), FACINGS, 'right', {
		optionLabels: {
			right: t('Rechts', 'Right'),
			down: t('Unten', 'Down'),
			left: t('Links', 'Left'),
			up: t('Oben', 'Up')
		}
	})
});

const ENTITY = object(t('Figur, Monster oder Fahrzeug', 'Figure, monster or vehicle'), {
	kind: select(t('Art', 'Kind'), ENTITY_KINDS, 'monster', {
		optionLabels: {
			figure: t('Figur', 'Figure'),
			monster: t('Monster', 'Monster'),
			vehicle: t('Fahrzeug', 'Vehicle')
		}
	}),
	label: str(t('Name', 'Name')),
	sprite: ref(t('Bild', 'Picture'), 'sprites', true),
	look: select(t('Eingebautes Aussehen', 'Built-in look'), LOOKS, 'enemy', {
		optionLabels: {
			figure: t('Figur', 'Figure'),
			enemy: t('Monster', 'Monster'),
			car: t('Auto', 'Car')
		}
	}),
	size: num(t('Grösse (px)', 'Size (px)'), 50, 8, 400),
	stats: {
		type: 'record',
		label: t('Werte', 'Stats'),
		help: t(
			'Leben, Angriff, Verteidigung, Tempo, Geschick, Glück … (siehe „Werte“).',
			'Health, attack, defense, speed, dex, luck … (see “Stats”).'
		),
		idLabel: t('Wert', 'Stat'),
		of: num(t('Wert', 'Value'), 0, -1_000_000, 1_000_000),
		default: {},
		maxItems: 30
	},
	behavior: select(t('Verhalten', 'Behavior'), BEHAVIORS, 'chase', {
		optionLabels: {
			chase: t('Verfolgt die Figur', 'Chases the figure'),
			wander: t('Streift umher', 'Wanders'),
			flee: t('Flieht', 'Flees'),
			stand: t('Steht still', 'Stands still'),
			arrive: t('Fährt vor und parkt', 'Drives in and parks')
		}
	}),
	moves: {
		type: 'list',
		label: t('Angriffe', 'Moves'),
		of: ref(t('Angriff', 'Move'), 'moves'),
		maxItems: 10
	},
	reward: object(t('Belohnung', 'Reward'), {
		points: int(t('Punkte', 'Points'), 0, 0, POINTS.max),
		drops: {
			type: 'list',
			label: t('Lässt fallen', 'Drops'),
			maxItems: 10,
			of: object(t('Gegenstand', 'Item'), {
				item: ref(t('Gegenstand', 'Item'), 'items'),
				chance: num(t('Chance (%)', 'Chance (%)'), 25, 0, 100)
			})
		}
	}),
	boss: bool(t('Boss', 'Boss'), false)
});

const MOVE = object(t('Angriff', 'Move'), {
	label: str(t('Name', 'Name')),
	keys: keys(t('Tasten (nur Figur)', 'Keys (figure only)'), []),
	power: num(t('Stärke (mal Angriff)', 'Power (× attack)'), 1, 0, 100),
	reach: num(t('Reichweite (px)', 'Reach (px)'), 30, 4, 400),
	cooldown: num(t('Pause (Sekunden)', 'Cooldown (seconds)'), 0.3, 0, 60),
	seconds: num(t('Dauer der Pose (Sekunden)', 'Pose length (seconds)'), 0.22, 0.05, 5),
	push: num(t('Rückstoss (px/s)', 'Knockback (px/s)'), 260, 0, 5000),
	breaks: bool(t('Zerschlägt Seitenelemente', 'Breaks page elements'), true),
	pose: select(t('Pose', 'Pose'), POSES, 'punch'),
	sound: ref(t('Ton', 'Sound'), 'audio.sounds', true),
	where: select(t('Wo einsetzbar', 'Usable'), ['foot', 'vehicle', 'both'], 'foot', {
		optionLabels: {
			foot: t('Zu Fuss', 'On foot'),
			vehicle: t('Im Fahrzeug', 'In a vehicle'),
			both: t('Beides', 'Both')
		}
	})
});

const ITEM = object(t('Gegenstand', 'Item'), {
	label: str(t('Name', 'Name')),
	sprite: ref(t('Bild', 'Picture'), 'sprites', true),
	look: select(t('Eingebautes Aussehen', 'Built-in look'), ITEM_LOOKS, 'star'),
	size: num(t('Grösse (px)', 'Size (px)'), 30, 8, 200),
	pickup: select(t('Einsammeln', 'Pick up'), ['touch', 'use'], 'touch', {
		optionLabels: {
			touch: t('Drüberlaufen', 'Walk over it'),
			use: t('Mit Aktionstaste', 'With the use key')
		}
	}),
	lifetime: num(
		t('Verschwindet nach (Sekunden, 0 = nie)', 'Vanishes after (seconds, 0 = never)'),
		20,
		0,
		3600
	),
	do: ACTIONS(t('Wirkung', 'Effect'))
});

const UPGRADE = object(t('Upgrade', 'Upgrade'), {
	label: str(t('Name', 'Name')),
	help: str(t('Beschreibung', 'Description')),
	cost: int(t('Preis (Punkte pro Stufe)', 'Cost (points per level)'), 200, 0, POINTS.max),
	max: int(t('Wie oft kaufbar', 'Times it can be bought'), 3, 1, 100),
	stats: {
		type: 'record',
		label: t('Werte pro Stufe', 'Stats per level'),
		idLabel: t('Wert', 'Stat'),
		of: num(t('Menge', 'Amount'), 0, -100_000, 100_000),
		default: {},
		maxItems: 30
	},
	vehicle: bool(t('Gilt auch für das Fahrzeug', 'Also for the vehicle'), false),
	minLevel: int(t('Ab Level', 'From level'), 1, 1, 100),
	do: ACTIONS(t('Zusätzliche Wirkung', 'Extra effect'))
});

const level = (min: number) => ({
	fromLevel: int(t('Ab Level', 'From level'), min, 1, 100),
	toLevel: int(t('Bis Level', 'Until level'), 100, 1, 100)
});

const SPAWN = object(t('Monster-Regel', 'Monster rule'), {
	entity: ref(t('Monster', 'Monster'), 'entities'),
	every: range(t('Abstand (Sekunden)', 'Interval (seconds)'), 12, 30, { min: 0.5, max: 3600 }),
	count: range(t('Anzahl pro Welle', 'Per wave'), 1, 3, { min: 1, max: 50 }, { int: true }),
	max: int(t('Höchstens gleichzeitig', 'At most at once'), 8, 1, 200),
	...level(1),
	scalePerLevel: num(t('Stärker pro Level (%)', 'Stronger per level (%)'), 0, 0, 500)
});

const ITEM_SPAWN = object(t('Gegenstand-Regel', 'Item rule'), {
	item: ref(t('Gegenstand', 'Item'), 'items'),
	every: range(t('Abstand (Sekunden)', 'Interval (seconds)'), 20, 40, { min: 0.5, max: 3600 }),
	max: int(t('Höchstens gleichzeitig', 'At most at once'), 2, 1, 100),
	...level(1)
});

const LEVEL = object(t('Level', 'Level'), {
	label: str(t('Name', 'Name')),
	view: select(t('Ansicht (beim Start)', 'View (at start)'), ['', ...VIEW_MODES], '', {
		optionLabels: {
			'': t('Unverändert', 'Unchanged'),
			topdown: t('Vogelperspektive', 'Top-down'),
			side: t('Sidescroller', 'Side-scroller')
		}
	}),
	goal: object(t('Ziel', 'Goal'), {
		type: select(t('Ziel', 'Goal'), GOALS, 'score', {
			optionLabels: {
				none: t('Kein Ziel (endlos)', 'No goal (endless)'),
				score: t('Punkte erreichen', 'Reach a score'),
				kills: t('Monster besiegen', 'Beat monsters'),
				survive: t('Überleben (Sekunden)', 'Survive (seconds)'),
				boss: t('Boss besiegen', 'Beat the boss')
			}
		}),
		amount: num(t('Menge', 'Amount'), 500, 0, 1_000_000)
	})
});

const SOUND = object(t('Ton', 'Sound'), {
	wave: select(t('Klang', 'Wave'), ['sine', 'square', 'sawtooth', 'triangle'], 'square'),
	from: num(t('Start (Hz)', 'Start (Hz)'), 440, 20, 8000),
	to: num(t('Ende (Hz)', 'End (Hz)'), 440, 20, 8000),
	seconds: num(t('Länge (Sekunden)', 'Length (seconds)'), 0.12, 0.02, 3),
	volume: num(t('Lautstärke', 'Volume'), 0.5, 0, 1)
});

const textFields = Object.fromEntries(
	TEXT_KEYS.map((key) => [
		key,
		str(t(DEFAULT_TEXTS.de[key], DEFAULT_TEXTS.en[key]), '', { multiline: true })
	])
);

// --- Defaults of the classic game -------------------------------------------------------------

const hero = {
	kind: 'figure',
	label: 'Hero',
	look: 'figure',
	size: 50,
	stats: { hp: 100, attack: 1, defense: 0, speed: 220, dex: 0, luck: 0 },
	behavior: 'stand',
	moves: ['punch', 'kick']
};
const blob = {
	kind: 'monster',
	label: 'Blob',
	look: 'enemy',
	size: 50,
	stats: { hp: 2, attack: 10, defense: 0, speed: 70, dex: 0, luck: 0 },
	behavior: 'chase',
	moves: ['bite'],
	reward: { points: 100 }
};
const car = {
	kind: 'vehicle',
	label: 'Car',
	look: 'car',
	size: 90,
	stats: { hp: 100, attack: 3, defense: 0, speed: 420, accel: 520, handling: 3 },
	behavior: 'arrive',
	moves: []
};

export const PLAY_SCHEMA: ObjectNode = object(t('Spiel', 'Game'), {
	version: int(t('Version', 'Version'), 1, 1, 1000),
	enabled: bool(t('Spiel aktiv', 'Game enabled'), true),
	locale: select(t('Sprache', 'Language'), ['de', 'en'], 'de'),
	view: object(t('Ansicht', 'View'), {
		mode: select(t('Ansicht', 'View'), VIEW_MODES, 'topdown', {
			optionLabels: {
				topdown: t('Vogelperspektive', 'Top-down'),
				side: t('Sidescroller', 'Side-scroller')
			}
		}),
		gravity: num(t('Schwerkraft (px/s²)', 'Gravity (px/s²)'), 1800, 100, 10_000),
		jumpSpeed: num(t('Sprungkraft (px/s)', 'Jump speed (px/s)'), 760, 100, 3000),
		platforms: object(t('Plattformen (Sidescroller)', 'Platforms (side-scroller)'), {
			selector: str(
				t('Seitenelemente zum Draufstehen', 'Page elements to stand on'),
				'h1, h2, h3, img, button, a, p, figure, article'
			),
			minWidth: num(t('Mindestbreite (px)', 'Minimum width (px)'), 60, 10, 2000)
		})
	}),
	game: object(t('Spielregeln', 'Rules'), {
		player: ref(t('Gespielte Figur', 'Played figure'), 'entities', false, 'hero'),
		lives: int(t('Leben (Versuche)', 'Lives'), 1, 1, 99),
		wrap: bool(
			t('Am Seitenende auf der anderen Seite weiter', 'Continue at the other end of the page'),
			true
		),
		overrunSpeed: num(t('Überfahren ab (px/s)', 'Run over from (px/s)'), 140, 0, 5000),
		breakPoints: int(
			t('Punkte pro zerbrochenes Element', 'Points per broken element'),
			10,
			0,
			POINTS.max
		)
	}),
	stats: {
		type: 'record',
		label: t('Werte', 'Stats'),
		help: t('Welche Werte es gibt (Leben, Angriff …).', 'Which stats exist (health, attack …).'),
		idLabel: t('Wert', 'Stat'),
		of: STAT,
		default: {
			hp: { label: 'HP', min: 1, max: 100_000 },
			attack: { label: 'Attack', min: 0, max: 100_000 },
			defense: { label: 'Defense', min: 0, max: 100_000 },
			speed: { label: 'Speed', min: 10, max: 2000 },
			dex: { label: 'Dex', min: 0, max: 1000 },
			luck: { label: 'Luck', min: 0, max: 1000 },
			accel: { label: 'Acceleration', min: 10, max: 5000 },
			handling: { label: 'Handling', min: 0.1, max: 20 }
		},
		maxItems: 30
	},
	sprites: {
		type: 'record',
		label: t('Bilder', 'Pictures'),
		idLabel: t('Bild', 'Picture'),
		of: SPRITE,
		default: {},
		maxItems: 100
	},
	entities: {
		type: 'record',
		label: t('Figuren, Monster und Fahrzeuge', 'Figures, monsters and vehicles'),
		idLabel: t('Name', 'Name'),
		of: ENTITY,
		default: { hero, blob, car },
		maxItems: 100
	},
	moves: {
		type: 'record',
		label: t('Angriffe', 'Moves'),
		idLabel: t('Angriff', 'Move'),
		of: MOVE,
		default: {
			punch: {
				label: 'Punch',
				keys: ['Space'],
				power: 1,
				reach: 30,
				cooldown: 0.22,
				seconds: 0.22,
				push: 260,
				pose: 'punch'
			},
			kick: {
				label: 'Kick',
				keys: ['KeyQ'],
				power: 2,
				reach: 40,
				cooldown: 0.4,
				seconds: 0.4,
				push: 520,
				pose: 'kick'
			},
			bite: {
				label: 'Bite',
				keys: [],
				power: 1,
				reach: 30,
				cooldown: 1.1,
				seconds: 0.2,
				push: 0,
				breaks: false,
				pose: 'bite'
			}
		},
		maxItems: 50
	},
	items: {
		type: 'record',
		label: t('Gegenstände', 'Items'),
		idLabel: t('Gegenstand', 'Item'),
		of: ITEM,
		default: {},
		maxItems: 100
	},
	upgrades: {
		type: 'record',
		label: t('Upgrades', 'Upgrades'),
		idLabel: t('Upgrade', 'Upgrade'),
		of: UPGRADE,
		default: {},
		maxItems: 100
	},
	spawns: {
		type: 'list',
		label: t('Monster erscheinen', 'Monster spawns'),
		of: SPAWN,
		default: [{ entity: 'blob' }],
		maxItems: 50
	},
	itemSpawns: {
		type: 'list',
		label: t('Gegenstände erscheinen', 'Item spawns'),
		of: ITEM_SPAWN,
		maxItems: 50
	},
	visits: object(t('Fahrzeug fährt vor', 'Vehicle drives in'), {
		enabled: bool(t('Ein', 'On'), true),
		vehicle: ref(t('Fahrzeug', 'Vehicle'), 'entities', false, 'car'),
		delay: range(
			t('Besuch nach dem Laden (Sekunden)', 'Visit after page load (seconds)'),
			20,
			60,
			{ min: 1, max: 3600 },
			{
				help: t(
					'Einmal pro Browser-Sitzung, wenn niemand spielt.',
					'Once per browser session while nobody plays.'
				)
			}
		),
		whilePlaying: bool(
			t('Fährt auch während des Spiels vor', 'Also drives in while playing'),
			true
		),
		playDelay: range(
			t('Während des Spiels nach (Sekunden)', 'While playing after (seconds)'),
			8,
			20,
			{
				min: 1,
				max: 3600
			}
		)
	}),
	triggers: { type: 'list', label: t('Auslöser', 'Triggers'), of: TRIGGER, maxItems: 100 },
	levels: { type: 'list', label: t('Level', 'Levels'), of: LEVEL, maxItems: 100 },
	keys: object(t('Tasten', 'Keys'), {
		left: keys(t('Links', 'Left'), ['ArrowLeft', 'KeyA']),
		right: keys(t('Rechts', 'Right'), ['ArrowRight', 'KeyD']),
		up: keys(t('Hoch', 'Up'), ['ArrowUp', 'KeyW']),
		down: keys(t('Runter', 'Down'), ['ArrowDown', 'KeyS']),
		jump: keys(t('Springen und klicken', 'Jump and click'), ['Enter']),
		// Shift too: many keyboards can't register space together with two arrow keys.
		drift: keys(t('Driften', 'Drift'), ['Space', 'ShiftLeft', 'ShiftRight']),
		honk: keys(t('Hupen', 'Honk'), ['Enter', 'KeyH']),
		use: keys(t('Ein- und Aussteigen, Aufheben', 'Get in/out, pick up'), ['KeyE']),
		shop: keys(t('Upgrades öffnen', 'Open upgrades'), ['KeyU'])
	}),
	hint: object(t('Anleitung', 'Instructions'), {
		hideAfter: num(
			t('Klappt ein nach (Sekunden, 0 = nie)', 'Folds away after (seconds, 0 = never)'),
			4,
			0,
			3600
		)
	}),
	audio: object(t('Ton', 'Audio'), {
		enabled: bool(t('Töne', 'Sounds'), false),
		volume: num(t('Lautstärke', 'Volume'), 0.5, 0, 1),
		sounds: {
			type: 'record',
			label: t('Töne', 'Sounds'),
			idLabel: t('Ton', 'Sound'),
			of: SOUND,
			default: {},
			maxItems: 50
		},
		events: {
			type: 'record',
			label: t('Ton bei Ereignis', 'Sound for event'),
			idLabel: t('Ereignis', 'Event'),
			of: ref(t('Ton', 'Sound'), 'audio.sounds', true),
			default: {},
			maxItems: 30
		}
	}),
	progress: object(t('Fortschritt', 'Progress'), {
		save: bool(t('Bestwert im Browser merken', 'Remember the best score in the browser'), true),
		key: str(t('Speicherschlüssel', 'Storage key'), 'hello-eme-play')
	}),
	texts: object(
		t('Texte', 'Texts'),
		textFields,
		t('Leer lassen für den Standardtext.', 'Leave empty for the default text.')
	)
});

/** The classic game's pieces, for presets that start from it. */
export const CLASSIC = { hero, blob, car } as const;
