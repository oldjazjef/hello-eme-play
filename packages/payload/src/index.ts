import { configProblems, DEFAULT_CONFIG } from '@hello-eme/play-schema';
import type { Access, GlobalConfig, Plugin } from 'payload';

export interface PlayPluginOptions {
	/** Slug of the global holding the configuration (default `play`). */
	slug?: string;
	/** Where the global shows up in the admin navigation. */
	group?: string | Record<string, string>;
	/** Who may read and change it. Default: everyone reads, logged-in users change it. */
	access?: { read?: Access; update?: Access };
	/** Turns the plugin off but keeps the global, so the database schema stays the same. */
	disabled?: boolean;
}

export const DEFAULT_SLUG = 'play';

/** Payload's `validate` for the JSON: readable problems, or true. */
export function validateConfig(value: unknown): string | true {
	if (value === null || value === undefined) return true;
	const problems = configProblems(value);
	return problems.length === 0 ? true : problems.join(' ');
}

export function playGlobal(options: PlayPluginOptions = {}): GlobalConfig {
	return {
		slug: options.slug ?? DEFAULT_SLUG,
		label: { de: 'Spiel', en: 'Play' },
		access: {
			read: options.access?.read ?? (() => true),
			update: options.access?.update ?? (({ req }) => Boolean(req.user))
		},
		admin: { group: options.group, hidden: options.disabled },
		// The form that abstracts the JSON arrives with the Payload milestone (docs/PLAN.md); until
		// then the JSON is edited as plain JSON.
		fields: [
			{
				name: 'config',
				type: 'json',
				label: { de: 'Konfiguration', en: 'Configuration' },
				defaultValue: DEFAULT_CONFIG,
				validate: (value: unknown) => validateConfig(value)
			}
		]
	};
}

/**
 * Adds the global `play` with the game's JSON configuration. Websites read it like any global:
 * `GET /api/globals/play` → `{ config }`, passed to `createPlay({ config })`.
 */
export const playPlugin =
	(options: PlayPluginOptions = {}): Plugin =>
	(config) => ({ ...config, globals: [...(config.globals ?? []), playGlobal(options)] });
