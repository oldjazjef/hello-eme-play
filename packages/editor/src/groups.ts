import type { ObjectNode } from '@hello-eme/play-schema';
import type { Labels } from './labels.js';

export type GroupId = keyof Pick<
	Labels,
	'groupGame' | 'groupCharacters' | 'groupItems' | 'groupTriggers' | 'groupControls'
>;

/** Which top-level settings sit on which tab. Anything not listed lands on the first tab. */
const GROUPS: readonly { id: GroupId; keys: readonly string[] }[] = [
	{
		id: 'groupGame',
		keys: ['version', 'enabled', 'locale', 'view', 'game', 'visits', 'levels', 'progress']
	},
	{ id: 'groupCharacters', keys: ['entities', 'stats', 'sprites', 'moves', 'spawns'] },
	{ id: 'groupItems', keys: ['items', 'upgrades', 'itemSpawns'] },
	{ id: 'groupTriggers', keys: ['triggers'] },
	{ id: 'groupControls', keys: ['keys', 'hint', 'audio', 'texts'] }
];

export interface Group {
	id: GroupId;
	/** The schema reduced to this tab's settings (the stored JSON keeps all the others). */
	node: ObjectNode;
}

/** Splits the root object into one object node per tab; every field appears exactly once. */
export function groupNodes(root: ObjectNode): Group[] {
	const listed = new Set(GROUPS.flatMap((group) => group.keys));
	const loose = Object.keys(root.fields).filter((key) => !listed.has(key));
	return GROUPS.map((group, index) => {
		const keys = index === 0 ? [...group.keys, ...loose] : group.keys;
		const fields = Object.fromEntries(
			keys.flatMap((key) => {
				const field = root.fields[key];
				return field ? [[key, field] as const] : [];
			})
		);
		return { id: group.id, node: { ...root, fields } };
	}).filter((group) => Object.keys(group.node.fields).length > 0);
}

/** The tab a top-level setting is on. */
export function groupOf(groups: readonly Group[], key: string): GroupId | undefined {
	return groups.find((group) => key in group.node.fields)?.id;
}

/** The stored JSON without the settings of one tab: back to the defaults, nothing else touched. */
export function resetGroup(stored: Record<string, unknown>, group: Group): Record<string, unknown> {
	return Object.fromEntries(Object.entries(stored).filter(([key]) => !(key in group.node.fields)));
}
