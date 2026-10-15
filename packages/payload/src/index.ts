import { objectProblem } from '@hello-eme/play-editor';
import type { Access, GlobalConfig, Plugin } from 'payload';

export interface PlayPluginOptions {
	/** Slug of the global holding the configuration (default `play`). */
	slug?: string;
	/** Where the global shows up in the admin navigation. */
	group?: string | Record<string, string>;
	/** Who may read and change it. Default: everyone reads, logged-in users change it. */
	access?: { read?: Access; update?: Access };
	/** Slug of the upload collection the picture picker lists (default `media`). */
	mediaCollection?: string;
	/**
	 * A page that loads the game with `data-preview="<admin origin>"` (see the play README). The editor
	 * then shows it next to the form and plays every change, saved or not.
	 */
	previewUrl?: string;
	/** Turns the plugin off but keeps the global, so the database schema stays the same. */
	disabled?: boolean;
}

export const DEFAULT_SLUG = 'play';

export { configProblems, DEFAULT_CONFIG, resolveConfig } from '@hello-eme/play-schema';
export type { PlayConfig } from '@hello-eme/play-schema';

/**
 * Payload's `validate` for the JSON. Lenient: `resolveConfig` fixes nonsense when the game loads
 * and the editor lists the problems, so only something that is no JSON object blocks saving.
 */
export function validateConfig(value: unknown): string | true {
	return objectProblem(value) ?? true;
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
		fields: [
			{
				name: 'config',
				type: 'json',
				label: { de: 'Konfiguration', en: 'Configuration' },
				// Only what editors change is stored; everything else comes from the defaults.
				defaultValue: {},
				validate: (value: unknown) => validateConfig(value),
				admin: {
					components: {
						Field: {
							path: '@hello-eme/play-payload/client#PlayConfigField',
							clientProps: {
								mediaCollection: options.mediaCollection ?? 'media',
								...(options.previewUrl ? { previewUrl: options.previewUrl } : {})
							}
						}
					}
				}
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
