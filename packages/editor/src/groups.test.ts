import { PLAY_SCHEMA } from '@hello-eme/play-schema';
import { describe, expect, it } from 'vitest';
import { groupNodes, groupOf, resetGroup } from './groups.js';

describe('groupNodes', () => {
	const groups = groupNodes(PLAY_SCHEMA);

	it('shows every setting of the schema on exactly one tab', () => {
		const shown = groups.flatMap((group) => Object.keys(group.node.fields));
		expect(shown.sort()).toEqual(Object.keys(PLAY_SCHEMA.fields).sort());
	});

	it('splits the form into a handful of tabs, not one long list', () => {
		expect(groups.length).toBeGreaterThan(3);
		for (const group of groups) {
			expect(Object.keys(group.node.fields).length).toBeLessThan(
				Object.keys(PLAY_SCHEMA.fields).length / 2
			);
		}
	});

	it('puts settings nobody assigned on the first tab', () => {
		const { enabled, ...rest } = PLAY_SCHEMA.fields;
		if (!enabled) throw new Error('schema changed');
		const root = { ...PLAY_SCHEMA, fields: { ...rest, extra: enabled } };
		expect(Object.keys(groupNodes(root)[0]?.node.fields ?? {})).toContain('extra');
	});
});

describe('groupOf and resetGroup', () => {
	it('finds the tab of a setting', () => {
		const groups = groupNodes(PLAY_SCHEMA);
		expect(groupOf(groups, 'entities')).toBe('groupCharacters');
		expect(groupOf(groups, 'triggers')).toBe('groupTriggers');
		expect(groupOf(groups, 'nonsense')).toBeUndefined();
	});

	it('resets only the settings of one tab', () => {
		const groups = groupNodes(PLAY_SCHEMA);
		const items = groups.find((group) => group.id === 'groupItems');
		if (!items) throw new Error('no items tab');
		const stored = { items: { star: {} }, upgrades: {}, locale: 'en', entities: { hero: {} } };
		expect(resetGroup(stored, items)).toEqual({ locale: 'en', entities: { hero: {} } });
	});
});
