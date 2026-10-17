/** Objects the games lay on the page: trees and walls that block, bushes that hide, spikes that hurt. */
import type { Preset } from '../presets.js';
import { icon, sprite, type IconKind } from './art.js';

type Json = Record<string, unknown>;

interface ObjectSpec {
	id: string;
	label: string;
	icon: IconKind;
	color: string;
	accent?: string;
	size: number;
	/** How many lie over the page from the start. */
	initial: number;
	solid?: boolean;
	hides?: boolean;
	damage?: number;
	who?: 'figure' | 'monsters' | 'all';
}

const TREE: Pick<ObjectSpec, 'icon' | 'color' | 'accent'> = {
	icon: 'tree',
	color: '#22c55e',
	accent: '#bbf7d0'
};
const WALL: Pick<ObjectSpec, 'icon' | 'color' | 'accent'> = {
	icon: 'wall',
	color: '#a8a29e',
	accent: '#57534e'
};
const BRICK: Pick<ObjectSpec, 'icon' | 'color' | 'accent'> = {
	icon: 'wall',
	color: '#c2410c',
	accent: '#fed7aa'
};
const HEDGE: Pick<ObjectSpec, 'icon' | 'color' | 'accent'> = {
	icon: 'hedge',
	color: '#4ade80',
	accent: '#bbf7d0'
};
const SPIKES: Pick<ObjectSpec, 'icon' | 'color' | 'accent'> = {
	icon: 'spikes',
	color: '#cbd5e1',
	accent: '#ef4444'
};
const SPRING: Pick<ObjectSpec, 'icon' | 'color' | 'accent'> = {
	icon: 'spring',
	color: '#38bdf8',
	accent: '#ffffff'
};
const BARRICADE: Pick<ObjectSpec, 'icon' | 'color' | 'accent'> = {
	icon: 'barricade',
	color: '#a16207',
	accent: '#fde047'
};

const SETS: Record<string, ObjectSpec[]> = {
	'game-ememons': [
		{ id: 'tree', label: 'Baum', ...TREE, size: 70, initial: 14, solid: true },
		{ id: 'boulder', label: 'Felsbrocken', ...WALL, size: 58, initial: 6, solid: true },
		{ id: 'tallbush', label: 'Dichter Busch', ...HEDGE, size: 96, initial: 6, hides: true },
		{ id: 'thorns', label: 'Dornen', ...SPIKES, size: 50, initial: 5, damage: 6, who: 'all' },
		{
			id: 'springwater',
			label: 'Heilquelle',
			...SPRING,
			size: 74,
			initial: 2,
			damage: -12,
			who: 'figure'
		}
	],
	'game-bombastic': [
		{ id: 'crate', label: 'Steinblock', ...BRICK, size: 58, initial: 16, solid: true },
		{ id: 'spikes', label: 'Stachelfeld', ...SPIKES, size: 56, initial: 4, damage: 10, who: 'all' }
	],
	'game-roadrage': [
		{ id: 'hedge', label: 'Hecke', ...HEDGE, size: 84, initial: 8, solid: true },
		{ id: 'barrier', label: 'Strassensperre', ...BARRICADE, size: 80, initial: 6, solid: true },
		{ id: 'strip', label: 'Nagelband', ...SPIKES, size: 60, initial: 3, damage: 8, who: 'all' }
	],
	'game-zombies': [
		{ id: 'barricade', label: 'Barrikade', ...BARRICADE, size: 76, initial: 8, solid: true },
		{ id: 'hideout', label: 'Gebüsch', ...HEDGE, size: 90, initial: 5, hides: true },
		{
			id: 'wire',
			label: 'Stacheldraht',
			...SPIKES,
			size: 62,
			initial: 6,
			damage: 7,
			who: 'monsters'
		}
	],
	'game-slimes': [
		{ id: 'crate', label: 'Kiste', ...BRICK, size: 56, initial: 6, solid: true },
		{
			id: 'salt',
			label: 'Salzlache',
			icon: 'spring',
			color: '#f1f5f9',
			accent: '#94a3b8',
			size: 84,
			initial: 6,
			damage: 6,
			who: 'monsters'
		}
	],
	'game-pagio': [
		{ id: 'block', label: 'Steinblock', ...WALL, size: 56, initial: 5, solid: true },
		{ id: 'spikes', label: 'Stacheln', ...SPIKES, size: 50, initial: 5, damage: 14, who: 'figure' }
	],
	'game-dungeon': [
		{ id: 'pillar', label: 'Säule', ...WALL, size: 56, initial: 10, solid: true },
		{ id: 'trap', label: 'Stachelfalle', ...SPIKES, size: 52, initial: 6, damage: 10, who: 'all' },
		{
			id: 'fountain',
			label: 'Brunnen',
			...SPRING,
			size: 70,
			initial: 2,
			damage: -10,
			who: 'figure'
		},
		{
			id: 'curtain',
			label: 'Vorhang',
			icon: 'hedge',
			color: '#a855f7',
			accent: '#e9d5ff',
			size: 90,
			initial: 4,
			hides: true
		}
	],
	'game-laststand': [
		{ id: 'barricade', label: 'Barrikade', ...BARRICADE, size: 80, initial: 8, solid: true },
		{
			id: 'trap',
			label: 'Stachelgrube',
			...SPIKES,
			size: 62,
			initial: 5,
			damage: 9,
			who: 'monsters'
		}
	],
	'game-safari': [
		{ id: 'tree', label: 'Baum', ...TREE, size: 70, initial: 12, solid: true },
		{ id: 'tallbush', label: 'Dichter Busch', ...HEDGE, size: 96, initial: 8, hides: true }
	],
	'game-derby': [
		{ id: 'wall', label: 'Betonblock', ...WALL, size: 70, initial: 8, solid: true },
		{ id: 'strip', label: 'Nagelband', ...SPIKES, size: 64, initial: 5, damage: 10, who: 'all' }
	]
};

/** The preset with its objects added: pictures, items that stay (`pickup: none`) and rules to scatter them. */
export function withObjects(id: string, preset: Preset): Preset {
	const specs = SETS[id] ?? [];
	const config = preset.config as Json;
	const sprites: Json = { ...(config.sprites as Json) };
	const items: Json = { ...(config.items as Json) };
	const rules: Json[] = [...((config.itemSpawns as Json[] | undefined) ?? [])];
	for (const spec of specs) {
		const key = `obj-${spec.id}`;
		sprites[key] = sprite(icon(spec.icon, spec.color, spec.accent), spec.size, 'down', false);
		items[key] = {
			label: spec.label,
			sprite: key,
			size: spec.size,
			pickup: 'none',
			lifetime: 0,
			solid: spec.solid ?? false,
			hides: spec.hides ?? false,
			damage: spec.damage ?? 0,
			damageWho: spec.who ?? 'figure',
			do: []
		};
		rules.push({ item: key, initial: spec.initial, every: { min: 3600, max: 3600 }, max: 1 });
	}
	return { ...preset, config: { ...config, sprites, items, itemSpawns: rules } };
}
