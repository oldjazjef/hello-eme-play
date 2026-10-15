/**
 * Which page the visitor is on, for per-page configuration (`pages`): the current path and a
 * watcher for navigations that don't reload the page. Frameworks whose router the browser can't
 * see call `play.setPath(path)` themselves.
 */

interface Events {
	addEventListener(type: string, listener: () => void): void;
	removeEventListener(type: string, listener: () => void): void;
}

/** What the browser offers (`window`); tests pass a stand-in. */
export interface PathSource extends Events {
	location: { pathname: string };
	/** The Navigation API, where the browser has it. */
	navigation?: Events;
}

const browser = (): PathSource | undefined =>
	typeof location === 'undefined' ? undefined : (globalThis as unknown as PathSource);

/** `location.pathname`, or `/` where there is no page (server rendering). */
export const currentPath = (source: PathSource | undefined = browser()): string =>
	source?.location.pathname ?? '/';

/**
 * Calls `onChange` with the new path after the visitor navigated: back and forward (`popstate`)
 * and, in browsers with the Navigation API, every finished navigation (`navigatesuccess`, which
 * also covers `history.pushState` by a router). Returns the function that stops watching.
 */
export function watchPath(
	onChange: (path: string) => void,
	source: PathSource | undefined = browser()
): () => void {
	if (!source) return () => {};
	const changed = () => onChange(source.location.pathname);
	source.addEventListener('popstate', changed);
	source.navigation?.addEventListener('navigatesuccess', changed);
	return () => {
		source.removeEventListener('popstate', changed);
		source.navigation?.removeEventListener('navigatesuccess', changed);
	};
}
