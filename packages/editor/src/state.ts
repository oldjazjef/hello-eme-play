/** Pure helpers on JSON values (no React, no DOM). All updates are immutable. */
import {
	defaultOf,
	isObject,
	lookup,
	type Node,
	type Text,
	type UnionNode
} from '@hello-eme/play-schema';
import type { Lang } from './labels.js';

export type Json = Record<string, unknown>;
export type PathKey = string | number;

export const pick = (text: Text, lang: Lang): string => text[lang];

/** Reads `root[path[0]][path[1]] …`; `undefined` when something on the way is missing. */
export function getIn(root: unknown, path: readonly PathKey[]): unknown {
	return path.reduce<unknown>((found, key) => {
		if (Array.isArray(found) && typeof key === 'number') return found[key];
		return isObject(found) ? found[String(key)] : undefined;
	}, root);
}

/** `value` for one key of an object; `undefined` removes the key. */
export function setKey(source: unknown, key: string, value: unknown): Json {
	const rest = Object.fromEntries(
		Object.entries(isObject(source) ? source : {}).filter(([name]) => name !== key)
	);
	if (value === undefined) return rest;
	// Replacing an existing key keeps its place in the order.
	return isObject(source) && key in source
		? { ...source, [key]: value }
		: { ...rest, [key]: value };
}

/** Sets a value deep inside; missing objects are created, `undefined` removes the key. */
export function setIn(root: unknown, path: readonly PathKey[], value: unknown): unknown {
	const [head, ...rest] = path;
	if (head === undefined) return value;
	if (Array.isArray(root) && typeof head === 'number') {
		const copy = [...root];
		copy[head] = setIn(copy[head], rest, value);
		return copy;
	}
	const key = String(head);
	return setKey(root, key, setIn(isObject(root) ? root[key] : undefined, rest, value));
}

/** An empty plain object counts as "nothing written". */
export const isEmptyObject = (value: unknown): boolean =>
	isObject(value) && Object.keys(value).length === 0;

/** Renames a key and keeps its place in the order. Unchanged when the new key is empty or taken. */
export function renameKey(source: Json, from: string, to: string): Json {
	const name = to.trim();
	if (name === '' || name === from || name in source || !(from in source)) return source;
	return Object.fromEntries(
		Object.entries(source).map(([key, value]) => [key === from ? name : key, value])
	);
}

/** `base`, or `base-2`, `base-3` … the first name not yet used. */
export function uniqueKey(source: Json, base: string): string {
	if (!(base in source)) return base;
	for (let n = 2; ; n++) {
		if (!(`${base}-${n}` in source)) return `${base}-${n}`;
	}
}

/** Copies an entry right behind the original under a new key. */
export function duplicateKey(source: Json, key: string): Json {
	if (!(key in source)) return source;
	const copyKey = uniqueKey(source, `${key}-copy`);
	return Object.fromEntries(
		Object.entries(source).flatMap(([name, value]) =>
			name === key
				? [
						[name, value],
						[copyKey, structuredClone(value)]
					]
				: [[name, value]]
		)
	);
}

export function removeKey(source: Json, key: string): Json {
	return setKey(source, key, undefined);
}

/** Moves a list item; out-of-range positions leave the list as it is. */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
	const copy = [...list];
	const item = copy[from];
	if (item === undefined || to < 0 || to >= copy.length || from === to) return copy;
	copy.splice(from, 1);
	copy.splice(to, 0, item);
	return copy;
}

export const removeAt = <T>(list: readonly T[], index: number): T[] =>
	list.filter((_, at) => at !== index);

export const replaceAt = <T>(list: readonly T[], index: number, item: T): T[] =>
	list.map((existing, at) => (at === index ? item : existing));

/** Key codes typed as `Space, KeyQ` → `['Space', 'KeyQ']` (no duplicates, no blanks). */
export function parseKeys(text: string): string[] {
	return [
		...new Set(
			text
				.split(',')
				.map((key) => key.trim())
				.filter(Boolean)
		)
	];
}

/** The list of a `keys` value (the schema accepts a single string too). */
export function keyList(value: unknown, fallback: readonly string[]): string[] {
	const list = (Array.isArray(value) ? value : [value]).filter(
		(key): key is string => typeof key === 'string' && key.trim() !== ''
	);
	return list.length > 0 ? list : [...fallback];
}

/** The fields of a union variant with their defaults, tagged with the variant's name. */
export function unionDefaults(node: UnionNode, variant: string): Json {
	const fields = node.variants[variant]?.fields ?? {};
	return {
		[node.by]: variant,
		...Object.fromEntries(
			Object.entries(fields)
				.map(([key, field]) => [key, defaultOf(field)] as const)
				.filter(([, value]) => value !== undefined)
		)
	};
}

/** What "add" puts into a record or list: objects start empty (defaults fill in), the rest default. */
export function newItem(node: Node): unknown {
	switch (node.type) {
		case 'object':
			return {};
		case 'union': {
			const first = Object.keys(node.variants)[0];
			return first === undefined ? undefined : unionDefaults(node, first);
		}
		default:
			return defaultOf(node);
	}
}

export interface RefOption {
	id: string;
	/** The entry's own `label` when it has one. */
	label?: string;
}

/** The ids a `ref` can point to: the keys of the record at `to` (dotted) in the resolved config. */
export function refOptions(root: unknown, to: string): RefOption[] {
	const target = lookup(root, to);
	if (!isObject(target)) return [];
	return Object.entries(target).map(([id, entry]) => {
		const label = isObject(entry) && typeof entry.label === 'string' ? entry.label : undefined;
		return label === undefined ? { id } : { id, label };
	});
}

/** The heading of a list item or record entry: a union's variant, an own `label`, or a fallback. */
export function itemTitle(node: Node, item: unknown, fallback: string, lang: Lang): string {
	if (node.type === 'union' && isObject(item)) {
		const variant = node.variants[String(item[node.by])];
		if (variant) return pick(variant.label, lang);
	}
	if (isObject(item) && typeof item.label === 'string' && item.label !== '') return item.label;
	return fallback;
}

/** Counts shown in the summary line. */
export function countEntries(config: unknown, key: string): number {
	const part = isObject(config) ? config[key] : undefined;
	if (Array.isArray(part)) return part.length;
	return isObject(part) ? Object.keys(part).length : 0;
}

/** Payload's `validate`: lenient, only a non-object cannot be saved. */
export function objectProblem(value: unknown): string | undefined {
	return value === null || value === undefined || isObject(value)
		? undefined
		: 'The configuration must be a JSON object.';
}
