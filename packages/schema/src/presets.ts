/**
 * Ready-made configurations to start from (the CMS offers them as a choice, `examples/` plays
 * them). Each is a JSON like any other: change what you like.
 */
import { t, type Text } from './dsl.js';
import { CLASSIC } from './schema.js';

export interface Preset {
	label: Text;
	description: Text;
	config: Record<string, unknown>;
}

const arcadeItems = {
	heart: {
		label: 'Heart',
		look: 'heart',
		pickup: 'touch',
		lifetime: 20,
		do: [{ do: 'heal', amount: 30 }]
	},
	star: {
		label: 'Star',
		look: 'star',
		lifetime: 25,
		do: [{ do: 'points', amount: 250 }]
	},
	rage: {
		label: 'Rage',
		look: 'bolt',
		lifetime: 25,
		do: [{ do: 'stat', stat: 'attack', amount: 3, target: 'figure', seconds: 12 }]
	},
	portal: {
		label: 'Portal',
		look: 'gem',
		lifetime: 30,
		do: [
			{ do: 'message', text: 'Portal!' },
			{ do: 'setView', mode: 'side' },
			{ do: 'spawn', entity: 'blob', count: 4, where: 'edge' }
		]
	}
};

export const PRESETS: Record<string, Preset> = {
	classic: {
		label: t('Klassisch', 'Classic'),
		description: t(
			'Wie der bisherige Spielmodus: Monster kommen in Wellen, ein Auto fährt vor.',
			'Like the original game mode: monsters in waves, a car drives in.'
		),
		config: {}
	},
	arcade: {
		label: t('Arcade mit Upgrades', 'Arcade with upgrades'),
		description: t(
			'Drei Level, Gegenstände, ein Upgrade-Shop und ein Boss.',
			'Three levels, items, an upgrade shop and a boss.'
		),
		config: {
			audio: {
				enabled: true,
				sounds: {
					hit: { wave: 'square', from: 220, to: 110, seconds: 0.1 },
					coin: { wave: 'triangle', from: 660, to: 990, seconds: 0.15 },
					level: { wave: 'sawtooth', from: 220, to: 880, seconds: 0.4 }
				},
				events: { kill: 'hit', pickup: 'coin', levelUp: 'level' }
			},
			entities: {
				hero: { ...CLASSIC.hero, stats: { ...CLASSIC.hero.stats, attack: 2 } },
				blob: { ...CLASSIC.blob, reward: { points: 100, drops: [{ item: 'heart', chance: 15 }] } },
				brute: {
					kind: 'monster',
					label: 'Brute',
					look: 'enemy',
					size: 70,
					stats: { hp: 8, attack: 18, defense: 2, speed: 60 },
					moves: ['bite'],
					reward: { points: 300, drops: [{ item: 'rage', chance: 30 }] }
				},
				king: {
					kind: 'monster',
					label: 'King',
					look: 'enemy',
					size: 110,
					boss: true,
					stats: { hp: 120, attack: 25, defense: 4, speed: 80 },
					moves: ['bite'],
					reward: { points: 2000, drops: [{ item: 'portal', chance: 100 }] },
					phases: [
						{ below: 50, label: 'The King is furious!', stats: { attack: 10, speed: 30 } },
						{
							below: 25,
							label: 'The King calls his guards!',
							do: [{ do: 'spawn', entity: 'blob', count: 4, where: 'edge' }]
						}
					]
				},
				car: CLASSIC.car
			},
			items: arcadeItems,
			upgrades: {
				muscles: {
					label: 'Muscles',
					help: '+1 attack',
					cost: 200,
					max: 5,
					stats: { attack: 1 }
				},
				boots: {
					label: 'Boots',
					help: '+25 speed',
					cost: 150,
					max: 4,
					stats: { speed: 25 }
				},
				engine: {
					label: 'Engine',
					help: 'Faster car',
					cost: 250,
					max: 3,
					stats: { speed: 60, accel: 80 },
					vehicle: true
				}
			},
			spawns: [
				{
					entity: 'blob',
					every: { min: 8, max: 16 },
					count: { min: 1, max: 3 },
					max: 8,
					scalePerLevel: 15
				},
				{
					entity: 'brute',
					every: { min: 20, max: 35 },
					count: { min: 1, max: 1 },
					max: 3,
					fromLevel: 2
				},
				{
					entity: 'king',
					every: { min: 5, max: 5 },
					count: { min: 1, max: 1 },
					max: 1,
					fromLevel: 3
				}
			],
			itemSpawns: [
				{ item: 'star', every: { min: 20, max: 40 }, max: 2 },
				{ item: 'heart', every: { min: 30, max: 50 }, max: 1, fromLevel: 2 }
			],
			waves: [
				{
					label: 'Ambush',
					fromLevel: 2,
					toLevel: 2,
					after: 5,
					steps: [
						{ at: 0, do: [{ do: 'message', text: 'Ambush!' }] },
						{ at: 5, do: [{ do: 'spawn', entity: 'brute', count: 2, where: 'edge' }] },
						{ at: 20, do: [{ do: 'spawn', entity: 'blob', count: 8, where: 'edge' }] }
					]
				}
			],
			levels: [
				{ label: 'Warm-up', goal: { type: 'score', amount: 500 } },
				{ label: 'Heat', goal: { type: 'kills', amount: 15 } },
				{ label: 'The King', goal: { type: 'boss', amount: 1 } }
			],
			triggers: [
				{
					on: 'kill',
					only: 'king',
					conditions: [],
					do: [
						{ do: 'message', text: 'The King has fallen!' },
						{ do: 'points', amount: 1000 }
					]
				},
				{
					on: 'hurt',
					conditions: [
						{ if: 'health', below: 25 },
						{ if: 'chance', percent: 20 }
					],
					do: [{ do: 'dropItem', item: 'heart' }]
				}
			]
		}
	},
	arsenal: {
		label: t('Arsenal und Fahrzeuge', 'Arsenal and vehicles'),
		description: t(
			'Bomben (G), Steine (T) und Minen aus dem Auto (M); dazu ein Motorrad und ein Laster, die anders fahren und anders einstecken.',
			'Bombs (G), rocks (T) and mines from a vehicle (M), plus a bike and a truck that drive and take hits differently.'
		),
		config: {
			entities: {
				hero: CLASSIC.hero,
				blob: {
					...CLASSIC.blob,
					reward: { points: 100, drops: [{ item: 'bombs', chance: 20 }] }
				},
				car: CLASSIC.car,
				bike: {
					kind: 'vehicle',
					label: 'Bike',
					look: 'car',
					size: 60,
					stats: { hp: 40, attack: 2, speed: 560, accel: 900, handling: 5 },
					behavior: 'arrive',
					drive: { reverse: 80, brake: 1400, grip: 50 },
					ram: { power: 0.5 }
				},
				truck: {
					kind: 'vehicle',
					label: 'Truck',
					look: 'car',
					size: 130,
					stats: { hp: 300, attack: 6, defense: 20, speed: 300, accel: 260, handling: 1.6 },
					behavior: 'arrive',
					drive: { brake: 500, roll: 150, slideGrip: 3 },
					ram: { power: 3, minSpeed: 90 },
					absorbs: true
				}
			},
			throwables: {
				bomb: { label: 'Bomb', keys: ['KeyG'], ammo: 5 },
				rock: {
					label: 'Rock',
					look: 'rock',
					keys: ['KeyT'],
					where: 'foot',
					size: 16,
					speed: 520,
					fuse: 0,
					radius: 0,
					power: 2,
					push: 300,
					breaks: false,
					cooldown: 0.5,
					unlimited: true
				},
				mine: {
					label: 'Mine',
					look: 'mine',
					keys: ['KeyM'],
					where: 'vehicle',
					direction: 'back',
					size: 26,
					speed: 0,
					fuse: 0,
					radius: 90,
					power: 6,
					ammo: 3
				}
			},
			items: {
				bombs: {
					label: 'Bombs',
					look: 'bolt',
					lifetime: 25,
					do: [
						{ do: 'ammo', throwable: 'bomb', amount: 3 },
						{ do: 'ammo', throwable: 'mine', amount: 1 }
					]
				}
			},
			spawns: [
				{ entity: 'blob', every: { min: 8, max: 16 }, count: { min: 1, max: 3 }, max: 8 },
				{ entity: 'bike', every: { min: 40, max: 70 }, count: { min: 1, max: 1 }, max: 1 },
				{ entity: 'truck', every: { min: 60, max: 90 }, count: { min: 1, max: 1 }, max: 1 }
			],
			itemSpawns: [{ item: 'bombs', every: { min: 15, max: 30 }, max: 2 }]
		}
	},
	platformer: {
		label: t('Sidescroller', 'Side-scroller'),
		description: t(
			'Von der Seite: Seitenelemente sind Plattformen, Monster kommen von links und rechts.',
			'From the side: page elements are platforms, monsters come from left and right.'
		),
		config: {
			view: { mode: 'side' },
			visits: { enabled: false, whilePlaying: false },
			spawns: [{ entity: 'blob', every: { min: 6, max: 12 }, count: { min: 1, max: 2 }, max: 6 }]
		}
	},
	'view-switch': {
		label: t('Perspektivwechsel', 'View switch'),
		description: t(
			'Ein Portal-Gegenstand wechselt von der Vogelperspektive zum Sidescroller.',
			'A portal item switches from top-down to side-scroller.'
		),
		config: {
			items: { portal: arcadeItems.portal },
			itemSpawns: [{ item: 'portal', every: { min: 15, max: 25 }, max: 1 }],
			triggers: [
				{ on: 'start', conditions: [], do: [{ do: 'message', text: 'Find the portal!' }] },
				{
					on: 'interval',
					every: 45,
					conditions: [{ if: 'view', mode: 'side' }],
					do: [{ do: 'setView', mode: 'topdown' }]
				}
			]
		}
	},
	explore: {
		label: t('Seite erkunden', 'Explore the page'),
		description: t(
			'Nur anschauen: Die Figur läuft über die Seite. Keine Monster, nichts geht kaputt.',
			'Just look around: the figure walks over the page. No monsters, nothing breaks.'
		),
		config: {
			entities: { hero: { ...CLASSIC.hero, moves: [] } },
			spawns: [],
			visits: { enabled: false, whilePlaying: false }
		}
	},
	navigate: {
		label: t('Navigieren', 'Navigate'),
		description: t(
			'Von der Seite: Springe auf Links und Buttons, um sie anzuklicken. Keine Monster.',
			'From the side: jump onto links and buttons to click them. No monsters.'
		),
		config: {
			view: { mode: 'side' },
			entities: { hero: { ...CLASSIC.hero, moves: [] } },
			spawns: [],
			visits: { enabled: false, whilePlaying: false }
		}
	},
	tour: {
		label: t('Spritztour', 'Car tour'),
		description: t(
			'Ein Auto wartet: einsteigen und über die Seite fahren. Nichts wird überfahren.',
			'A car waits: get in and drive over the page. Nothing is run over.'
		),
		config: {
			game: { overrunSpeed: 5000 },
			entities: { hero: { ...CLASSIC.hero, moves: [] }, car: CLASSIC.car },
			spawns: [],
			visits: {
				enabled: true,
				whilePlaying: true,
				delay: { min: 2, max: 4 },
				playDelay: { min: 2, max: 4 }
			}
		}
	}
};
