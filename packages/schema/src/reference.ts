/**
 * The configuration reference, generated from the schema: every setting with its type, default and
 * bounds, the events, actions and conditions of triggers, and the keys. The Markdown page
 * (`docs/REFERENCE.md`) and the editor's guide both read this, so they can't drift from the schema.
 * No DOM.
 */
import { isObject, type Node, type Text, type UnionNode } from './dsl.js';
import { PLAY_SCHEMA } from './schema.js';
import { EVENT_NAMES } from './types.js';

export type RefLang = 'de' | 'en';

export interface RefRow {
	/** `entities.<id>.stats.<id>`, `spawns[].every` … */
	path: string;
	label: Text;
	help?: Text;
	/** `number`, `text`, `choice`, `range`, `keys`, `reference`, `group`, `map`, `list` or `object-by-kind` */
	type: string;
	/** What it is when not set, in plain text. */
	default?: string;
	/** Bounds, options or what a reference points to. */
	limits?: string;
}

export interface RefSection {
	/** The top-level key (`entities`). */
	id: string;
	label: Text;
	help?: Text;
	rows: RefRow[];
}

export interface RefVariant {
	id: string;
	label: Text;
	help?: Text;
	rows: RefRow[];
}

export interface RefKey {
	/** The setting that holds it (`keys.left`, `moves.punch.keys`). */
	path: string;
	label: Text;
	keys: string[];
}

export interface Reference {
	sections: RefSection[];
	events: { id: string; label: Text }[];
	actions: RefVariant[];
	conditions: RefVariant[];
	keys: RefKey[];
}

const dash = '–';

function short(text: string, max = 40): string {
	return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function rowOf(path: string, node: Node): RefRow {
	const base = { path, label: node.label, ...(node.help ? { help: node.help } : {}) };
	switch (node.type) {
		case 'number':
			return {
				...base,
				type: node.int ? 'whole number' : 'number',
				default: String(node.default),
				limits: `${node.min}${dash}${node.max}${node.unit ? ` ${node.unit}` : ''}`
			};
		case 'boolean':
			return { ...base, type: 'yes/no', default: String(node.default) };
		case 'string':
			return {
				...base,
				type: 'text',
				default: node.default === '' ? '(empty)' : short(JSON.stringify(node.default))
			};
		case 'select':
			return {
				...base,
				type: 'choice',
				default: node.default === '' ? '(empty)' : node.default,
				limits: node.options.map((option) => (option === '' ? '(empty)' : option)).join(' / ')
			};
		case 'range':
			return {
				...base,
				type: 'range',
				default: `${node.default.min}${dash}${node.default.max}`,
				limits: `${node.min}${dash}${node.max}${node.unit ? ` ${node.unit}` : ''}`
			};
		case 'keys':
			return { ...base, type: 'keys', default: node.default.join(', ') || '(none)' };
		case 'ref':
			return {
				...base,
				type: 'reference',
				default: node.default === '' ? '(none)' : node.default,
				limits: `→ ${node.to}${node.optional ? ' (optional)' : ''}`
			};
		case 'object':
			return { ...base, type: 'group' };
		case 'record':
			return {
				...base,
				type: 'map',
				default: `${Object.keys(node.default).length} entries`,
				limits: `max ${node.maxItems}`
			};
		case 'list':
			return {
				...base,
				type: 'list',
				default: `${(node.default ?? []).length} entries`,
				limits: `max ${node.maxItems}`
			};
		case 'union':
			return { ...base, type: `object by "${node.by}"` };
	}
}

/** Rows for a node and everything below it. Unions found on the way are collected. */
function walk(
	node: Node,
	path: string,
	rows: RefRow[],
	unions: Map<string, UnionNode>,
	own = true
): void {
	if (own) rows.push(rowOf(path, node));
	switch (node.type) {
		case 'object':
			for (const [key, field] of Object.entries(node.fields)) {
				walk(field, path === '' ? key : `${path}.${key}`, rows, unions);
			}
			break;
		case 'record':
			// An object entry's own row would repeat the map's, so only its fields are listed.
			walk(node.of, `${path}.<id>`, rows, unions, node.of.type !== 'object');
			break;
		case 'list':
			walk(node.of, `${path}[]`, rows, unions, node.of.type !== 'object');
			break;
		case 'union':
			unions.set(node.by, node);
			break;
		default:
	}
}

function variantsOf(union: UnionNode | undefined): RefVariant[] {
	if (!union) return [];
	return Object.entries(union.variants).map(([id, variant]) => {
		const rows: RefRow[] = [];
		for (const [key, field] of Object.entries(variant.fields)) {
			walk(field, key, rows, new Map());
		}
		return { id, label: variant.label, ...(variant.help ? { help: variant.help } : {}), rows };
	});
}

function nodeAt(root: Node, ...keys: string[]): Node | undefined {
	return keys.reduce<Node | undefined>(
		(node, key) => (node?.type === 'object' ? node.fields[key] : undefined),
		root
	);
}

function keysOf(): RefKey[] {
	const found: RefKey[] = [];
	const keys = nodeAt(PLAY_SCHEMA, 'keys');
	if (keys?.type === 'object') {
		for (const [key, field] of Object.entries(keys.fields)) {
			if (field.type === 'keys') {
				found.push({ path: `keys.${key}`, label: field.label, keys: [...field.default] });
			}
		}
	}
	const moves = nodeAt(PLAY_SCHEMA, 'moves');
	if (moves?.type === 'record') {
		for (const [id, move] of Object.entries(moves.default)) {
			if (isObject(move) && Array.isArray(move.keys) && move.keys.length > 0) {
				found.push({
					path: `moves.${id}.keys`,
					label: { de: String(move.label ?? id), en: String(move.label ?? id) },
					keys: move.keys.map(String)
				});
			}
		}
	}
	return found;
}

export function buildReference(): Reference {
	const unions = new Map<string, UnionNode>();
	const sections: RefSection[] = Object.entries(PLAY_SCHEMA.fields).map(([id, node]) => {
		const rows: RefRow[] = [];
		walk(node, id, rows, unions);
		return { id, label: node.label, ...(node.help ? { help: node.help } : {}), rows };
	});
	const on = nodeAt(PLAY_SCHEMA, 'triggers');
	const trigger = on?.type === 'list' && on.of.type === 'object' ? on.of : undefined;
	const event = trigger?.fields.on;
	return {
		sections,
		events: EVENT_NAMES.map((id) => ({
			id,
			label: (event?.type === 'select' ? event.optionLabels?.[id] : undefined) ?? { de: id, en: id }
		})),
		actions: variantsOf(unions.get('do')),
		conditions: variantsOf(unions.get('if')),
		keys: keysOf()
	};
}

const TEXT = {
	en: {
		title: 'Configuration reference',
		intro: [
			'Every setting of the game, generated from the schema. All of them are optional: a setting you leave out',
			'takes its default, and a value that is out of bounds is corrected when the game loads (`resolveConfig`).',
			'The editor (`@hello-eme/play-editor`) shows the same settings as a form, with this guide next to it.'
		],
		contents: 'Contents',
		setting: 'Setting',
		type: 'Type',
		default: 'Default',
		limits: 'Allowed',
		meaning: 'What it does',
		events: 'Events',
		eventsIntro: 'A trigger runs when its `on` event happens.',
		actions: 'Actions',
		actionsIntro:
			'What a trigger, an item or an upgrade does (`do`). Each action is an object with `"do": "<name>"`.',
		conditions: 'Conditions',
		conditionsIntro:
			'A trigger runs only if all of its `conditions` hold. Each is an object with `"if": "<name>"`.',
		keys: 'Key codes and default keys',
		keysIntro: [
			'Keys are `KeyboardEvent.code` values: they name the physical key, whatever the keyboard layout.',
			'Common ones: `KeyA`–`KeyZ`, `Digit0`–`Digit9`, `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Space`,',
			'`Enter`, `Tab`, `ShiftLeft`, `ShiftRight`, `ControlLeft`, `AltLeft`. `Escape` always leaves the game.',
			'In the editor, "Press a key" records one. On touch screens the game shows on-screen controls instead.'
		],
		action: 'Does',
		keysCol: 'Default keys',
		field: 'Field'
	},
	de: {
		title: 'Konfigurations-Referenz',
		intro: [
			'Alle Einstellungen des Spiels, aus dem Schema erzeugt. Alle sind optional: Was fehlt, bekommt den Standardwert,',
			'und ein Wert ausserhalb der Grenzen wird beim Laden des Spiels korrigiert (`resolveConfig`).',
			'Der Editor (`@hello-eme/play-editor`) zeigt dieselben Einstellungen als Formular, mit dieser Anleitung daneben.'
		],
		contents: 'Inhalt',
		setting: 'Einstellung',
		type: 'Typ',
		default: 'Standard',
		limits: 'Erlaubt',
		meaning: 'Wirkung',
		events: 'Ereignisse',
		eventsIntro: 'Ein Auslöser läuft, wenn sein `on`-Ereignis eintritt.',
		actions: 'Aktionen',
		actionsIntro:
			'Was ein Auslöser, ein Gegenstand oder ein Upgrade tut (`do`). Jede Aktion ist ein Objekt mit `"do": "<Name>"`.',
		conditions: 'Bedingungen',
		conditionsIntro:
			'Ein Auslöser läuft nur, wenn alle seine `conditions` gelten. Jede ist ein Objekt mit `"if": "<Name>"`.',
		keys: 'Tastencodes und Standardtasten',
		keysIntro: [
			'Tasten sind `KeyboardEvent.code`-Werte: Sie benennen die physische Taste, egal welches Tastaturlayout.',
			'Häufige: `KeyA`–`KeyZ`, `Digit0`–`Digit9`, `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Space`,',
			'`Enter`, `Tab`, `ShiftLeft`, `ShiftRight`, `ControlLeft`, `AltLeft`. `Escape` verlässt das Spiel immer.',
			'Im Editor nimmt „Taste drücken“ eine Taste auf. Auf Touch-Geräten zeigt das Spiel stattdessen Bedienelemente.'
		],
		action: 'Funktion',
		keysCol: 'Standardtasten',
		field: 'Feld'
	}
} as const;

const cell = (text: string): string => text.replaceAll('|', '\\|').replace(/\s+/g, ' ').trim();
const code = (text: string): string => (text === '' ? '' : `\`${text.replaceAll('`', "'")}\``);

function table(rows: readonly RefRow[], lang: RefLang): string[] {
	const words = TEXT[lang];
	return [
		`| ${words.setting} | ${words.type} | ${words.default} | ${words.limits} | ${words.meaning} |`,
		'| --- | --- | --- | --- | --- |',
		...rows.map((row) => {
			const meaning = [row.label[lang], row.help?.[lang]].filter(Boolean).join('. ');
			return `| ${code(row.path)} | ${cell(row.type)} | ${cell(row.default ?? '')} | ${cell(row.limits ?? '')} | ${cell(meaning)} |`;
		})
	];
}

/** The whole reference as one Markdown page. */
export function referenceMarkdown(lang: RefLang): string {
	const reference = buildReference();
	const words = TEXT[lang];
	const lines: string[] = [`# ${words.title}`, '', ...words.intro, '', `## ${words.contents}`, ''];
	for (const section of reference.sections) {
		lines.push(`- [${section.label[lang]}](#${anchor(section.label[lang])}) (\`${section.id}\`)`);
	}
	for (const name of ['events', 'actions', 'conditions', 'keys'] as const) {
		lines.push(`- [${words[name]}](#${anchor(words[name])})`);
	}
	for (const section of reference.sections) {
		lines.push('', `## ${section.label[lang]}`, '');
		if (section.help) lines.push(section.help[lang], '');
		lines.push(...table(section.rows, lang));
	}

	lines.push(
		'',
		`## ${words.events}`,
		'',
		words.eventsIntro,
		'',
		`| \`on\` | ${words.meaning} |`,
		'| --- | --- |'
	);
	for (const event of reference.events)
		lines.push(`| ${code(event.id)} | ${cell(event.label[lang])} |`);

	for (const [name, intro, list, by] of [
		['actions', words.actionsIntro, reference.actions, 'do'],
		['conditions', words.conditionsIntro, reference.conditions, 'if']
	] as const) {
		lines.push('', `## ${words[name]}`, '', intro);
		for (const variant of list) {
			lines.push('', `### ${code(`${by}: ${variant.id}`)} – ${variant.label[lang]}`, '');
			if (variant.help) lines.push(variant.help[lang], '');
			lines.push(...(variant.rows.length > 0 ? table(variant.rows, lang) : ['—']));
		}
	}

	lines.push(
		'',
		`## ${words.keys}`,
		'',
		...words.keysIntro,
		'',
		`| ${words.action} | ${words.setting} | ${words.keysCol} |`,
		'| --- | --- | --- |'
	);
	for (const key of reference.keys) {
		lines.push(
			`| ${cell(key.label[lang])} | ${code(key.path)} | ${key.keys.map(code).join(', ') || '—'} |`
		);
	}
	return `${lines.join('\n')}\n`;
}

/** GitHub's heading anchors: lowercase, spaces to dashes, punctuation dropped. */
function anchor(heading: string): string {
	return heading
		.toLowerCase()
		.replace(/[^\p{L}\p{N}\s-]/gu, '')
		.trim()
		.replace(/\s+/g, '-');
}
