/**
 * `configProblems` reports in plain language and names the setting in quotes: `"spawns[0].entity" must
 * name an entry of "entities" …`. These helpers turn that into field paths (`spawns.0.entity`, the
 * form the editor's fields use) so a problem can be shown where it belongs and jumped to.
 */

/** `spawns[0].entity` → `spawns.0.entity`. */
export const normalizePath = (path: string): string => path.replace(/\[(\d+)\]/g, '.$1');

/** The setting a problem message is about, or undefined for messages that name none. */
export function problemPath(message: string): string | undefined {
	const quoted = /^(?:Unknown setting )?"([^"]+)"/.exec(message)?.[1];
	return quoted === undefined ? undefined : normalizePath(quoted);
}

/** The messages by the path they are about; messages without a path sit under `''`. */
export function problemMap(messages: readonly string[]): Record<string, string[]> {
	const map: Record<string, string[]> = {};
	for (const message of messages) {
		const key = problemPath(message) ?? '';
		(map[key] ??= []).push(message);
	}
	return map;
}

/** The messages about exactly this field. */
export function problemsAt(
	map: Readonly<Record<string, readonly string[]>> | undefined,
	path: string
): readonly string[] {
	return map?.[path] ?? [];
}

/** The messages about this field or anything inside it. */
export function problemsUnder(
	map: Readonly<Record<string, readonly string[]>> | undefined,
	path: string
): string[] {
	if (!map) return [];
	return Object.entries(map).flatMap(([key, messages]) =>
		key === path || key.startsWith(`${path}.`) ? [...messages] : []
	);
}

/** The first segment: which top-level setting (and so which tab) a path belongs to. */
export const topKey = (path: string): string => path.split('.')[0] ?? '';
