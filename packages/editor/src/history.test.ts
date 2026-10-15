import { describe, expect, it } from 'vitest';
import { canRedo, canUndo, commit, MAX_STEPS, MERGE_MS, redo, start, undo } from './history.js';

describe('history', () => {
	it('undoes and redoes steps that are far apart', () => {
		let h = start<number>(0);
		h = commit(h, 1, 10_000);
		h = commit(h, 2, 20_000);
		expect(h.present).toBe(2);
		h = undo(h);
		expect(h.present).toBe(1);
		h = undo(h);
		expect(h.present).toBe(0);
		expect(canUndo(h)).toBe(false);
		h = redo(h);
		expect(h.present).toBe(1);
		expect(canRedo(h)).toBe(true);
	});

	it('merges quick successive edits into one step', () => {
		let h = commit(start<number>(0), 1, 10_000);
		h = commit(h, 2, 10_000 + MERGE_MS - 1);
		// A pause longer than the window ends the step; continuous typing keeps extending it.
		h = commit(h, 3, 10_000 + 2 * MERGE_MS + 10);
		// The first edit has nothing to merge with; the quick second one replaces it.
		expect(h.past).toEqual([0, 2]);
		expect(undo(h).present).toBe(2);
	});

	it('forgets the redo steps after a new edit', () => {
		let h = commit(commit(start<number>(0), 1, 10_000), 2, 20_000);
		h = undo(h);
		h = commit(h, 9, 30_000);
		expect(canRedo(h)).toBe(false);
		expect(undo(h).present).toBe(1);
	});

	it('does nothing when there is nothing to undo or redo, or the value is the same', () => {
		const h = start({ a: 1 });
		expect(undo(h)).toBe(h);
		expect(redo(h)).toBe(h);
		expect(commit(h, h.present, 5)).toBe(h);
	});

	it('undoes to undefined too (an empty configuration)', () => {
		let h = commit(start<number | undefined>(undefined), 1, 10_000);
		h = undo(h);
		expect(h.present).toBeUndefined();
	});

	it('keeps at most MAX_STEPS steps', () => {
		let h = start<number>(0);
		for (let i = 1; i <= MAX_STEPS + 20; i++) h = commit(h, i, i * 10_000);
		expect(h.past).toHaveLength(MAX_STEPS);
	});
});
