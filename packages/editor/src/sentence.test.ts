import { PLAY_SCHEMA, resolveConfig } from '@hello-eme/play-schema';
import { describe, expect, it } from 'vitest';
import { describeTrigger } from './sentence.js';

const triggers = PLAY_SCHEMA.fields.triggers;
const node = triggers?.type === 'list' ? triggers.of : PLAY_SCHEMA;

describe('describeTrigger', () => {
	const root = resolveConfig({});
	const blob = Object.keys(root.entities).find((id) => root.entities[id]?.kind === 'monster') ?? '';

	it('reads a trigger as one sentence in both languages', () => {
		const item = {
			on: 'kill',
			conditions: [{ if: 'score', min: 200 }],
			do: [{ do: 'points', amount: 50 }]
		};
		expect(describeTrigger(node, item, root, 'en')).toBe(
			'When A monster is beaten, only if Score (200), then Give points (50)'
		);
		expect(describeTrigger(node, item, root, 'de')).toContain('Wenn Ein Monster besiegt wird');
	});

	it('names the entity of a spawn and the interval of a timer', () => {
		const sentence = describeTrigger(
			node,
			{ on: 'interval', every: 20, do: [{ do: 'spawn', entity: blob, count: 2 }] },
			root,
			'en'
		);
		expect(sentence).toContain('every 20 seconds');
		expect(sentence).toContain('Spawn monsters');
		expect(sentence).toContain(root.entities[blob]?.label ?? blob);
	});

	it('shows the keys of a key trigger', () => {
		const item = { on: 'key', keys: ['KeyB', 'KeyV'], do: [{ do: 'heal', amount: 20 }] };
		expect(describeTrigger(node, item, root, 'en')).toMatch(
			/^When A key is pressed \(KeyB, KeyV\), then .*\(20\)$/
		);
		expect(describeTrigger(node, { on: 'key' }, root, 'en')).toBe('When A key is pressed, then …');
	});

	it('says what is missing for a trigger without actions', () => {
		expect(describeTrigger(node, { on: 'start' }, root, 'en')).toBe('When The game starts, then …');
	});
});
