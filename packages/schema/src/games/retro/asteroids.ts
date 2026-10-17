import type { Preset } from '../../presets.js';
import { t } from '../../dsl.js';
import { icon, sprite } from '../art.js';
import { drop, monster, say, SOUNDS, spawn } from '../helpers.js';
import { asteroid, orb, rocket, saucer } from './art.js';

const rock = (
	label: string,
	picture: string,
	size: number,
	hp: number,
	extra: Record<string, unknown>
) =>
	monster({
		label,
		sprite: picture,
		size,
		hp,
		attack: 40,
		speed: 55,
		behavior: 'drift',
		moves: [`bump${size}`],
		points: hp === 3 ? 20 : hp === 2 ? 50 : 100,
		extra
	});

export const asteroids: Preset = {
	label: t('Steinschlag (Asteroids)', 'Rockfall (Asteroids)'),
	description: t(
		'Ein Raumschiff mit Trägheit: links/rechts drehen, hoch gibt Schub, Leertaste schiesst (gedrückt halten). Grosse Brocken zerfallen in mittlere, mittlere in kleine. Untertassen schiessen zurück, B wirft eine Nova-Bombe.',
		'A spaceship with inertia: left/right turn, up pushes, Space fires (hold it). Big rocks split into medium ones, medium into small. Saucers shoot back, B drops a nova bomb.'
	),
	config: {
		game: {
			lives: 3,
			control: 'ship',
			arena: 'screen',
			wrap: true,
			respawn: 'hit',
			ship: { thrust: 520, turn: 3.8, maxSpeed: 460, drag: 0.35 }
		},
		visits: { enabled: false },
		sprites: {
			ship: sprite(rocket('#38bdf8'), 50, 'right', true),
			rockL: sprite(asteroid('#a8a29e'), 50),
			rockM: sprite(asteroid('#94a3b8'), 50),
			rockS: sprite(asteroid('#78716c'), 50),
			ufo: sprite(saucer('#a78bfa'), 50),
			zapper: sprite(orb('#fde047'), 14),
			zap: sprite(orb('#f87171'), 18),
			nova: sprite(icon('bomb', '#7c3aed', '#fde047'), 30),
			shield: sprite(icon('shield', '#38bdf8'), 34),
			novabox: sprite(icon('box', '#7c3aed', '#fde047'), 34),
			bonus: sprite(icon('gem', '#fbbf24'), 28)
		},
		entities: {
			hero: {
				kind: 'figure',
				label: 'Raumschiff',
				sprite: 'ship',
				size: 46,
				stats: { hp: 40, attack: 1, defense: 0, speed: 200, dex: 0, luck: 0 },
				behavior: 'stand',
				moves: []
			},
			rockL: rock('Grosser Brocken', 'rockL', 92, 3, {
				split: { into: 'rockM', count: { min: 2, max: 2 }, faster: 25 }
			}),
			rockM: rock('Mittlerer Brocken', 'rockM', 56, 2, {
				split: { into: 'rockS', count: { min: 2, max: 3 }, faster: 40 }
			}),
			rockS: rock('Kleiner Brocken', 'rockS', 32, 1, {}),
			ufo: monster({
				label: 'Untertasse',
				sprite: 'ufo',
				size: 58,
				hp: 3,
				attack: 40,
				speed: 95,
				behavior: 'drift',
				moves: [],
				points: 300,
				drops: [{ item: 'bonus', chance: 70 }],
				extra: { throws: [{ throwable: 'zap', range: 760, cooldown: 2 }] }
			})
		},
		moves: {
			bump92: {
				label: 'Bump',
				power: 1,
				reach: 56,
				cooldown: 0.8,
				seconds: 0.1,
				push: 0,
				breaks: false,
				pose: 'bite'
			},
			bump56: {
				label: 'Bump',
				power: 1,
				reach: 36,
				cooldown: 0.8,
				seconds: 0.1,
				push: 0,
				breaks: false,
				pose: 'bite'
			},
			bump32: {
				label: 'Bump',
				power: 1,
				reach: 24,
				cooldown: 0.8,
				seconds: 0.1,
				push: 0,
				breaks: false,
				pose: 'bite'
			}
		},
		throwables: {
			laser: {
				label: 'Laser',
				sprite: 'zapper',
				look: 'bullet',
				size: 14,
				keys: ['Space', 'KeyJ'],
				where: 'foot',
				speed: 900,
				fuse: 0,
				radius: 0,
				power: 1,
				push: 0,
				breaks: false,
				cooldown: 0.2,
				unlimited: true,
				auto: true,
				sound: 'laser'
			},
			nova: {
				label: 'Nova-Bombe',
				sprite: 'nova',
				look: 'bomb',
				size: 30,
				keys: ['KeyB'],
				where: 'foot',
				speed: 0,
				fuse: 1,
				radius: 250,
				power: 8,
				push: 500,
				breaks: false,
				cooldown: 0.8,
				ammo: 1,
				maxAmmo: 5,
				sound: 'throw',
				explodeSound: 'boom'
			},
			zap: {
				label: 'Schuss',
				sprite: 'zap',
				look: 'bullet',
				size: 18,
				speed: 420,
				fuse: 0,
				radius: 0,
				power: 1,
				breaks: false,
				ammo: 0,
				maxAmmo: 1,
				where: 'foot'
			}
		},
		items: {
			shield: {
				label: 'Schutzschild',
				sprite: 'shield',
				size: 34,
				lifetime: 20,
				do: [
					{ do: 'stat', stat: 'defense', amount: 2000, target: 'figure', seconds: 8 },
					say('Schutzschild!')
				]
			},
			novabox: {
				label: 'Nova-Kiste',
				sprite: 'novabox',
				size: 34,
				lifetime: 25,
				do: [{ do: 'ammo', throwable: 'nova', amount: 2 }, say('Nova-Bomben!')]
			},
			bonus: {
				label: 'Kristall',
				sprite: 'bonus',
				size: 28,
				lifetime: 18,
				do: [{ do: 'points', amount: 150 }]
			}
		},
		upgrades: {
			hull: {
				label: 'Panzerung',
				help: '+15 Leben',
				cost: 300,
				max: 4,
				stats: { hp: 15 }
			},
			power: {
				label: 'Laser-Stärke',
				help: '+1 Angriff',
				cost: 450,
				max: 3,
				stats: { attack: 1 }
			},
			rapid: {
				label: 'Feuerrate',
				help: '+20 Geschick: der Laser feuert schneller',
				cost: 250,
				max: 4,
				stats: { dex: 20 }
			},
			novas: {
				label: 'Nova-Vorrat',
				help: '+2 Nova-Bomben',
				cost: 200,
				max: 5,
				do: [{ do: 'ammo', throwable: 'nova', amount: 2 }]
			}
		},
		spawns: [
			spawn('rockL', [4, 6], [1, 2], 5, [1, 100], 8),
			spawn('rockM', [9, 14], [1, 1], 3, [2, 100], 6),
			spawn('ufo', [14, 22], [1, 1], 2, [2, 100])
		],
		itemSpawns: [
			drop('shield', [26, 40], 1),
			drop('novabox', [30, 50], 1),
			drop('bonus', [14, 22], 2)
		],
		levels: [
			{ label: 'Sektor 1: Steinschlag', goal: { type: 'score', amount: 700 } },
			{ label: 'Sektor 2: Untertassen', goal: { type: 'score', amount: 1800 } },
			{ label: 'Sektor 3: Trümmerfeld', goal: { type: 'score', amount: 3400 } },
			{ label: 'Sektor 4: Überleben', goal: { type: 'survive', amount: 60 } }
		],
		triggers: [
			{
				on: 'start',
				once: true,
				do: [say('Pfeile: drehen und Schub · Leertaste: Laser · B: Nova-Bombe')]
			},
			{ on: 'kill', only: 'ufo', do: [say('Untertasse abgeschossen!')] },
			{ on: 'death', do: [say('Schiff zerstört! Neues Schiff am Start.')] }
		],
		texts: {
			keyboardHint:
				'Links/rechts: drehen · Hoch: Schub · Runter: bremsen · Leertaste: Laser (halten) · B: Nova-Bombe · U: Upgrades · Esc: beenden',
			sideHint:
				'Links/rechts: drehen · Hoch: Schub · Runter: bremsen · Leertaste: Laser (halten) · B: Nova-Bombe · U: Upgrades · Esc: beenden'
		},
		audio: {
			enabled: true,
			sounds: {
				...SOUNDS,
				laser: { wave: 'square', from: 1100, to: 260, seconds: 0.09, volume: 0.22 }
			},
			events: { kill: 'hit', pickup: 'coin', levelUp: 'level', explode: 'boom' }
		}
	}
};
