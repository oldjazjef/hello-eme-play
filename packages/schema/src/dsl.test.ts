import { describe, expect, it } from 'vitest';
import { defaultOf, problems, resolve, t, toJsonSchema, type Node } from './dsl.js';

const schema: Node = {
	type: 'object',
	label: t('Root'),
	fields: {
		name: { type: 'string', label: t('Name'), default: 'x' },
		level: { type: 'number', label: t('Level'), default: 2, min: 1, max: 5, int: true },
		on: { type: 'boolean', label: t('On'), default: true },
		mode: { type: 'select', label: t('Mode'), options: ['a', 'b'], default: 'a' },
		span: { type: 'range', label: t('Span'), default: { min: 1, max: 2 }, min: 0, max: 10 },
		keys: { type: 'keys', label: t('Keys'), default: ['Space'] },
		items: {
			type: 'record',
			label: t('Items'),
			default: { a: { power: 1 } },
			maxItems: 2,
			of: {
				type: 'object',
				label: t('Item'),
				fields: { power: { type: 'number', label: t('Power'), default: 3, min: 0, max: 9 } }
			}
		},
		pick: { type: 'ref', label: t('Pick'), to: 'items', optional: true, default: '' },
		acts: {
			type: 'list',
			label: t('Acts'),
			maxItems: 2,
			of: {
				type: 'union',
				label: t('Act'),
				by: 'do',
				variants: {
					say: {
						label: t('Say'),
						fields: { text: { type: 'string', label: t('T'), default: 'hi' } }
					}
				}
			}
		}
	}
};

describe('resolve', () => {
	it('fills defaults and keeps valid values', () => {
		expect(resolve(schema, {})).toMatchObject({
			name: 'x',
			level: 2,
			mode: 'a',
			span: { min: 1, max: 2 },
			keys: ['Space'],
			items: { a: { power: 1 } },
			acts: []
		});
		expect(resolve(schema, { level: 4, mode: 'b' })).toMatchObject({ level: 4, mode: 'b' });
	});

	it('corrects nonsense', () => {
		const result = resolve(schema, {
			name: 5,
			level: 99.4,
			mode: 'z',
			span: { min: 9, max: 3 },
			keys: 'Enter',
			items: { a: { power: -2 }, b: {}, c: {} },
			acts: [{ do: 'say' }, { do: 'fly' }, { do: 'say', text: 'yo' }, { do: 'say' }]
		}) as Record<string, unknown>;
		expect(result).toMatchObject({
			name: 'x',
			level: 5,
			mode: 'a',
			span: { min: 3, max: 9 },
			keys: ['Enter'],
			items: { a: { power: 0 }, b: { power: 3 } }
		});
		expect(Object.keys(result.items as object)).toHaveLength(2);
		expect(result.acts).toEqual([
			{ do: 'say', text: 'hi' },
			{ do: 'say', text: 'yo' }
		]);
	});

	it('gives a default that is already resolved', () => {
		expect(defaultOf(schema)).toEqual(resolve(schema, undefined));
	});
});

describe('problems', () => {
	it('is empty for valid values', () => {
		expect(
			problems(schema, { level: 3, items: { a: { power: 2 } }, pick: 'a' }, { items: { a: {} } })
		).toEqual([]);
	});

	it('reports each issue with its path', () => {
		const found = problems(
			schema,
			{ level: 9, nope: 1, pick: 'q', acts: [{ do: 'fly' }] },
			{ items: {} }
		);
		expect(found).toEqual([
			'"level" must be between 1 and 5.',
			'Unknown setting "nope".',
			'"pick" must name an entry of "items" (not "q").',
			'"acts[0].do" must be one of "say".'
		]);
	});
});

describe('toJsonSchema', () => {
	it('mirrors the tree', () => {
		const json = toJsonSchema(schema) as { properties: Record<string, Record<string, unknown>> };
		expect(json.properties.level).toMatchObject({ type: 'integer', minimum: 1, maximum: 5 });
		expect(json.properties.mode).toMatchObject({ enum: ['a', 'b'] });
	});
});
