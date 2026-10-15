import { defaultOf, isObject, lookup, type Node, type UnionNode } from '@hello-eme/play-schema';
import type { Lang } from './labels.js';

const WORDS = {
	de: {
		when: 'Wenn',
		every: 'alle {n} Sekunden',
		onlyIf: 'nur wenn',
		then: 'dann',
		once: 'einmal'
	},
	en: { when: 'When', every: 'every {n} seconds', onlyIf: 'only if', then: 'then', once: 'once' }
} as const;

/** One value as a person reads it: an option's label, an entity's name, or the plain text. */
function show(node: Node, value: unknown, root: unknown, lang: Lang): string {
	if (node.type === 'select') {
		const label = node.optionLabels?.[String(value)];
		return label ? label[lang] : String(value);
	}
	if (node.type === 'ref') {
		const target = lookup(root, `${node.to}.${String(value)}`);
		return isObject(target) && typeof target.label === 'string' && target.label !== ''
			? target.label
			: String(value);
	}
	return String(value);
}

/** "Label (value, value)" for one entry of a union (a condition or an action). */
function describeVariant(node: UnionNode, entry: unknown, root: unknown, lang: Lang): string {
	if (!isObject(entry)) return '';
	const variant = node.variants[String(entry[node.by])];
	if (!variant) return String(entry[node.by]);
	const values = Object.entries(variant.fields).flatMap(([key, field]) => {
		const value = entry[key] ?? defaultOf(field);
		return value === undefined || value === '' ? [] : [show(field, value, root, lang)];
	});
	return values.length > 0 ? `${variant.label[lang]} (${values.join(', ')})` : variant.label[lang];
}

/** The parts of a trigger in words; `describeTrigger` and the flow view both build on them. */
export interface TriggerParts {
	/** "a monster is beaten" / "every 30 seconds" */
	event: string;
	/** The `only` filter (an entity, item or upgrade id), shown as written. */
	only: string;
	conditions: string[];
	actions: string[];
	once: boolean;
}

function listText(field: Node | undefined, value: unknown, root: unknown, lang: Lang): string[] {
	return field?.type === 'list' && field.of.type === 'union' && Array.isArray(value)
		? value.map((entry) => describeVariant(field.of as UnionNode, entry, root, lang))
		: [];
}

/** The actions of a list node (`do`) as short texts, one per action. */
export const describeActions = listText;

/** `node` is the trigger's object node, `root` the resolved config. Undefined for anything else. */
export function triggerParts(
	node: Node,
	item: unknown,
	root: unknown,
	lang: Lang
): TriggerParts | undefined {
	if (node.type !== 'object' || !isObject(item)) return undefined;
	const defaults = defaultOf(node);
	const trigger: Record<string, unknown> = { ...(isObject(defaults) ? defaults : {}), ...item };
	const on = node.fields.on;
	if (on?.type !== 'select') return undefined;
	const event =
		trigger.on === 'interval'
			? WORDS[lang].every.replace('{n}', String(trigger.every))
			: show(on, trigger.on, root, lang);
	return {
		event,
		only: typeof trigger.only === 'string' ? trigger.only : '',
		conditions: listText(node.fields.conditions, trigger.conditions, root, lang),
		actions: listText(node.fields.do, trigger.do, root, lang),
		once: trigger.once === true
	};
}

/**
 * A trigger as one sentence: "When a monster is beaten, only if Score (100), then spawn
 * monsters (Blob, 3, At the edge)". `node` is the trigger's object node, `root` the resolved config.
 */
export function describeTrigger(node: Node, item: unknown, root: unknown, lang: Lang): string {
	const parts = triggerParts(node, item, root, lang);
	if (!parts) return '';
	const words = WORDS[lang];
	const only = parts.only !== '' ? ` (${parts.only})` : '';
	return [
		`${words.when} ${parts.event}${only}`,
		parts.conditions.length > 0 ? `${words.onlyIf} ${parts.conditions.join(' + ')}` : '',
		parts.once ? words.once : '',
		`${words.then} ${parts.actions.length > 0 ? parts.actions.join(', ') : '…'}`
	]
		.filter(Boolean)
		.join(', ');
}
