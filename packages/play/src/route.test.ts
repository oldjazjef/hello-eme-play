import { afterEach, describe, expect, it, vi } from 'vitest';
import { currentPath, watchPath, type PathSource } from './route.js';

/** A stand-in for `window` with the events the route cares about. */
function fakeWindow(pathname: string, withNavigation = true) {
	const win = new EventTarget();
	const navigation = new EventTarget();
	const source: PathSource & { location: { pathname: string } } = {
		location: { pathname },
		addEventListener: (type, listener) => win.addEventListener(type, listener),
		removeEventListener: (type, listener) => win.removeEventListener(type, listener),
		...(withNavigation
			? {
					navigation: {
						addEventListener: (type, listener) => navigation.addEventListener(type, listener),
						removeEventListener: (type, listener) => navigation.removeEventListener(type, listener)
					}
				}
			: {})
	};
	return {
		source,
		go(next: string, via: 'popstate' | 'navigatesuccess') {
			source.location.pathname = next;
			(via === 'popstate' ? win : navigation).dispatchEvent(new Event(via));
		}
	};
}

describe('currentPath', () => {
	it('reads the pathname, and is `/` without a page', () => {
		expect(currentPath(fakeWindow('/blog/a').source)).toBe('/blog/a');
		expect(currentPath()).toBe('/');
	});
});

describe('watchPath', () => {
	it('reports the new path after back/forward and after a finished navigation', () => {
		const page = fakeWindow('/');
		const seen = vi.fn();
		watchPath(seen, page.source);
		page.go('/blog', 'navigatesuccess');
		page.go('/', 'popstate');
		expect(seen.mock.calls).toEqual([['/blog'], ['/']]);
	});

	it('works in browsers without the Navigation API', () => {
		const page = fakeWindow('/', false);
		const seen = vi.fn();
		watchPath(seen, page.source);
		page.go('/projects', 'popstate');
		expect(seen).toHaveBeenCalledWith('/projects');
	});

	it('stops when asked, and does nothing without a page', () => {
		const page = fakeWindow('/');
		const seen = vi.fn();
		const stop = watchPath(seen, page.source);
		stop();
		page.go('/blog', 'popstate');
		page.go('/blog', 'navigatesuccess');
		expect(seen).not.toHaveBeenCalled();
		expect(() => watchPath(seen)()).not.toThrow();
	});
});

afterEach(() => vi.unstubAllGlobals());
