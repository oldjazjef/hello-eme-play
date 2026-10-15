/** The best score, remembered in this browser (localStorage; missing or blocked: not remembered). */
export function loadBest(key: string): number {
	try {
		const value = Number(localStorage.getItem(`${key}:best`));
		return Number.isFinite(value) && value > 0 ? value : 0;
	} catch {
		return 0;
	}
}

/** Saves a new best; returns the best afterwards. */
export function saveBest(key: string, score: number): number {
	const best = loadBest(key);
	if (score <= best) return best;
	try {
		localStorage.setItem(`${key}:best`, String(score));
	} catch {
		// Private mode or blocked storage: not remembered.
	}
	return score;
}
