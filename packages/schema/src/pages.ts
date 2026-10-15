/**
 * Per-page configuration: which `pages` entries apply to a path, and how their partial JSON is
 * merged over the base. Pure functions on plain data (no DOM); the runtime, which knows the
 * current path, calls them.
 */
import { isObject } from './dsl.js';
import type { PageRule } from './types.js';

type Json = Record<string, unknown>;

const MAX_PAGES = 50;

/** `/blog/` and `/blog` are the same page; query and hash don't count. */
function normalize(path: string): string {
	const clean = path.split(/[?#]/)[0] ?? '';
	const rooted = clean.startsWith('/') ? clean : `/${clean}`;
	return rooted.length > 1 ? rooted.replace(/\/+$/, '') || '/' : rooted;
}

const escape = (text: string): string => text.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
const wildcard = (text: string): string => text.split('*').map(escape).join('.*');

/**
 * Whether a glob matches a path (`location.pathname`). `*` stands for any characters, slashes
 * included. A trailing `/*` also matches the folder itself: `/blog/*` matches `/blog`, `/blog/` and
 * `/blog/a/b`. Trailing slashes, query and hash are ignored.
 */
export function matchPath(pattern: string, path: string): boolean {
	const target = normalize(path);
	const text = pattern.trim();
	if (text === '') return false;
	if (text.endsWith('/*')) {
		return new RegExp(`^${wildcard(text.slice(0, -2))}(/.*)?$`).test(target);
	}
	const exact = text.length > 1 ? text.replace(/\/+$/, '') : text;
	return new RegExp(`^${wildcard(exact)}$`).test(target);
}

/** `value` without its `pages` key (a page's settings never contain pages: no nesting). */
export function withoutPages(value: Json): Json {
	return Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'pages'));
}

/** The `pages` of a JSON as a clean list: entries with a pattern, an object as config, no nesting. */
export function cleanPages(value: unknown): PageRule[] {
	if (!Array.isArray(value)) return [];
	return value
		.filter(isObject)
		.flatMap((page) =>
			typeof page.match === 'string' && page.match.trim() !== ''
				? [
						{
							match: page.match.trim(),
							config: isObject(page.config) ? withoutPages(page.config) : {}
						}
					]
				: []
		)
		.slice(0, MAX_PAGES);
}

/**
 * `over` merged over `base`: objects merge key by key (deeply), everything else, lists included,
 * is replaced. Neither is changed.
 */
export function mergeConfig(base: unknown, over: unknown): unknown {
	if (over === undefined) return base;
	if (!isObject(base) || !isObject(over)) return over;
	const keys = new Set([...Object.keys(base), ...Object.keys(over)]);
	keys.delete('__proto__');
	return Object.fromEntries([...keys].map((key) => [key, mergeConfig(base[key], over[key])]));
}

/** The settings of the matching pages, merged in the order they are listed (later ones win). */
export function pageConfigFor(pages: readonly PageRule[], path: string): Json {
	return pages
		.filter((page) => matchPath(page.match, path))
		.reduce<Json>((merged, page) => mergeConfig(merged, page.config) as Json, {});
}
