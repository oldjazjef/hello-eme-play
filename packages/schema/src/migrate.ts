import { SCHEMA_VERSION } from './config.js';

/**
 * Brings a JSON written for an older schema version up to date, one version at a time. Add a step
 * here whenever `SCHEMA_VERSION` goes up; never change an old step.
 */
const STEPS: Record<number, (json: Record<string, unknown>) => Record<string, unknown>> = {
	// 0 → 1: the first versioned format; the old shape is a subset of it.
	0: (json) => ({ ...json, version: 1 })
};

export function migrate(json: unknown): unknown {
	if (typeof json !== 'object' || json === null || Array.isArray(json)) return json;
	let current: Record<string, unknown> = { ...json };
	let version = typeof current.version === 'number' ? current.version : 0;
	while (version < SCHEMA_VERSION) {
		const step = STEPS[version];
		if (!step) break;
		current = step(current);
		version += 1;
	}
	return current;
}
