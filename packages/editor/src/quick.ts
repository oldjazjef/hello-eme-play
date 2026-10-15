/**
 * "Quick settings": the handful of knobs most people want (difficulty, speed, how many monsters),
 * each reading and writing the same JSON as the full form, so both stay in step. Pure functions.
 */
import { isObject, resolveConfig, t, type PlayConfig, type Text } from '@hello-eme/play-schema';
import { setIn, type Json } from './state.js';

export type QuickValue = number | boolean | string;

export type QuickControl =
	| { kind: 'number'; min: number; max: number; step: number; unit?: string }
	| { kind: 'boolean' }
	| { kind: 'select'; options: readonly { value: string; label: Text }[] };

export interface QuickSetting {
	id: string;
	label: Text;
	help: Text;
	control: QuickControl;
	/** The current value, or undefined when the setting does not apply to this configuration. */
	read: (config: PlayConfig) => QuickValue | undefined;
	/** The stored JSON with the value written (never mutates its input). */
	write: (stored: Json, config: PlayConfig, value: QuickValue) => Json;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** An entity's stat set in the stored JSON. Writing one stat keeps all other entities intact. */
function withStat(stored: Json, config: PlayConfig, id: string, stat: string, value: number): Json {
	// `entities` replaces the defaults as a whole, so a first edit starts from the full set.
	const base = isObject(stored.entities) ? stored.entities : config.entities;
	const entry = isObject(base[id]) ? base[id] : config.entities[id];
	const entities = { ...base, [id]: entry };
	return setIn({ ...stored, entities }, ['entities', id, 'stats', stat], value) as Json;
}

/** The first monster rule, which the monster settings talk about. */
function firstSpawn(config: PlayConfig) {
	return config.spawns[0];
}

function withSpawn(stored: Json, config: PlayConfig, patch: (rule: Json) => Json): Json {
	const base: unknown[] = Array.isArray(stored.spawns)
		? stored.spawns
		: structuredClone(config.spawns);
	const first = isObject(base[0]) ? base[0] : { ...config.spawns[0] };
	return { ...stored, spawns: [patch(first), ...base.slice(1)] };
}

const monsterStat = (
	id: string,
	label: Text,
	help: Text,
	stat: string,
	control: Extract<QuickControl, { kind: 'number' }>
): QuickSetting => ({
	id,
	label,
	help,
	control,
	read: (config) => {
		const rule = firstSpawn(config);
		const value = rule ? config.entities[rule.entity]?.stats[stat] : undefined;
		return value;
	},
	write: (stored, config, value) => {
		const rule = firstSpawn(config);
		return rule && typeof value === 'number'
			? withStat(stored, config, rule.entity, stat, clamp(value, control.min, control.max))
			: stored;
	}
});

const playerStat = (
	id: string,
	label: Text,
	help: Text,
	stat: string,
	control: Extract<QuickControl, { kind: 'number' }>
): QuickSetting => ({
	id,
	label,
	help,
	control,
	read: (config) => config.entities[config.game.player]?.stats[stat],
	write: (stored, config, value) =>
		typeof value === 'number'
			? withStat(stored, config, config.game.player, stat, clamp(value, control.min, control.max))
			: stored
});

export const QUICK_SETTINGS: readonly QuickSetting[] = [
	{
		id: 'view',
		label: t('Ansicht', 'View'),
		help: t(
			'Von oben (frei laufen) oder von der Seite (springen, Seitenelemente als Plattformen).',
			'From above (walk freely) or from the side (jump, page elements as platforms).'
		),
		control: {
			kind: 'select',
			options: [
				{ value: 'topdown', label: t('Vogelperspektive', 'Top-down') },
				{ value: 'side', label: t('Sidescroller', 'Side-scroller') }
			]
		},
		read: (config) => config.view.mode,
		write: (stored, _config, value) => setIn(stored, ['view', 'mode'], value) as Json
	},
	{
		id: 'lives',
		label: t('Leben (Versuche)', 'Lives'),
		help: t(
			'Wie oft man verlieren darf, bevor die Runde zu Ende ist.',
			'How often you may lose before the round ends.'
		),
		control: { kind: 'number', min: 1, max: 9, step: 1 },
		read: (config) => config.game.lives,
		write: (stored, _config, value) =>
			typeof value === 'number'
				? (setIn(stored, ['game', 'lives'], clamp(Math.round(value), 1, 9)) as Json)
				: stored
	},
	playerStat(
		'figureHealth',
		t('Leben der Figur', 'Figure health'),
		t('Wie viel Schaden die Figur aushält.', 'How much damage the figure survives.'),
		'hp',
		{ kind: 'number', min: 10, max: 1000, step: 10 }
	),
	playerStat(
		'figureSpeed',
		t('Tempo der Figur', 'Figure speed'),
		t('Wie schnell die Figur läuft (px/s).', 'How fast the figure walks (px/s).'),
		'speed',
		{ kind: 'number', min: 100, max: 500, step: 10, unit: 'px/s' }
	),
	monsterStat(
		'monsterHealth',
		t('Leben der Monster', 'Monster health'),
		t('Wie viele Treffer ein Monster aushält.', 'How many hits a monster takes.'),
		'hp',
		{ kind: 'number', min: 1, max: 200, step: 1 }
	),
	monsterStat(
		'monsterAttack',
		t('Schaden der Monster', 'Monster damage'),
		t('Wie weh ein Biss tut.', 'How much a bite hurts.'),
		'attack',
		{ kind: 'number', min: 1, max: 50, step: 1 }
	),
	monsterStat(
		'monsterSpeed',
		t('Tempo der Monster', 'Monster speed'),
		t('Wie schnell Monster laufen (px/s).', 'How fast monsters walk (px/s).'),
		'speed',
		{ kind: 'number', min: 20, max: 300, step: 5, unit: 'px/s' }
	),
	{
		id: 'spawnEvery',
		label: t('Neue Monster alle … Sekunden', 'New monsters every … seconds'),
		help: t('Durchschnittlicher Abstand zwischen zwei Wellen.', 'Average time between two waves.'),
		control: { kind: 'number', min: 2, max: 60, step: 1, unit: 's' },
		read: (config) => {
			const rule = firstSpawn(config);
			return rule ? Math.round((rule.every.min + rule.every.max) / 2) : undefined;
		},
		write: (stored, config, value) => {
			if (typeof value !== 'number') return stored;
			const average = clamp(value, 2, 60);
			// The spread stays: waves come a bit earlier or later than the average.
			return withSpawn(stored, config, (rule) => ({
				...rule,
				every: {
					min: Math.max(0.5, Math.round(average * 0.6 * 10) / 10),
					max: Math.round(average * 1.4 * 10) / 10
				}
			}));
		}
	},
	{
		id: 'spawnMax',
		label: t('Höchstens so viele Monster gleichzeitig', 'At most this many monsters at once'),
		help: t(
			'Obergrenze, damit die Seite nicht überrannt wird.',
			'A cap so the page is not overrun.'
		),
		control: { kind: 'number', min: 1, max: 40, step: 1 },
		read: (config) => firstSpawn(config)?.max,
		write: (stored, config, value) =>
			typeof value === 'number'
				? withSpawn(stored, config, (rule) => ({ ...rule, max: clamp(Math.round(value), 1, 40) }))
				: stored
	},
	{
		id: 'visits',
		label: t('Auto fährt von selbst vor', 'Car drives in by itself'),
		help: t(
			'Ein Fahrzeug besucht die Seite, auch wenn niemand spielt.',
			'A vehicle visits the page even when nobody plays.'
		),
		control: { kind: 'boolean' },
		read: (config) => config.visits.enabled,
		write: (stored, _config, value) => setIn(stored, ['visits', 'enabled'], value === true) as Json
	},
	{
		id: 'audio',
		label: t('Töne', 'Sounds'),
		help: t(
			'Spielt Töne bei Treffern, Punkten und mehr.',
			'Plays sounds for hits, points and more.'
		),
		control: { kind: 'boolean' },
		read: (config) => config.audio.enabled,
		write: (stored, _config, value) => setIn(stored, ['audio', 'enabled'], value === true) as Json
	}
];

/** The settings that apply to this configuration, with their current values. */
export function quickValues(config: PlayConfig): { setting: QuickSetting; value: QuickValue }[] {
	return QUICK_SETTINGS.flatMap((setting) => {
		const value = setting.read(config);
		return value === undefined ? [] : [{ setting, value }];
	});
}

/** Writes one setting and returns the new stored JSON. */
export function applyQuick(stored: unknown, setting: QuickSetting, value: QuickValue): Json {
	const base: Json = isObject(stored) ? stored : {};
	return setting.write(base, resolveConfig(base), value);
}
