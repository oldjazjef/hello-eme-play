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

/**
 * A trigger as one sentence: "When a monster is beaten, only if Score (100), then spawn
 * monsters (Blob, 3, At the edge)". `node` is the trigger's object node, `root` the resolved config.
 */
export function describeTrigger(node: Node, item: unknown, root: unknown, lang: Lang): string {
	if (node.type !== 'object' || !isObject(item)) return '';
	const defaults = defaultOf(node);
	const trigger: Record<string, unknown> = { ...(isObject(defaults) ? defaults : {}), ...item };
	const words = WORDS[lang];
	const on = node.fields.on;
	const conditions = node.fields.conditions;
	const actions = node.fields.do;
	if (on?.type !== 'select') return '';

	const event =
		trigger.on === 'interval'
			? words.every.replace('{n}', String(trigger.every))
			: show(on, trigger.on, root, lang);
	const only = typeof trigger.only === 'string' && trigger.only !== '' ? ` (${trigger.only})` : '';
	const list = (field: Node | undefined, value: unknown): string[] =>
		field?.type === 'list' && field.of.type === 'union' && Array.isArray(value)
			? value.map((entry) => describeVariant(field.of as UnionNode, entry, root, lang))
			: [];
	const conditionText = list(conditions, trigger.conditions);
	const actionText = list(actions, trigger.do);
	return [
		`${words.when} ${event}${only}`,
		conditionText.length > 0 ? `${words.onlyIf} ${conditionText.join(' + ')}` : '',
		trigger.once === true ? words.once : '',
		`${words.then} ${actionText.length > 0 ? actionText.join(', ') : '…'}`
	]
		.filter(Boolean)
		.join(', ');
}
