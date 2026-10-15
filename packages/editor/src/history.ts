/** Undo and redo for the edited JSON: pure helpers, immutable. */

export interface History<T> {
	past: readonly T[];
	present: T;
	future: readonly T[];
	/** When the present value was last changed (ms), for merging quick successive edits. */
	at: number;
}

/** How many steps are remembered. */
export const MAX_STEPS = 100;
/** Edits closer together than this (typing, dragging a slider) count as one step. */
export const MERGE_MS = 800;

export const start = <T>(value: T, now = 0): History<T> => ({
	past: [],
	present: value,
	future: [],
	at: now
});

/**
 * Records a new value. Quick successive edits replace the present instead of adding a step, unless
 * the change is one the person made on purpose (`separate`: a preset, a reset, a loaded file).
 */
export function commit<T>(
	history: History<T>,
	value: T,
	now: number,
	separate = false
): History<T> {
	if (Object.is(value, history.present)) return history;
	const merge =
		!separate &&
		history.past.length > 0 &&
		history.future.length === 0 &&
		now - history.at < MERGE_MS;
	const past = merge ? history.past : [...history.past, history.present].slice(-MAX_STEPS);
	// After a deliberate change the next edit starts a step of its own.
	return { past, present: value, future: [], at: separate ? 0 : now };
}

export const canUndo = (history: History<unknown>): boolean => history.past.length > 0;
export const canRedo = (history: History<unknown>): boolean => history.future.length > 0;

export function undo<T>(history: History<T>): History<T> {
	const previous = history.past[history.past.length - 1];
	if (previous === undefined && history.past.length === 0) return history;
	return {
		past: history.past.slice(0, -1),
		present: previous as T,
		future: [history.present, ...history.future],
		// The next edit starts a step of its own.
		at: 0
	};
}

export function redo<T>(history: History<T>): History<T> {
	const [next, ...rest] = history.future;
	if (history.future.length === 0) return history;
	return { past: [...history.past, history.present], present: next as T, future: rest, at: 0 };
}
