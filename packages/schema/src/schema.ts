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
	ATTACK_KINDS,
	CONTROLS,
	PITS,
	WEAK_SIDES,
	HIDEOUT_LOOKS,
	POSES,
	THROWABLE_LOOKS,
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
				where: select(t('Wo', 'Where'), ['edge', 'near', 'figure'], 'edge', {
					optionLabels: {
						edge: t('Am Rand', 'At the edge'),
						near: t('Nahe der Figur', 'Near the figure'),
						figure: t('Vor der Figur, in ihrer Blickrichtung', 'In front of the figure')
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
		ammo: {
			label: t('Wurfobjekte geben', 'Give throwables'),
			fields: {
				throwable: ref(t('Wurfobjekt', 'Throwable'), 'throwables'),
				amount: int(t('Anzahl (minus = abziehen)', 'Amount (negative = take away)'), 3, -999, 999)
			}
		},
		recruit: {
			label: t('Monster ins Team aufnehmen', 'Add a monster to the team'),
			fields: { entity: ref(t('Monster', 'Monster'), 'entities') }
		},
		healParty: {
			label: t('Team heilen', 'Heal the team'),
			fields: {
				amount: num(
					t('Prozent der Lebenspunkte (100 belebt auch)', 'Percent of health (100 also revives)'),
					100,
					1,
					100
				)
			}
		},
		callTeam: {
			label: t('Nächstes Teammitglied rufen', 'Call the next team member'),
			fields: {}
		},
		hazard: {
			label: t('Wurfobjekt auslösen (Falle)', 'Set off a throwable (trap)'),
			fields: {
				throwable: ref(t('Wurfobjekt', 'Throwable'), 'throwables'),
				where: select(t('Wo', 'Where'), ['figure', 'near', 'edge'], 'near', {
					optionLabels: {
						figure: t('Bei der Figur', 'At the figure'),
						near: t('Nahe der Figur', 'Near the figure'),
						edge: t('Am Rand', 'At the edge')
					}
				}),
				count: int(t('Anzahl', 'Count'), 1, 1, 20)
			}
		},
		grow: {
			label: t('Schwanz wachsen lassen', 'Grow the tail'),
			fields: { amount: int(t('Glieder', 'Segments'), 1, 1, 100) }
		},
		toStart: {
			label: t('Figur zurück zum Start', 'Send the figure back to the start'),
			fields: {}
		},
		checkpoint: {
			label: t('Hier ist der neue Startplatz', 'Make this the new starting place'),
			fields: {}
		},
		launch: {
			label: t('Figur hochschleudern (Sidescroller)', 'Launch the figure upwards (side-scroller)'),
			fields: { speed: num(t('Geschwindigkeit (px/s)', 'Speed (px/s)'), 1100, 100, 5000) }
		},
		scare: {
			label: t(
				'Monster erschrecken (sie fliehen, man frisst sie)',
				'Scare the monsters (they flee, you eat them)'
			),
			fields: { seconds: num(t('Sekunden', 'Seconds'), 8, 1, 120) }
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
		ammo: {
			label: t('Munition', 'Ammo'),
			fields: {
				throwable: ref(t('Wurfobjekt', 'Throwable'), 'throwables'),
				min: int(t('Mindestens', 'At least'), 1, 0, 999)
			}
		},
		team: {
			label: t('Teamgrösse', 'Team size'),
			fields: { min: int(t('Mindestens', 'At least'), 1, 0, 100) }
		},
		riding: {
			label: t('Im Fahrzeug', 'In a vehicle'),
			fields: {
				entity: ref(t('Welches (leer: irgendeins)', 'Which (empty: any)'), 'entities', true)
			}
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
			viewChange: t('Die Ansicht wechselt', 'The view switches'),
			key: t('Eine Taste gedrückt wird', 'A key is pressed'),
			catch: t('Ein Monster gefangen wird', 'A monster is caught'),
			escape: t('Ein Monster sich befreit', 'A monster breaks free'),
			encounter: t('Ein Monster aus dem Versteck springt', 'A monster jumps out of hiding'),
			evolve: t('Ein Monster sich entwickelt', 'A monster evolves'),
			faint: t('Ein Teammitglied ohnmächtig wird', 'A team member faints'),
			throw: t('Ein Wurfobjekt geworfen wird', 'A throwable is thrown'),
			explode: t('Ein Wurfobjekt explodiert', 'A throwable goes off'),
			breed: t('Ein Monster Junge bekommt', 'A monster has young'),
			wreck: t('Ein Fahrzeug zerstört wird', 'A vehicle is wrecked'),
			summon: t('Ein Teammitglied gerufen wird', 'A team member is called'),
			touch: t('Ein Objekt berührt wird', 'An object is touched'),
			lost: t('Ein Ball verloren geht', 'A ball is lost'),
			split: t('Ein Monster zerfällt', 'A monster splits up'),
			stomp: t('Die Figur auf ein Monster springt', 'The figure lands on a monster'),
			attack: t('Ein Boss ein Muster ausführt', 'A boss uses a pattern')
		}
	}),
	only: str(
		t(
			'Nur für (Monster, Gegenstand, Upgrade; bei „Ball verloren“ auch left/right/top/bottom)',
			'Only for (monster, item, upgrade; for “ball lost” also left/right/top/bottom)'
		),
		'',
		{ help: t('Leer: für alle.', 'Empty: for all.') }
	),
	every: num(
		t('Sekunden (nur „Alle x Sekunden“)', 'Seconds (“every x seconds” only)'),
		30,
		1,
		3600
	),
	keys: keys(t('Tasten (nur „Eine Taste gedrückt wird“)', 'Keys (“a key is pressed” only)'), [], {
		help: t(
			'Esc ist nicht möglich: es verlässt immer das Spiel.',
			'Esc is not possible: it always leaves the game.'
		)
	}),
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
	}),
	rotate: bool(
		t('Dreht sich in Laufrichtung (Vogelperspektive)', 'Turns to where it goes (top-down)'),
		true,
		{
			help: t(
				'Aus: das Bild bleibt aufrecht und spiegelt sich nur nach links und rechts (für Figuren von vorn).',
				'Off: the picture stays upright and only mirrors left and right (for characters seen from the front).'
			)
		}
	)
});

/** How a vehicle handles; the defaults are the car's. */
export const DRIVE = object(
	t('Fahrverhalten (Fahrzeuge)', 'Handling (vehicles)'),
	{
		reverse: num(t('Rückwärts höchstens (px/s)', 'Top speed in reverse (px/s)'), 160, 0, 2000),
		brake: num(t('Bremsen (px/s²)', 'Braking (px/s²)'), 900, 10, 20_000),
		roll: num(t('Ausrollen (px/s²)', 'Rolling out (px/s²)'), 320, 0, 20_000),
		grip: num(t('Haftung (1/s)', 'Grip (1/s)'), 30, 0.1, 100),
		slideGrip: num(
			t('Haftung mit Handbremse (1/s)', 'Grip with the handbrake (1/s)'),
			1.2,
			0.1,
			100
		),
		maxDrift: num(t('Grösster Driftwinkel (rad)', 'Largest drift angle (rad)'), 1.2, 0, 3),
		handbrakeTurn: num(
			t('Handbremse: engere Kurven (mal)', 'Handbrake: tighter turns (×)'),
			1.8,
			0.1,
			10
		),
		handbrakeDrag: num(
			t('Handbremse: bremst (px/s²)', 'Handbrake: slows down (px/s²)'),
			160,
			0,
			20_000
		)
	},
	t(
		'Wie sich das Fahrzeug anfühlt. Tempo, Beschleunigung und Lenkung stehen bei den Werten.',
		'How the vehicle feels. Speed, acceleration and steering are set under stats.'
	)
);

const RAM = object(t('Rammen (Fahrzeuge)', 'Ramming (vehicles)'), {
	power: num(t('Stärke (mal Angriff)', 'Power (× attack)'), 1, 0, 100),
	minSpeed: num(
		t('Verletzt ab (px/s, 0 = Spielregel)', 'Hurts from (px/s, 0 = game rule)'),
		0,
		0,
		5000
	)
});

const BOSS_ATTACK = object(
	t('Angriffsmuster', 'Attack pattern'),
	{
		kind: select(t('Art', 'Kind'), ATTACK_KINDS, 'fan', {
			optionLabels: {
				fan: t('Fächer von Schüssen (360° = Ring)', 'Fan of shots (360° = ring)'),
				charge: t('Sturmangriff auf die Figur', 'Charge at the figure'),
				rain: t('Regen von Wurfobjekten auf die Figur', 'Rain of throwables on the figure'),
				summon: t('Ruft Monster', 'Calls monsters'),
				teleport: t('Springt an einen anderen Ort', 'Jumps somewhere else')
			}
		}),
		every: num(t('Pause (Sekunden)', 'Pause (seconds)'), 5, 0.2, 600),
		windup: num(t('Vorwarnung (Sekunden)', 'Warning (seconds)'), 0.8, 0, 10),
		fromPhase: int(t('Ab Phase (0 = von Anfang an)', 'From phase (0 = from the start)'), 0, 0, 20),
		toPhase: int(t('Bis Phase (0 = bis zum Ende)', 'Until phase (0 = to the end)'), 0, 0, 20),
		throwable: ref(t('Wurfobjekt (Fächer, Regen)', 'Throwable (fan, rain)'), 'throwables', true),
		entity: ref(t('Monster (Ruft Monster)', 'Monster (calls monsters)'), 'entities', true),
		count: int(
			t('Anzahl (Schüsse, Objekte, Monster)', 'Count (shots, objects, monsters)'),
			8,
			1,
			60
		),
		spread: num(t('Fächerwinkel (Grad)', 'Fan angle (degrees)'), 360, 1, 360),
		range: num(
			t('Nur näher als (px, 0 = überall)', 'Only closer than (px, 0 = anywhere)'),
			0,
			0,
			5000
		),
		boost: num(t('Sturmangriff: Tempo (%)', 'Charge: speed (%)'), 300, 100, 2000),
		seconds: num(t('Sturmangriff: Dauer (Sekunden)', 'Charge: duration (seconds)'), 0.9, 0.1, 10)
	},
	t(
		'Der Boss wiederholt seine Muster der Reihe nach; vor jedem zeigt er kurz an, was kommt.',
		'The boss repeats its patterns; before each one it shows what is coming.'
	)
);

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
			arrive: t('Fährt vor und parkt', 'Drives in and parks'),
			drift: t('Fliegt geradeaus (am Rand weiter)', 'Flies straight (on at the edge)'),
			bounce: t('Prallt ab (Ball)', 'Bounces off things (ball)'),
			patrol: t('Läuft hin und her', 'Walks to and fro'),
			ghost: t('Geist im Gitter (folgt an Kreuzungen)', 'Ghost on the grid (follows at corners)'),
			paddle: t('Schläger (folgt dem Ball)', 'Paddle (follows the ball)')
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
	boss: bool(t('Boss', 'Boss'), false),
	phases: {
		type: 'list',
		label: t('Boss-Phasen', 'Boss phases'),
		help: t(
			'Nur für Bosse: läuft einmal, wenn das Leben unter den Wert fällt.',
			'Bosses only: runs once when health drops below the value.'
		),
		maxItems: 10,
		of: object(t('Phase', 'Phase'), {
			below: num(t('Wenn Leben unter (%)', 'When health below (%)'), 50, 0, 100),
			label: str(t('Meldung', 'Message')),
			stats: {
				type: 'record',
				label: t('Werte ändern (dauerhaft)', 'Change stats (for good)'),
				idLabel: t('Wert', 'Stat'),
				of: num(t('Menge', 'Amount'), 0, -100_000, 100_000),
				default: {},
				maxItems: 30
			},
			do: ACTIONS(t('Dann', 'Then'))
		})
	},
	throws: {
		type: 'list',
		label: t('Wirft (Monster)', 'Throws (monsters)'),
		help: t(
			'Bomben, Steine oder Minen, die das Monster auf die Figur wirft. Sie verletzen die Figur, nie andere Monster, und brauchen keine Munition.',
			'Bombs, rocks or mines the monster throws at the figure. They hurt the figure, never other monsters, and need no ammo.'
		),
		maxItems: 5,
		of: object(t('Wurf', 'Throw'), {
			throwable: ref(t('Wurfobjekt', 'Throwable'), 'throwables'),
			range: num(t('Wirft ab Abstand (px)', 'Throws within (px)'), 350, 20, 3000),
			cooldown: num(t('Pause (Sekunden)', 'Cooldown (seconds)'), 4, 0.2, 600)
		})
	},
	catchRate: num(
		t('Fangbarkeit (%, 0 = nicht fangbar)', 'Catchability (%, 0 = cannot be caught)'),
		100,
		0,
		100
	),
	hideIn: ref(t('Versteckt sich in (Monster)', 'Hides in (monsters)'), 'hideouts', true, ''),
	breed: object(
		t('Vermehrt sich (Monster)', 'Breeds (monsters)'),
		{
			every: range(
				t('Abstand zwischen Würfen (Sekunden, 0 = nie)', 'Between litters (seconds, 0 = never)'),
				0,
				0,
				{ min: 0, max: 3600 }
			),
			count: range(
				t('Junge pro Wurf', 'Young per litter'),
				1,
				1,
				{ min: 1, max: 20 },
				{ int: true }
			),
			max: int(
				t('Kein Wurf ab so vielen gleichzeitig', 'No litter once this many exist'),
				10,
				1,
				200
			),
			into: ref(
				t('Junge sind (leer: gleiche Art)', 'Young are (empty: same kind)'),
				'entities',
				true
			)
		},
		t(
			'Das Monster bekommt von selbst Junge in seiner Nähe. Ohne Grenze würde die Seite überrannt: „Kein Wurf ab …“ zählt alle der Art der Jungen.',
			'The monster has young next to it by itself. “No litter once …” counts all of the young’s kind, so the page is not overrun.'
		)
	),
	evolve: object(
		t('Entwickelt sich (Monster)', 'Evolves (monsters)'),
		{
			every: num(
				t('Neues Level alle (Sekunden, 0 = nie)', 'New level every (seconds, 0 = never)'),
				0,
				0,
				3600
			),
			kills: int(
				t(
					'Neues Level nach besiegten Monstern (0 = nie)',
					'New level after monsters beaten (0 = never)'
				),
				0,
				0,
				1000
			),
			hits: int(
				t(
					'Neues Level nach Treffern auf die Figur (0 = nie)',
					'New level after hits on the figure (0 = never)'
				),
				0,
				0,
				1000
			),
			maxLevel: int(t('Höchstes Level', 'Top level'), 3, 1, 50),
			stats: {
				type: 'record',
				label: t('Werte pro Level', 'Stats per level'),
				idLabel: t('Wert', 'Stat'),
				of: num(t('Menge', 'Amount'), 0, -100_000, 100_000),
				default: {},
				maxItems: 30
			},
			size: num(t('Grösser pro Level (px)', 'Bigger per level (px)'), 0, 0, 200),
			into: ref(
				t(
					'Wird auf dem höchsten Level zu (leer: bleibt)',
					'Becomes at the top level (empty: stays)'
				),
				'entities',
				true
			)
		},
		t(
			'Das Monster wird mit der Zeit oder durch Treffer stärker, grösser und kann sich am Ende in eine andere Art verwandeln.',
			'The monster grows stronger and bigger over time or by hitting, and can turn into another kind at the end.'
		)
	),
	drive: DRIVE,
	ram: RAM,
	absorbs: bool(
		t('Fängt Treffer für die Figur ab (Fahrzeug)', 'Takes the hits for the figure (vehicle)'),
		false,
		{
			help: t(
				'Sitzt die Figur drin, verliert das Fahrzeug Leben statt der Figur. Bei 0 ist es kaputt und die Figur steigt aus.',
				'While the figure sits inside, the vehicle loses health instead. At 0 it is wrecked and the figure gets out.'
			)
		}
	),
	heading: int(
		t(
			'Startrichtung (Grad, 0 = rechts, 90 = unten, -1 = beliebig)',
			'Start direction (degrees, 0 = right, 90 = down, -1 = any)'
		),
		-1,
		-1,
		359,
		{
			help: t(
				'Für „Fliegt geradeaus“, „Prallt ab“ und „Läuft hin und her“.',
				'For “flies straight”, “bounces off things” and “walks to and fro”.'
			)
		}
	),
	shape: select(t('Form', 'Shape'), ['round', 'bar'], 'round', {
		optionLabels: { round: t('Rund', 'Round'), bar: t('Balken (Schläger)', 'Bar (paddle)') },
		help: t(
			'Ein Balken ist so lang wie die Grösse und dünn: ein Ball prallt daran ab.',
			'A bar is as long as the size and thin: a ball bounces off it.'
		)
	}),
	split: object(
		t('Zerfällt (Monster)', 'Splits up (monsters)'),
		{
			into: ref(t('In (leer: verschwindet einfach)', 'Into (empty: just goes)'), 'entities', true),
			count: range(t('Anzahl', 'Count'), 2, 2, { min: 1, max: 12 }, { int: true }),
			faster: num(t('Schneller als das Original (%)', 'Faster than the original (%)'), 20, 0, 500)
		},
		t(
			'Wird das Monster besiegt, entstehen an seinem Ort kleinere (ein grosser Asteroid wird zu mittleren).',
			'When the monster is beaten, smaller ones appear where it was (a big asteroid becomes medium ones).'
		)
	),
	respawn: num(
		t('Kommt zurück nach (Sekunden, 0 = nie)', 'Comes back after (seconds, 0 = never)'),
		0,
		0,
		3600,
		{
			help: t(
				'An seinem Startplatz (Geister im Labyrinth).',
				'At its starting place (ghosts in a maze).'
			)
		}
	),
	weakSpot: object(
		t('Schwachstelle (Boss)', 'Weak spot (boss)'),
		{
			side: select(t('Von wo getroffen', 'Hit from'), WEAK_SIDES, 'any', {
				optionLabels: {
					any: t('Überall (keine Schwachstelle)', 'Anywhere (no weak spot)'),
					front: t('Von vorn', 'From the front'),
					back: t('Von hinten', 'From behind'),
					flank: t('Von der Seite', 'From the side')
				}
			}),
			multiplier: num(t('Schaden von dort (mal)', 'Damage from there (×)'), 2, 0, 100),
			other: num(t('Schaden von anderswo (mal)', 'Damage from elsewhere (×)'), 0.5, 0, 100)
		},
		t(
			'Der Boss steht in Blickrichtung zur Figur: wer hinter ihn kommt, trifft die Schwachstelle.',
			'The boss faces the figure: whoever gets behind it hits the weak spot.'
		)
	),
	shieldedBy: ref(
		t('Geschützt, solange dies lebt (Boss)', 'Shielded while this is alive (boss)'),
		'entities',
		true
	),
	attacks: {
		type: 'list',
		label: t('Angriffsmuster (Boss)', 'Attack patterns (boss)'),
		of: BOSS_ATTACK,
		maxItems: 12
	}
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
	pickup: select(t('Einsammeln', 'Pick up'), ['touch', 'use', 'none'], 'touch', {
		optionLabels: {
			touch: t('Drüberlaufen', 'Walk over it'),
			use: t('Mit Aktionstaste', 'With the use key'),
			none: t('Gar nicht (bleibt als Objekt liegen)', 'Not at all (stays as an object)')
		}
	}),
	lifetime: num(
		t('Verschwindet nach (Sekunden, 0 = nie)', 'Vanishes after (seconds, 0 = never)'),
		20,
		0,
		3600
	),
	solid: bool(t('Versperrt den Weg', 'Blocks the way'), false, {
		help: t(
			'Figur, Monster und Fahrzeuge kommen nicht hindurch (Mauer, Baum, Kiste).',
			'Figures, monsters and vehicles cannot get through (a wall, a tree, a crate).'
		)
	}),
	hides: bool(t('Versteckt, was darin steht', 'Hides what stands in it'), false, {
		help: t(
			'Monster darin sind unsichtbar, die Figur darin sehen Monster nicht mehr (Busch, Zelt).',
			'Monsters inside are invisible, and monsters can no longer see a figure inside (a bush, a tent).'
		)
	}),
	every: num(
		t(
			'Wirkung alle … Sekunden beim Berühren (Objekte)',
			'Effect every … seconds on touch (objects)'
		),
		1,
		0.1,
		3600,
		{
			help: t(
				'Bei Objekten (Einsammeln: gar nicht) läuft die Wirkung, wenn die Figur sie berührt, höchstens so oft.',
				'For objects (pick up: not at all) the effect runs when the figure touches them, at most this often.'
			)
		}
	),
	damage: num(
		t(
			'Schaden pro Sekunde beim Berühren (minus = heilt)',
			'Damage per second on touch (negative = heals)'
		),
		0,
		-1000,
		1000,
		{
			help: t(
				'Stacheln, Lava, eine Heilquelle: wer das Objekt berührt, verliert (oder gewinnt) Leben.',
				'Spikes, lava, a healing spring: whoever touches the object loses (or gains) health.'
			)
		}
	),
	damageWho: select(t('Wirkt auf', 'Affects'), ['figure', 'monsters', 'all'], 'figure', {
		optionLabels: {
			figure: t('Figur und Team', 'The figure and its team'),
			monsters: t('Monster', 'Monsters'),
			all: t('Alle', 'Everyone')
		}
	}),
	box: bool(t('Rechteckige Trefferfläche', 'Rectangular hit area'), false, {
		help: t(
			'Statt rund: ein Rechteck (Ziegel, Plattform). Es passt zum Bild, wenn die Breite stimmt: „Seitenverhältnis“ = Breite ÷ Höhe, „Grösse“ ist die längere Seite.',
			'Instead of round: a rectangle (brick, platform). Match it to the picture with “aspect” = width ÷ height; “size” is the longer side.'
		)
	}),
	aspect: num(t('Seitenverhältnis (Breite ÷ Höhe)', 'Aspect (width ÷ height)'), 1, 0.1, 20),
	platform: bool(t('Zum Draufstehen (Sidescroller)', 'To stand on (side-scroller)'), false, {
		help: t(
			'Von oben betretbar, von unten durchspringbar; schwebt, statt zu fallen.',
			'Can be stood on from above and jumped through from below; it floats instead of falling.'
		)
	}),
	float: bool(t('Schwebt (Sidescroller)', 'Floats (side-scroller)'), false, {
		help: t(
			'Bleibt in der Luft stehen, statt zu Boden zu fallen (Münzen).',
			'Stays in the air instead of falling to the ground (coins).'
		)
	}),
	hp: int(
		t('Treffer bis zum Zerbrechen (0 = unzerbrechlich)', 'Hits until it breaks (0 = unbreakable)'),
		0,
		0,
		100,
		{
			help: t(
				'Ein abprallender Ball trifft es; danach verschwindet es und die Wirkung läuft.',
				'A bouncing ball hits it; then it goes and its effect runs.'
			)
		}
	),
	required: bool(t('Muss weg fürs Ziel „Aufräumen“', 'Must go for the “clear” goal'), false),
	do: ACTIONS(t('Wirkung', 'Effect'))
});

const THROWABLE = object(
	t('Wurfobjekt', 'Throwable'),
	{
		label: str(t('Name', 'Name')),
		sprite: ref(t('Bild', 'Picture'), 'sprites', true),
		look: select(t('Eingebautes Aussehen', 'Built-in look'), THROWABLE_LOOKS, 'bomb', {
			optionLabels: {
				bomb: t('Bombe', 'Bomb'),
				rock: t('Stein', 'Rock'),
				mine: t('Mine', 'Mine'),
				ball: t('Ball (zum Fangen)', 'Ball (for catching)')
			}
		}),
		size: num(t('Grösse (px)', 'Size (px)'), 24, 8, 200),
		keys: keys(t('Tasten', 'Keys'), []),
		where: select(t('Wo einsetzbar', 'Usable'), ['foot', 'vehicle', 'both'], 'both', {
			optionLabels: {
				foot: t('Zu Fuss', 'On foot'),
				vehicle: t('Im Fahrzeug', 'In a vehicle'),
				both: t('Beides', 'Both')
			}
		}),
		direction: select(t('Aus dem Fahrzeug', 'From a vehicle'), ['front', 'back'], 'front', {
			optionLabels: { front: t('Nach vorn', 'To the front'), back: t('Nach hinten', 'To the back') }
		}),
		speed: num(
			t('Wurftempo (px/s, 0 = fallen lassen)', 'Throw speed (px/s, 0 = drop)'),
			420,
			0,
			3000,
			{
				help: t(
					'Aus einem fahrenden Fahrzeug kommt dessen Tempo dazu. Von oben fliegt es etwa Tempo ÷ 3 Pixel weit.',
					'A moving vehicle adds its own speed. From above it flies about speed ÷ 3 pixels.'
				)
			}
		),
		fuse: num(
			t('Zündschnur (Sekunden, 0 = bei Berührung)', 'Fuse (seconds, 0 = on contact)'),
			2,
			0,
			60,
			{
				help: t(
					'0: geht los, wenn es ein Monster berührt, landet oder liegen bleibt (eine fallen gelassene Mine nur bei einem Monster).',
					'0: goes off when it touches a monster, lands or comes to rest (a dropped mine only for a monster).'
				)
			}
		),
		bounce: num(t('Abprallen (0–1, Sidescroller)', 'Bounce (0–1, side-scroller)'), 0.4, 0, 1),
		power: num(t('Stärke (mal Angriff)', 'Power (× attack)'), 5, 0, 1000),
		radius: num(t('Explosionsradius (px)', 'Blast radius (px)'), 110, 0, 1000),
		push: num(t('Rückstoss (px/s)', 'Knockback (px/s)'), 480, 0, 5000),
		breaks: bool(t('Zerschlägt Seitenelemente', 'Breaks page elements'), true),
		hurtsFigure: bool(t('Verletzt auch die Figur', 'Also hurts the figure'), false),
		cooldown: num(t('Pause (Sekunden)', 'Cooldown (seconds)'), 0.6, 0, 60),
		catch: num(
			t('Ball: Fangstärke (1–100, 0 = kein Ball)', 'Ball: catch strength (1–100, 0 = not a ball)'),
			0,
			0,
			100,
			{
				help: t(
					'Ein Ball verletzt nicht: er versucht das Monster zu fangen, das er trifft. Je weniger Leben es hat und je fangbarer es ist, desto eher gelingt es. Gefangene kommen ins Team.',
					'A ball does not hurt: it tries to catch the monster it touches. The less health it has and the more catchable it is, the likelier it works. Caught monsters join the team.'
				)
			}
		),
		ammo: int(t('Start-Vorrat', 'Starting supply'), 5, 0, 999),
		maxAmmo: int(t('Höchstens tragbar', 'Most it can carry'), 20, 1, 999),
		unlimited: bool(t('Unbegrenzt', 'Unlimited'), false),
		auto: bool(t('Taste halten feuert weiter', 'Holding the key keeps firing'), false, {
			help: t(
				'Solange die Taste gedrückt ist, wird es so oft benutzt, wie die Pause erlaubt (Laser).',
				'While the key is held it is used as often as the cooldown allows (a laser).'
			)
		}),
		sound: ref(t('Ton beim Werfen', 'Sound when thrown'), 'audio.sounds', true),
		explodeSound: ref(t('Ton bei der Explosion', 'Sound on the blast'), 'audio.sounds', true)
	},
	t(
		'Bomben, Steine, Minen: die Figur wirft oder legt sie, sie gehen los und verletzen Monster. Munition gibt es als Start-Vorrat und über die Aktion „Wurfobjekte geben“.',
		'Bombs, rocks, mines: the figure throws or drops them, they go off and hurt monsters. Ammo comes as a starting supply and through the “Give throwables” action.'
	)
);

const HIDEOUT = object(
	t('Versteck', 'Hideout'),
	{
		label: str(t('Name', 'Name')),
		sprite: ref(t('Bild (statt Aussehen)', 'Picture (instead of the look)'), 'sprites', true),
		look: select(t('Aussehen', 'Look'), HIDEOUT_LOOKS, 'grass', {
			optionLabels: {
				grass: t('Hohes Gras', 'Tall grass'),
				bush: t('Busch', 'Bush'),
				water: t('Teich', 'Pond'),
				rocks: t('Felsen', 'Rocks')
			}
		}),
		count: int(t('Anzahl Flächen auf der Seite', 'Patches on the page'), 12, 1, 200),
		radius: range(t('Grösse (Radius, px)', 'Size (radius, px)'), 50, 110, { min: 20, max: 400 }),
		encounter: num(
			t(
				'Begegnung (% pro Sekunde beim Durchlaufen)',
				'Encounter (% per second while walking through)'
			),
			45,
			0,
			100
		)
	},
	t(
		'Flächen auf der Seite, in denen sich Monster verstecken (Vogelperspektive). Ein Monster mit „Versteckt sich in“ erscheint unsichtbar darin, bis die Figur hindurchläuft.',
		'Patches on the page where monsters hide (top-down). A monster with “Hides in” appears invisible inside until the figure walks through.'
	)
);

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
	initial: int(t('Am Rundenstart verteilt (Anzahl)', 'Scattered at the start (count)'), 0, 0, 200, {
		help: t(
			'So viele liegen von Anfang an über die ganze Seite verteilt (für Bäume, Mauern, Stacheln).',
			'This many lie spread over the whole page from the start (for trees, walls, spikes).'
		)
	}),
	every: range(t('Abstand (Sekunden)', 'Interval (seconds)'), 20, 40, { min: 0.5, max: 3600 }),
	max: int(t('Höchstens gleichzeitig', 'At most at once'), 2, 1, 100),
	...level(1)
});

const WAVE_STEP = object(t('Schritt', 'Step'), {
	at: num(t('Nach (Sekunden ab Wellenstart)', 'At (seconds after the wave starts)'), 10, 0, 3600),
	every: num(t('Wiederholung alle (Sekunden)', 'Repeat every (seconds)'), 10, 0.5, 3600),
	repeat: int(t('Wie oft wiederholen (0 = einmal)', 'Repeats (0 = once)'), 0, 0, 1000),
	do: ACTIONS(t('Dann', 'Then'))
});

const WAVE = object(
	t('Welle', 'Wave'),
	{
		label: str(t('Name', 'Name')),
		...level(1),
		after: num(
			t('Start nach Levelbeginn (Sekunden)', 'Starts after the level began (seconds)'),
			0,
			0,
			3600
		),
		steps: { type: 'list', label: t('Schritte', 'Steps'), of: WAVE_STEP, maxItems: 30 }
	},
	t(
		'Ein kleines Drehbuch: jeder Schritt läuft zu seiner Zeit, in jedem Level des Bereichs von vorn.',
		'A small script: every step runs at its time, restarted in each level of the range.'
	)
);

const MAP_SYMBOL = object(t('Zeichen', 'Symbol'), {
	item: ref(t('Gegenstand', 'Item'), 'items', true),
	entity: ref(t('Figur oder Monster', 'Figure or monster'), 'entities', true),
	angle: int(
		t('Startrichtung (Grad, -1 = eigene)', 'Start direction (degrees, -1 = its own)'),
		-1,
		-1,
		359
	),
	start: bool(t('Hier startet die Figur', 'The figure starts here'), false)
});

const MAP = object(
	t('Karte', 'Map'),
	{
		label: str(t('Name', 'Name')),
		rows: {
			type: 'list',
			label: t('Zeilen (jedes Zeichen ist ein Feld)', 'Rows (every character is a cell)'),
			of: str(t('Zeile', 'Row')),
			default: [],
			maxItems: 60
		},
		cell: num(t('Feldgrösse (px)', 'Cell size (px)'), 40, 12, 200),
		align: select(t('Lage im Fenster', 'Place in the window'), ['center', 'bottom'], 'center', {
			optionLabels: {
				center: t('In der Mitte', 'In the middle'),
				bottom: t('Am Boden (Sidescroller)', 'On the ground (side-scroller)')
			}
		}),
		legend: {
			type: 'record',
			label: t('Zeichen', 'Symbols'),
			idLabel: t('Zeichen', 'Character'),
			of: MAP_SYMBOL,
			default: {},
			maxItems: 40
		}
	},
	t(
		'Ein Level als Text, in die Mitte des Fensters gesetzt: # Mauer, . Punkt … was jedes Zeichen bedeutet, steht in der Legende.',
		'A level as text, put in the middle of the window: # wall, . dot … the legend says what each character means.'
	)
);

const LEVEL = object(t('Level', 'Level'), {
	label: str(t('Name', 'Name')),
	map: ref(t('Karte (beim Start aufgebaut)', 'Map (built at the start)'), 'maps', true),
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
				boss: t('Boss besiegen', 'Beat the boss'),
				clear: t('Alles Nötige einsammeln oder zerbrechen', 'Collect or break everything required')
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

const FIELDS: Record<string, Node> = {
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
		airJumps: int(
			t('Sprünge in der Luft (Sidescroller)', 'Jumps in the air (side-scroller)'),
			0,
			0,
			5
		),
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
		),
		partySize: int(t('Grösse des Teams', 'Team size'), 6, 1, 100),
		control: select(t('Steuerung', 'Controls'), CONTROLS, 'walk', {
			optionLabels: {
				walk: t('Laufen', 'Walk'),
				ship: t('Raumschiff (drehen, Schub, Trägheit)', 'Spaceship (turn, thrust, inertia)'),
				grid: t(
					'Feld für Feld (Snake, Pac-Man, Frogger)',
					'Cell by cell (snake, Pac-Man, Frogger)'
				),
				slide: t('Schläger (nur entlang einer Kante)', 'Paddle (only along one edge)')
			}
		}),
		slideAxis: select(t('Schläger gleitet', 'Paddle slides'), ['x', 'y'], 'x', {
			optionLabels: {
				x: t('Waagrecht, unten', 'Sideways, at the bottom'),
				y: t('Senkrecht, links', 'Up and down, at the left')
			}
		}),
		arena: select(t('Spielfeld', 'Play area'), ['page', 'screen'], 'page', {
			optionLabels: {
				page: t('Ganze Seite', 'The whole page'),
				screen: t('Das Fenster (die Seite bleibt stehen)', 'The window (the page stays put)')
			}
		}),
		pit: select(t('Ball geht verloren am Rand', 'A ball is lost at the edge'), PITS, 'none', {
			optionLabels: {
				none: t('Nirgends', 'Nowhere'),
				bottom: t('Unten', 'Bottom'),
				top: t('Oben', 'Top'),
				left: t('Links', 'Left'),
				right: t('Rechts', 'Right'),
				leftright: t('Links und rechts', 'Left and right'),
				topbottom: t('Oben und unten', 'Top and bottom')
			}
		}),
		respawn: select(t('Nach einem Treffer', 'After a hit'), ['stay', 'death', 'hit'], 'stay', {
			optionLabels: {
				stay: t('Weiter am Ort', 'Carry on where it is'),
				death: t(
					'Verlorenes Leben: zurück zum Startplatz',
					'Life lost: back to the starting place'
				),
				hit: t(
					'Jeder Treffer kostet ein Leben und schickt zurück zum Start',
					'Every hit costs a life and sends back to the start'
				)
			}
		}),
		stomp: num(
			t('Draufspringen (mal Angriff, 0 = aus)', 'Stomping (× attack, 0 = off)'),
			0,
			0,
			100
		),
		ship: object(t('Raumschiff', 'Spaceship'), {
			thrust: num(t('Schub (px/s²)', 'Thrust (px/s²)'), 520, 10, 10_000),
			turn: num(t('Drehen (rad/s)', 'Turning (rad/s)'), 3.6, 0.2, 20),
			maxSpeed: num(t('Höchsttempo (px/s)', 'Top speed (px/s)'), 480, 20, 5000),
			drag: num(t('Bremsung ohne Schub (1/s)', 'Slowing without thrust (1/s)'), 0.35, 0, 20)
		}),
		grid: object(t('Feld für Feld', 'Cell by cell'), {
			cell: num(t('Feldgrösse (px)', 'Cell size (px)'), 40, 12, 200),
			auto: bool(t('Läuft von selbst weiter', 'Keeps moving by itself'), true),
			crash: bool(t('Wand oder eigener Schwanz tut weh', 'A wall or its own tail hurts'), false),
			tail: bool(t('Schwanz wächst (Snake)', 'A tail grows (snake)'), false)
		})
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
	throwables: {
		type: 'record',
		label: t('Wurfobjekte', 'Throwables'),
		idLabel: t('Wurfobjekt', 'Throwable'),
		of: THROWABLE,
		default: {},
		maxItems: 50
	},
	hideouts: {
		type: 'record',
		label: t('Verstecke', 'Hideouts'),
		idLabel: t('Versteck', 'Hideout'),
		of: HIDEOUT,
		default: {},
		maxItems: 20
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
	maps: {
		type: 'record',
		label: t('Karten', 'Maps'),
		idLabel: t('Karte', 'Map'),
		of: MAP,
		default: {},
		maxItems: 30
	},
	waves: {
		type: 'list',
		label: t('Wellen (Drehbücher)', 'Waves (scripts)'),
		of: WAVE,
		maxItems: 50
	},
	triggers: { type: 'list', label: t('Auslöser', 'Triggers'), of: TRIGGER, maxItems: 100 },
	levels: { type: 'list', label: t('Level', 'Levels'), of: LEVEL, maxItems: 100 },
	keys: object(t('Tasten', 'Keys'), {
		left: keys(t('Links', 'Left'), ['ArrowLeft', 'KeyA']),
		right: keys(t('Rechts', 'Right'), ['ArrowRight', 'KeyD']),
		up: keys(t('Hoch', 'Up'), ['ArrowUp', 'KeyW']),
		down: keys(t('Runter', 'Down'), ['ArrowDown', 'KeyS']),
		jump: keys(t('Springen und klicken', 'Jump and click'), ['KeyE']),
		// Shift too: many keyboards can't register space together with two arrow keys.
		drift: keys(t('Driften', 'Drift'), ['Space', 'ShiftLeft', 'ShiftRight']),
		honk: keys(t('Hupen', 'Honk'), ['Enter', 'KeyH']),
		use: keys(t('Ein- und Aussteigen, Aufheben', 'Get in/out, pick up'), ['KeyF']),
		shop: keys(t('Upgrades öffnen', 'Open upgrades'), ['KeyU']),
		hint: keys(t('Anleitung ein- und ausblenden', 'Show and hide the instructions'), ['KeyI']),
		party: keys(t('Nächstes Teammitglied rufen', 'Call the next team member'), ['KeyR'])
	}),
	hint: object(t('Anleitung', 'Instructions'), {
		hideAfter: num(
			t('Klappt ein nach (Sekunden, 0 = nie)', 'Folds away after (seconds, 0 = never)'),
			4,
			0,
			3600
		),
		pauseWhileOpen: bool(
			t(
				'Spiel pausiert, solange die Anleitung ausgeklappt ist',
				'Pause the game while the instructions are open'
			),
			false,
			{
				help: t(
					'Die Anleitung steht beim Start offen: das Spiel beginnt, wenn sie eingeklappt wird (von Hand oder nach „Klappt ein nach“; 0 = bis du sie schliesst).',
					'The instructions are open at the start: the game begins when they fold away (by hand or after “Folds away after”; 0 = until you close them).'
				)
			}
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
};

/** What a page may change: everything except `pages` itself (no nesting). */
export const PAGE_CONFIG: ObjectNode = object(
	t('Einstellungen dieser Seite', 'Settings of this page'),
	FIELDS,
	t(
		'Nur eintragen, was anders ist: Objekte werden zusammengeführt, Listen ersetzt.',
		'Only enter what differs: objects are merged, lists are replaced.'
	)
);

const PAGE = object(t('Seite', 'Page'), {
	match: str(t('Adresse (Muster)', 'Path (pattern)'), '*', {
		help: t(
			'Zum Beispiel /blog/*, /projekte oder * für alle. Passt mehr als ein Eintrag, werden sie der Reihe nach angewendet.',
			'For example /blog/*, /projects or * for all. When several entries match, they apply in order.'
		)
	}),
	config: PAGE_CONFIG
});

export const PLAY_SCHEMA: ObjectNode = object(t('Spiel', 'Game'), {
	...FIELDS,
	pages: {
		type: 'list',
		label: t('Pro Seite anders', 'Per page'),
		of: PAGE,
		maxItems: 50
	}
});

/** The classic game's pieces, for presets that start from it. */
export const CLASSIC = { hero, blob, car } as const;
