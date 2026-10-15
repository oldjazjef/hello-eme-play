/**
 * The schema is data: a tree of nodes that says which settings exist, their defaults, bounds and
 * labels. One generic `resolve` (fills defaults, fixes nonsense), one generic `problems` (explains
 * what would be fixed) and one `toJsonSchema` all read that tree, and the Payload form renders it,
 * so a new setting is one line in `schema.ts` and shows up everywhere. No DOM.
 */

/** A label in the languages the admin supports. */
export interface Text {
	de: string;
	en: string;
}

export const t = (de: string, en: string = de): Text => ({ de, en });

interface Base {
	label: Text;
	help?: Text;
}

export interface NumberNode extends Base {
	type: 'number';
	default: number;
	min: number;
	max: number;
	/** Whole numbers only. */
	int?: boolean;
	unit?: string;
}

export interface BooleanNode extends Base {
	type: 'boolean';
	default: boolean;
}

export interface StringNode extends Base {
	type: 'string';
	default: string;
	multiline?: boolean;
}

export interface SelectNode extends Base {
	type: 'select';
	options: readonly string[];
	/** Labels by option (the option itself when missing). */
	optionLabels?: Record<string, Text>;
	default: string;
}

/** `{ min, max }`, always in order. */
export interface RangeNode extends Base {
	type: 'range';
	default: { min: number; max: number };
	min: number;
	max: number;
	int?: boolean;
	unit?: string;
}

/** A list of key codes such as `["Space", "ShiftLeft"]` (a single string works too). */
export interface KeysNode extends Base {
	type: 'keys';
	default: readonly string[];
}

/** A fixed set of named settings. */
export interface ObjectNode extends Base {
	type: 'object';
	fields: Record<string, Node>;
}

/** A map from an id the author chooses (`blob`, `mushroom`) to settings of one shape. */
export interface RecordNode extends Base {
	type: 'record';
	of: Node;
	/** What the ids name, for forms ("entity"). */
	idLabel?: Text;
	/** Used when nothing is given. */
	default: Record<string, unknown>;
	maxItems: number;
}

export interface ListNode extends Base {
	type: 'list';
	of: Node;
	maxItems: number;
	/** Used when the list is missing (not when it is empty). */
	default?: readonly unknown[];
}

/** One of several shapes, told apart by the string field `by` (triggers, actions, conditions). */
export interface UnionNode extends Base {
	type: 'union';
	by: string;
	variants: Record<string, { label: Text; help?: Text; fields: Record<string, Node> }>;
}

/** The id of something defined elsewhere in the configuration. */
export interface RefNode extends Base {
	type: 'ref';
	/** The top-level record it points into (`entities`, `items` …). */
	to: string;
	/** Allowed to be empty. */
	optional?: boolean;
	default: string;
}

export type Node =
	| NumberNode
	| BooleanNode
	| StringNode
	| SelectNode
	| RangeNode
	| KeysNode
	| ObjectNode
	| RecordNode
	| ListNode
	| UnionNode
	| RefNode;

type Json = Record<string, unknown>;

/** `a.b` reads `root.a.b`. */
export function lookup(root: unknown, path: string): unknown {
	return path
		.split('.')
		.reduce<unknown>((found, key) => (isObject(found) ? found[key] : undefined), root);
}

export const isObject = (value: unknown): value is Json =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function whole(value: number, int: boolean | undefined): number {
	return int ? Math.round(value) : value;
}

/** The default value of a node, deep-copied. */
export function defaultOf(node: Node): unknown {
	switch (node.type) {
		case 'number':
		case 'boolean':
		case 'string':
		case 'select':
		case 'ref':
			return node.default;
		case 'range':
			return { ...node.default };
		case 'keys':
			return [...node.default];
		case 'object':
			return Object.fromEntries(
				Object.entries(node.fields).map(([key, field]) => [key, defaultOf(field)])
			);
		case 'record':
			return resolve(node, node.default);
		case 'list':
			return resolve(node, undefined);
		case 'union':
			return undefined;
	}
}

/** A value of any shape as one that fits the node: defaults fill gaps, nonsense is corrected. */
export function resolve(node: Node, value: unknown): unknown {
	switch (node.type) {
		case 'number':
			return typeof value === 'number' && Number.isFinite(value)
				? clamp(whole(value, node.int), node.min, node.max)
				: node.default;
		case 'boolean':
			return typeof value === 'boolean' ? value : node.default;
		case 'string':
			return typeof value === 'string' ? value : node.default;
		case 'ref':
			return typeof value === 'string' ? value : node.default;
		case 'select':
			return node.options.find((option) => option === value) ?? node.default;
		case 'range': {
			const source = isObject(value) ? value : {};
			const pick = (given: unknown, fallback: number) =>
				typeof given === 'number' && Number.isFinite(given)
					? clamp(whole(given, node.int), node.min, node.max)
					: fallback;
			const a = pick(source.min, node.default.min);
			const b = pick(source.max, node.default.max);
			return { min: Math.min(a, b), max: Math.max(a, b) };
		}
		case 'keys': {
			const list = (Array.isArray(value) ? value : [value]).filter(
				(key): key is string => typeof key === 'string' && key.trim() !== ''
			);
			return list.length > 0 ? list.map((key) => key.trim()) : [...node.default];
		}
		case 'object': {
			const source = isObject(value) ? value : {};
			return Object.fromEntries(
				Object.entries(node.fields).map(([key, field]) => [key, resolve(field, source[key])])
			);
		}
		case 'record':
			return resolveEntries(node, isObject(value) ? value : node.default);
		case 'list': {
			const items = Array.isArray(value) ? value : (node.default ?? []);
			return items
				.map((item) => resolve(node.of, item))
				.filter((item) => item !== undefined)
				.slice(0, node.maxItems);
		}
		case 'union': {
			if (!isObject(value)) return undefined;
			const variant = node.variants[String(value[node.by])];
			if (!variant) return undefined;
			return {
				[node.by]: value[node.by],
				...Object.fromEntries(
					Object.entries(variant.fields).map(([key, field]) => [key, resolve(field, value[key])])
				)
			};
		}
	}
}

function resolveEntries(node: RecordNode, source: unknown): Json {
	if (!isObject(source)) return {};
	return Object.fromEntries(
		Object.entries(source)
			.filter(([id]) => id.trim() !== '')
			.slice(0, node.maxItems)
			.map(([id, item]) => [id, resolve(node.of, item)])
			.filter(([, item]) => item !== undefined)
	);
}

/**
 * What `resolve` would change or ignore, as readable messages (for editors). Empty when the value
 * is fine as it is. `root` is the whole configuration, so references can be checked.
 */
export function problems(node: Node, value: unknown, root: unknown, path = ''): string[] {
	if (value === undefined) return [];
	const where = path || 'The configuration';
	switch (node.type) {
		case 'number': {
			if (typeof value !== 'number' || !Number.isFinite(value)) {
				return [`"${path}" must be a number.`];
			}
			return value < node.min || value > node.max
				? [`"${path}" must be between ${node.min} and ${node.max}.`]
				: [];
		}
		case 'boolean':
			return typeof value === 'boolean' ? [] : [`"${path}" must be true or false.`];
		case 'string':
			return typeof value === 'string' ? [] : [`"${path}" must be text.`];
		case 'select':
			return node.options.includes(String(value))
				? []
				: [`"${path}" must be one of ${node.options.map((o) => `"${o}"`).join(', ')}.`];
		case 'ref': {
			if (typeof value !== 'string') return [`"${path}" must be text.`];
			if (value === '' && node.optional) return [];
			const target = lookup(root, node.to);
			return isObject(target) && value in target
				? []
				: [`"${path}" must name an entry of "${node.to}" (not "${value}").`];
		}
		case 'range': {
			if (!isObject(value)) return [`"${path}" must be { "min", "max" }.`];
			const found = ['min', 'max'].flatMap((key) =>
				typeof value[key] === 'number' || value[key] === undefined
					? []
					: [`"${path}.${key}" must be a number.`]
			);
			if (typeof value.min === 'number' && typeof value.max === 'number' && value.min > value.max) {
				found.push(`"${path}": "min" is bigger than "max".`);
			}
			return found;
		}
		case 'keys': {
			const keys = Array.isArray(value) ? value : [value];
			return keys.every((key) => typeof key === 'string' && key.trim() !== '')
				? []
				: [`"${path}" must be a key code like "Space" or a list of them.`];
		}
		case 'object': {
			if (!isObject(value)) return [`"${where}" must be an object.`];
			return Object.entries(value).flatMap(([key, child]) => {
				const field = node.fields[key];
				const childPath = path ? `${path}.${key}` : key;
				return field
					? problems(field, child, root, childPath)
					: [`Unknown setting "${childPath}".`];
			});
		}
		case 'record': {
			if (!isObject(value)) return [`"${path}" must be an object.`];
			return Object.entries(value).flatMap(([id, child]) =>
				problems(node.of, child, root, `${path}.${id}`)
			);
		}
		case 'list': {
			if (!Array.isArray(value)) return [`"${path}" must be a list.`];
			return value.flatMap((child, index) => problems(node.of, child, root, `${path}[${index}]`));
		}
		case 'union': {
			if (!isObject(value)) return [`"${path}" must be an object.`];
			const variant = node.variants[String(value[node.by])];
			if (!variant) {
				return [
					`"${path}.${node.by}" must be one of ${Object.keys(node.variants)
						.map((name) => `"${name}"`)
						.join(', ')}.`
				];
			}
			return Object.entries(value).flatMap(([key, child]) => {
				if (key === node.by) return [];
				const field = variant.fields[key];
				return field
					? problems(field, child, root, `${path}.${key}`)
					: [`Unknown setting "${path}.${key}".`];
			});
		}
	}
}

/** The schema as JSON Schema (draft 2020-12) for editors' autocompletion and validation. */
export function toJsonSchema(node: Node): Json {
	const describe = (schema: Json): Json => ({
		...schema,
		title: node.label.en,
		...(node.help ? { description: node.help.en } : {})
	});
	switch (node.type) {
		case 'number':
			return describe({
				type: node.int ? 'integer' : 'number',
				minimum: node.min,
				maximum: node.max,
				default: node.default
			});
		case 'boolean':
			return describe({ type: 'boolean', default: node.default });
		case 'string':
		case 'ref':
			return describe({ type: 'string', default: node.default });
		case 'select':
			return describe({ enum: [...node.options], default: node.default });
		case 'range':
			return describe({
				type: 'object',
				properties: {
					min: { type: 'number', minimum: node.min, maximum: node.max },
					max: { type: 'number', minimum: node.min, maximum: node.max }
				},
				additionalProperties: false,
				default: node.default
			});
		case 'keys':
			return describe({
				oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
				default: [...node.default]
			});
		case 'object':
			return describe({
				type: 'object',
				properties: Object.fromEntries(
					Object.entries(node.fields).map(([key, field]) => [key, toJsonSchema(field)])
				),
				additionalProperties: false
			});
		case 'record':
			return describe({ type: 'object', additionalProperties: toJsonSchema(node.of) });
		case 'list':
			return describe({ type: 'array', items: toJsonSchema(node.of), maxItems: node.maxItems });
		case 'union':
			return describe({
				oneOf: Object.entries(node.variants).map(([name, variant]) => ({
					title: variant.label.en,
					type: 'object',
					properties: {
						[node.by]: { const: name },
						...Object.fromEntries(
							Object.entries(variant.fields).map(([key, field]) => [key, toJsonSchema(field)])
						)
					},
					required: [node.by],
					additionalProperties: false
				}))
			});
	}
}
