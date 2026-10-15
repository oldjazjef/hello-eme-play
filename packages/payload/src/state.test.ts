import { PLAY_SCHEMA, type UnionNode } from '@hello-eme/play-schema';
import { describe, expect, it } from 'vitest';
import {
	countEntries,
	duplicateKey,
	getIn,
	itemTitle,
	keyList,
	moveItem,
	newItem,
	objectProblem,
	parseKeys,
	refOptions,
	removeAt,
	renameKey,
	replaceAt,
	setIn,
	setKey,
	uniqueKey,
	unionDefaults
} from './state.js';

describe('getIn / setIn / setKey', () => {
	it('reads deep and tolerates gaps', () => {
		expect(getIn({ a: { b: [1, { c: 3 }] } }, ['a', 'b', 1, 'c'])).toBe(3);
		expect(getIn({ a: 1 }, ['a', 'x', 'y'])).toBeUndefined();
	});

	it('writes immutably and creates what is missing', () => {
		const before = { a: { b: 1 } };
		const after = setIn(before, ['a', 'c', 'd'], 5);
		expect(after).toEqual({ a: { b: 1, c: { d: 5 } } });
		expect(before).toEqual({ a: { b: 1 } });
	});

	it('removes a key with undefined and keeps arrays as arrays', () => {
		expect(setKey({ a: 1, b: 2 }, 'a', undefined)).toEqual({ b: 2 });
		expect(setIn({ list: [1, 2] }, ['list', 1], 9)).toEqual({ list: [1, 9] });
		expect(setKey(null, 'a', 1)).toEqual({ a: 1 });
	});
});

describe('record helpers', () => {
	it('renames and keeps the order', () => {
		const renamed = renameKey({ a: 1, b: 2, c: 3 }, 'b', ' x ');
		expect(Object.keys(renamed)).toEqual(['a', 'x', 'c']);
	});

	it('refuses an empty, unchanged or taken name', () => {
		const source = { a: 1, b: 2 };
		expect(renameKey(source, 'a', '')).toBe(source);
		expect(renameKey(source, 'a', 'a')).toBe(source);
		expect(renameKey(source, 'a', 'b')).toBe(source);
	});

	it('finds a free key', () => {
		expect(uniqueKey({}, 'new')).toBe('new');
		expect(uniqueKey({ new: 1, 'new-2': 1 }, 'new')).toBe('new-3');
	});

	it('duplicates right behind the original, deep copied', () => {
		const source = { a: { x: [1] }, b: 2 };
		const copy = duplicateKey(source, 'a');
		expect(Object.keys(copy)).toEqual(['a', 'a-copy', 'b']);
		expect(copy['a-copy']).toEqual({ x: [1] });
		expect(copy['a-copy']).not.toBe(source.a);
	});
});

describe('list helpers', () => {
	it('moves, clamps, removes and replaces', () => {
		expect(moveItem([1, 2, 3], 0, 1)).toEqual([2, 1, 3]);
		expect(moveItem([1, 2, 3], 2, 0)).toEqual([3, 1, 2]);
		expect(moveItem([1, 2, 3], 0, -1)).toEqual([1, 2, 3]);
		expect(moveItem([1, 2, 3], 2, 3)).toEqual([1, 2, 3]);
		expect(removeAt([1, 2, 3], 1)).toEqual([1, 3]);
		expect(replaceAt([1, 2, 3], 1, 9)).toEqual([1, 9, 3]);
	});
});

describe('keys', () => {
	it('parses comma separated codes without blanks and duplicates', () => {
		expect(parseKeys('Space, KeyQ,, Space ')).toEqual(['Space', 'KeyQ']);
		expect(parseKeys(' ')).toEqual([]);
	});

	it('reads a single string, a list or falls back', () => {
		expect(keyList('Enter', ['Space'])).toEqual(['Enter']);
		expect(keyList(['A', ''], ['Space'])).toEqual(['A']);
		expect(keyList(undefined, ['Space'])).toEqual(['Space']);
	});
});

describe('union and new items', () => {
	const union: UnionNode = {
		type: 'union',
		label: { de: 'U', en: 'U' },
		by: 'do',
		variants: {
			points: {
				label: { de: 'Punkte', en: 'Points' },
				fields: {
					amount: { type: 'number', label: { de: 'A', en: 'A' }, default: 100, min: 0, max: 9 }
				}
			},
			nothing: { label: { de: 'Nichts', en: 'Nothing' }, fields: {} }
		}
	};

	it('builds the tagged defaults of a variant', () => {
		expect(unionDefaults(union, 'points')).toEqual({ do: 'points', amount: 100 });
		expect(unionDefaults(union, 'nothing')).toEqual({ do: 'nothing' });
		expect(newItem(union)).toEqual({ do: 'points', amount: 100 });
	});

	it('starts objects empty and titles items', () => {
		expect(newItem(PLAY_SCHEMA)).toEqual({});
		expect(itemTitle(union, { do: 'points' }, 'x', 'de')).toBe('Punkte');
		expect(itemTitle(PLAY_SCHEMA, { label: 'Hero' }, 'x', 'en')).toBe('Hero');
		expect(itemTitle(PLAY_SCHEMA, {}, 'fallback', 'en')).toBe('fallback');
	});
});

describe('refs, counts and validation', () => {
	it('lists the ids with their labels, also for dotted paths', () => {
		const root = {
			entities: { hero: { label: 'Hero' }, blob: {} },
			audio: { sounds: { pop: {} } }
		};
		expect(refOptions(root, 'entities')).toEqual([{ id: 'hero', label: 'Hero' }, { id: 'blob' }]);
		expect(refOptions(root, 'audio.sounds')).toEqual([{ id: 'pop' }]);
		expect(refOptions(root, 'nothing')).toEqual([]);
	});

	it('counts records and lists', () => {
		expect(countEntries({ a: { x: 1, y: 2 }, b: [1, 2, 3] }, 'a')).toBe(2);
		expect(countEntries({ b: [1, 2, 3] }, 'b')).toBe(3);
		expect(countEntries({}, 'c')).toBe(0);
	});

	it('only blocks a configuration that is no object', () => {
		expect(objectProblem({})).toBeUndefined();
		expect(objectProblem(undefined)).toBeUndefined();
		expect(objectProblem([])).toBeDefined();
		expect(objectProblem('x')).toBeDefined();
	});
});
