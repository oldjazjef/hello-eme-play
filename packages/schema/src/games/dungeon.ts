import type { Preset } from '../presets.js';
import { t } from '../dsl.js';
import { creature, icon, person, sprite } from './art.js';
import { drop, monster, MOVES, say, SOUNDS, spawn } from './helpers.js';

export const dungeon: Preset = {
	label: t('Dungeon Dom (Rollenspiel)', 'Dungeon Dom (RPG)'),
	description: t(
		'Ein Ritter mit Schwert (Leertaste) und Schildstoss (Q) erkundet vier Verliesebenen. Ein Wolfswelpe (R rufen) kämpft mit und entwickelt sich weiter. Kaufe Rüstung und Schwerter, sammle Gold und besiege den Drachen.',
		'A knight with a sword (space) and shield bash (Q) explores four dungeon floors. A wolf pup (call with R) fights along and evolves. Buy armor and swords, collect gold and beat the dragon.'
	),
	config: {
		game: { lives: 3, partySize: 2, breakPoints: 10 },
		visits: { enabled: false, whilePlaying: false },
		sprites: {
			knight: sprite(
				person({
					shirt: '#2563eb',
					hat: 'helmet',
					hatColor: '#dc2626',
					holds: 'sword',
					cape: '#7c3aed'
				}),
				58
			),
			skeleton: sprite(
				creature({
					body: '#e2e8f0',
					feature: 'none',
					mood: 'angry',
					belly: '#ffffff',
					fangs: true
				}),
				54
			),
			bat: sprite(
				creature({ body: '#6d28d9', feature: 'wings', accent: '#a78bfa', mood: 'angry' }),
				40
			),
			slime: sprite(creature({ body: '#4ade80', belly: '#bbf7d0' }), 40),
			orc: sprite(
				creature({
					body: '#4d7c0f',
					feature: 'horns',
					accent: '#e2e8f0',
					fangs: true,
					mood: 'angry'
				}),
				70
			),
			wizard: sprite(
				creature({ body: '#7e22ce', feature: 'antenna', accent: '#fde047', cyclops: true }),
				52
			),
			dragon: sprite(
				creature({
					body: '#b91c1c',
					feature: 'wings',
					accent: '#fbbf24',
					fangs: true,
					mood: 'angry',
					pattern: 'spots'
				}),
				130
			),
			wolfpup: sprite(creature({ body: '#94a3b8', feature: 'ears', accent: '#fda4af' }), 44),
			wolf: sprite(
				creature({
					body: '#64748b',
					feature: 'ears',
					accent: '#fb7185',
					mood: 'angry',
					fangs: true
				}),
				60
			),
			direwolf: sprite(
				creature({
					body: '#334155',
					feature: 'ears',
					accent: '#ef4444',
					mood: 'angry',
					fangs: true,
					pattern: 'stripes'
				}),
				80
			),
			axe: sprite(icon('rock', '#94a3b8', '#e2e8f0'), 20),
			bolt: sprite(icon('fireball', '#a855f7', '#e9d5ff'), 24),
			fireb: sprite(icon('bomb', '#7f1d1d', '#f97316'), 30),
			potion: sprite(icon('potion', '#ef4444'), 28),
			gold: sprite(icon('coin', '#facc15'), 24),
			chest: sprite(icon('box', '#92400e', '#facc15'), 36),
			shield: sprite(icon('shield', '#60a5fa'), 30)
		},
		entities: {
			hero: {
				kind: 'figure',
				label: 'Ritter',
				sprite: 'knight',
				size: 58,
				stats: { hp: 130, attack: 1.5, defense: 2, speed: 200, dex: 0, luck: 5 },
				behavior: 'stand',
				moves: ['sword', 'bash']
			},
			skeleton: monster({
				label: 'Skelett',
				sprite: 'skeleton',
				hp: 7,
				attack: 7,
				speed: 70,
				points: 60,
				drops: [{ item: 'gold', chance: 50 }]
			}),
			bat: monster({
				label: 'Fledermaus',
				sprite: 'bat',
				size: 40,
				hp: 2,
				attack: 5,
				speed: 150,
				behavior: 'wander',
				points: 40,
				drops: [{ item: 'gold', chance: 30 }]
			}),
			slime: monster({
				label: 'Schleim',
				sprite: 'slime',
				size: 40,
				hp: 4,
				attack: 4,
				speed: 45,
				behavior: 'wander',
				points: 30,
				extra: { breed: { every: { min: 12, max: 18 }, count: { min: 1, max: 1 }, max: 8 } }
			}),
			orc: monster({
				label: 'Ork',
				sprite: 'orc',
				size: 70,
				hp: 16,
				attack: 12,
				defense: 3,
				speed: 60,
				moves: ['slam'],
				points: 180,
				drops: [{ item: 'potion', chance: 30 }],
				extra: { throws: [{ throwable: 'axt', range: 330, cooldown: 4 }] }
			}),
			wizard: monster({
				label: 'Magier',
				sprite: 'wizard',
				size: 52,
				hp: 9,
				attack: 8,
				speed: 50,
				behavior: 'wander',
				points: 200,
				drops: [{ item: 'chest', chance: 25 }],
				extra: { throws: [{ throwable: 'feuerblitz', range: 420, cooldown: 3 }] }
			}),
			dragon: monster({
				label: 'Drache',
				sprite: 'dragon',
				size: 130,
				hp: 240,
				attack: 20,
				defense: 5,
				speed: 70,
				moves: ['slam'],
				points: 4000,
				extra: {
					boss: true,
					throws: [{ throwable: 'feuerblitz', range: 560, cooldown: 2.2 }],
					phases: [
						{ below: 60, label: 'Der Drache brüllt!', stats: { attack: 6 } },
						{
							below: 30,
							label: 'Der Drache ruft Skelette!',
							do: [{ do: 'spawn', entity: 'skeleton', count: 5, where: 'edge' }]
						}
					]
				}
			}),
			wolfpup: monster({
				label: 'Wolfswelpe',
				sprite: 'wolfpup',
				size: 44,
				hp: 28,
				attack: 4,
				speed: 130,
				moves: ['scratch'],
				points: 0,
				extra: { catchRate: 0, evolve: { kills: 5, maxLevel: 1, into: 'wolf' } }
			}),
			wolf: monster({
				label: 'Wolf',
				sprite: 'wolf',
				size: 60,
				hp: 55,
				attack: 9,
				speed: 150,
				moves: ['chomp'],
				points: 0,
				extra: { catchRate: 0, evolve: { kills: 8, maxLevel: 1, into: 'direwolf' } }
			}),
			direwolf: monster({
				label: 'Schattenwolf',
				sprite: 'direwolf',
				size: 80,
				hp: 110,
				attack: 18,
				speed: 170,
				defense: 4,
				moves: ['chomp'],
				points: 0,
				extra: { catchRate: 0 }
			})
		},
		moves: MOVES,
		throwables: {
			firebomb: {
				label: 'Feuerbombe',
				sprite: 'fireb',
				look: 'bomb',
				size: 30,
				keys: ['KeyG'],
				where: 'foot',
				speed: 420,
				fuse: 1.5,
				bounce: 0.3,
				radius: 120,
				power: 5,
				push: 400,
				breaks: true,
				cooldown: 0.8,
				ammo: 2,
				maxAmmo: 8,
				sound: 'throw',
				explodeSound: 'boom'
			},
			axt: {
				label: 'Wurfaxt',
				sprite: 'axe',
				look: 'rock',
				size: 20,
				speed: 440,
				fuse: 0,
				radius: 0,
				power: 1.4,
				ammo: 1,
				maxAmmo: 1,
				breaks: false,
				where: 'foot'
			},
			feuerblitz: {
				label: 'Feuerblitz',
				sprite: 'bolt',
				look: 'bomb',
				size: 24,
				speed: 400,
				fuse: 1.1,
				radius: 65,
				power: 2,
				breaks: true,
				ammo: 1,
				maxAmmo: 1,
				where: 'foot'
			}
		},
		items: {
			potion: {
				label: 'Heiltrank',
				sprite: 'potion',
				size: 28,
				lifetime: 30,
				do: [
					{ do: 'heal', amount: 50 },
					{ do: 'healParty', amount: 40 }
				]
			},
			gold: {
				label: 'Gold',
				sprite: 'gold',
				size: 24,
				lifetime: 25,
				do: [{ do: 'points', amount: 100 }]
			},
			chest: {
				label: 'Truhe',
				sprite: 'chest',
				size: 36,
				lifetime: 40,
				do: [
					{ do: 'points', amount: 300 },
					{ do: 'heal', amount: 30 },
					{ do: 'ammo', throwable: 'firebomb', amount: 1 },
					say('Eine Truhe!')
				]
			},
			shieldPick: {
				label: 'Schild',
				sprite: 'shield',
				size: 30,
				lifetime: 30,
				do: [
					{ do: 'stat', stat: 'defense', amount: 8, target: 'figure', seconds: 20 },
					say('Schutzschild!')
				]
			}
		},
		upgrades: {
			sword: {
				label: 'Besseres Schwert',
				help: '+1 Angriff',
				cost: 200,
				max: 5,
				stats: { attack: 1 }
			},
			armor: {
				label: 'Rüstung',
				help: '+3 Verteidigung',
				cost: 220,
				max: 5,
				stats: { defense: 3 }
			},
			vit: { label: 'Vitalität', help: '+30 Leben', cost: 180, max: 4, stats: { hp: 30 } },
			boots: { label: 'Stiefel', help: '+20 Tempo', cost: 150, max: 3, stats: { speed: 20 } },
			bombs: {
				label: 'Feuerbomben',
				help: '+2 Feuerbomben',
				cost: 160,
				max: 5,
				minLevel: 2,
				do: [{ do: 'ammo', throwable: 'firebomb', amount: 2 }]
			},
			nurse: {
				label: 'Wolf pflegen',
				help: 'Wolf heilen',
				cost: 80,
				max: 20,
				do: [{ do: 'healParty', amount: 100 }]
			}
		},
		spawns: [
			spawn('skeleton', [6, 10], [1, 2], 6, [1, 100], 8),
			spawn('bat', [8, 12], [1, 2], 4, [1, 100]),
			spawn('slime', [20, 30], [1, 1], 3, [2, 100]),
			spawn('orc', [14, 22], [1, 1], 3, [2, 100]),
			spawn('wizard', [18, 26], [1, 1], 2, [3, 100]),
			spawn('dragon', [4, 4], [1, 1], 1, [4, 100])
		],
		itemSpawns: [
			drop('gold', [8, 14], 3),
			drop('potion', [25, 40], 1),
			drop('chest', [45, 70], 1, [2, 100]),
			drop('shieldPick', [50, 80], 1, [3, 100])
		],
		waves: [
			{
				label: 'Hinterhalt',
				fromLevel: 2,
				toLevel: 2,
				after: 10,
				steps: [
					{ at: 0, do: [say('Ein Hinterhalt!')] },
					{ at: 3, do: [{ do: 'spawn', entity: 'orc', count: 2, where: 'near' }] }
				]
			}
		],
		levels: [
			{ label: 'Ebene 1: Die Katakomben', goal: { type: 'kills', amount: 12 } },
			{ label: 'Ebene 2: Orklager', goal: { type: 'kills', amount: 20 } },
			{ label: 'Ebene 3: Der Magierturm', goal: { type: 'survive', amount: 50 } },
			{ label: 'Ebene 4: Der Drache', goal: { type: 'boss', amount: 1 } }
		],
		triggers: [
			{
				on: 'start',
				once: true,
				do: [
					say('Ein Wolfswelpe schliesst sich dir an! R: rufen. Er wächst, wenn er kämpft.'),
					{ do: 'recruit', entity: 'wolfpup' }
				]
			},
			{ on: 'evolve', do: [say('Dein Wolf hat sich entwickelt!'), { do: 'points', amount: 200 }] },
			{ on: 'faint', do: [say('Der Wolf ist erschöpft. Ein Trank hilft ihm!')] },
			{
				on: 'kill',
				only: 'dragon',
				do: [say('Der Drache ist besiegt!'), { do: 'points', amount: 3000 }]
			}
		],
		texts: {
			keyboardHint:
				'Pfeiltasten oder WASD: laufen · Leertaste: Schwert · Q: Schildstoss · R: Wolf rufen · G: Feuerbombe · U: Upgrades · Esc: beenden',
			sideHint:
				'Pfeiltasten oder WASD: laufen · Leertaste: Schwert · Q: Schildstoss · R: Wolf rufen · G: Feuerbombe · U: Upgrades · Esc: beenden'
		},
		audio: {
			enabled: true,
			sounds: SOUNDS,
			events: {
				kill: 'hit',
				pickup: 'coin',
				levelUp: 'level',
				explode: 'boom',
				evolve: 'evolve',
				faint: 'faint'
			}
		}
	}
};
