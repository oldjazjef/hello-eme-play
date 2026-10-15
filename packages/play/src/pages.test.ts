import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** The session needs a real page (canvas, DOM); the controller's logic doesn't. */
const sessions = vi.hoisted(() => ({ created: 0, destroyed: 0, configured: 0 }));
vi.mock('./session.js', () => ({
	Session: class {
		world = undefined;
		constructor() {
			sessions.created += 1;
		}
		destroy() {
			sessions.destroyed += 1;
		}
		configure() {
			sessions.configured += 1;
		}
		pageChanged() {}
	}
}));

const { createPlay } = await import('./play.js');

const config = {
	view: { mode: 'topdown' },
	visits: { enabled: false },
	pages: [
		{ match: '/projects', config: { view: { mode: 'side' } } },
		{ match: '/blog/*', config: { view: { mode: 'topdown' }, game: { lives: 3 } } }
	]
};

/** A window the controller listens to. */
let win: EventTarget;
let pathname: string;

beforeEach(() => {
	sessions.created = sessions.destroyed = sessions.configured = 0;
	pathname = '/';
	win = new EventTarget();
	vi.stubGlobal('location', {
		get pathname() {
			return pathname;
		}
	});
	// Reduced motion: no vehicle drives in by itself, so no timers are left behind.
	vi.stubGlobal('matchMedia', () => ({ matches: true }));
	vi.stubGlobal('addEventListener', win.addEventListener.bind(win));
	vi.stubGlobal('removeEventListener', win.removeEventListener.bind(win));
});
afterEach(() => vi.unstubAllGlobals());

describe('per-page configuration of createPlay', () => {
	it('starts with the configuration of the page it is on', () => {
		pathname = '/projects';
		const play = createPlay({ config, styles: false });
		expect(play.config.view.mode).toBe('side');
		play.destroy();
	});

	it('switches the view mode with setPath, and back', () => {
		const play = createPlay({ config, styles: false });
		expect(play.config.view.mode).toBe('topdown');
		play.setPath('/projects');
		expect(play.config.view.mode).toBe('side');
		play.setPath('/blog/post-1');
		expect(play.config.view.mode).toBe('topdown');
		expect(play.config.game.lives).toBe(3);
		play.setPath('/projects/');
		expect(play.config.view.mode).toBe('side');
		expect(play.config.game.lives).toBe(1);
		play.destroy();
	});

	it('follows the visitor: popstate and the Navigation API', () => {
		const navigation = new EventTarget();
		vi.stubGlobal('navigation', navigation);
		const play = createPlay({ config, styles: false });
		pathname = '/projects';
		win.dispatchEvent(new Event('popstate'));
		expect(play.config.view.mode).toBe('side');
		pathname = '/blog';
		navigation.dispatchEvent(new Event('navigatesuccess'));
		expect(play.config.view.mode).toBe('topdown');
		play.destroy();
		pathname = '/projects';
		win.dispatchEvent(new Event('popstate'));
		expect(play.config.view.mode).toBe('topdown');
	});

	it('starts a fresh round when the settings change while playing', () => {
		const play = createPlay({ config, styles: false });
		play.start();
		expect(play.state).toBe('playing');
		expect(sessions.created).toBe(1);
		play.setPath('/projects');
		expect(play.state).toBe('playing');
		expect(sessions.created).toBe(2);
		expect(sessions.destroyed).toBe(1);
		play.destroy();
	});

	it('leaves the round alone when the new page has the same settings', () => {
		const play = createPlay({ config, styles: false });
		play.start();
		play.setPath('/about');
		play.setPath('/other');
		expect(sessions.created).toBe(1);
		expect(sessions.destroyed).toBe(0);
		play.destroy();
	});

	it('stays off while nobody plays, and stops when the new page turns the game off', () => {
		const play = createPlay({
			config: { ...config, pages: [{ match: '/legal', config: { enabled: false } }] },
			styles: false
		});
		play.setPath('/legal');
		expect(play.state).toBe('off');
		expect(sessions.created).toBe(0);
		play.setPath('/');
		play.start();
		expect(play.state).toBe('playing');
		play.setPath('/legal');
		expect(play.state).toBe('off');
		play.destroy();
	});

	it('uses the page when the configuration itself changes (admin preview)', () => {
		pathname = '/projects';
		const play = createPlay({ config, styles: false });
		play.configure({
			view: { mode: 'topdown' },
			pages: [{ match: '/projects', config: { hint: { hideAfter: 9 } } }]
		});
		expect(play.config.hint.hideAfter).toBe(9);
		expect(play.config.view.mode).toBe('topdown');
		play.destroy();
	});

	it('pageChanged reads the path too', () => {
		const play = createPlay({ config, styles: false });
		pathname = '/projects';
		play.pageChanged();
		expect(play.config.view.mode).toBe('side');
		play.destroy();
	});
});
