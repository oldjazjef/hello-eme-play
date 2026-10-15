'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { runBalance, type Balance } from './balance.js';
import { canRedo, canUndo, commit, redo, start, undo, type History } from './history.js';

const sameJson = (a: unknown, b: unknown): boolean => {
	try {
		return a === b || JSON.stringify(a) === JSON.stringify(b);
	} catch {
		return false;
	}
};

export interface UseHistory {
	/** Records and reports a new value. */
	set: (value: unknown) => void;
	undo: () => void;
	redo: () => void;
	canUndo: boolean;
	canRedo: boolean;
}

/**
 * Undo and redo around a controlled value. A value that changes from outside (the host reloaded
 * the document) starts a fresh history.
 */
export function useHistory(value: unknown, onChange: (value: unknown) => void): UseHistory {
	const ref = useRef<History<unknown>>(start(value));
	const [, bump] = useState(0);
	// The host's `onChange` may change on every render; the latest one is used.
	const report = useRef(onChange);
	report.current = onChange;

	useEffect(() => {
		if (!sameJson(value, ref.current.present)) {
			ref.current = start(value);
			bump((count) => count + 1);
		}
	}, [value]);

	const set = useCallback((next: unknown) => {
		ref.current = commit(ref.current, next, Date.now());
		bump((count) => count + 1);
		report.current(next);
	}, []);
	const step = useCallback((move: (history: History<unknown>) => History<unknown>) => {
		const moved = move(ref.current);
		if (moved === ref.current) return;
		ref.current = moved;
		bump((count) => count + 1);
		report.current(moved.present);
	}, []);

	return {
		set,
		undo: useCallback(() => step(undo), [step]),
		redo: useCallback(() => step(redo), [step]),
		canUndo: canUndo(ref.current),
		canRedo: canRedo(ref.current)
	};
}

/** The balance check, run a moment after the last edit. `undefined` while nothing has run yet. */
export function useBalance(
	json: unknown,
	delay = 600
): { balance: Balance | undefined; running: boolean } {
	const [state, setState] = useState<{ balance: Balance | undefined; running: boolean }>({
		balance: undefined,
		running: true
	});
	useEffect(() => {
		setState((before) => ({ ...before, running: true }));
		const timer = setTimeout(() => setState({ balance: runBalance(json), running: false }), delay);
		return () => clearTimeout(timer);
	}, [json, delay]);
	return state;
}
