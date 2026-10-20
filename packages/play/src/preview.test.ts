import { describe, expect, it, vi } from 'vitest';
import { applyPreview, connectPreview } from './preview.js';

const play = () => ({ configure: vi.fn(), stop: vi.fn(), start: vi.fn() });
const admin = 'https://cms.example.com';
const parent = {};
const message = (over: Partial<{ data: unknown; origin: string; source: unknown }> = {}) => ({
	data: { type: 'play-config', config: { view: { mode: 'side' } } },
	origin: admin,
	source: parent,
	...over
});

describe('applyPreview', () => {
	it('configures the game and starts a fresh round', () => {
		const target = play();
		expect(applyPreview(message(), admin, parent, target)).toBe(true);
		expect(target.configure).toHaveBeenCalledWith({ view: { mode: 'side' } });
		expect(target.stop).toHaveBeenCalled();
		expect(target.start).toHaveBeenCalled();
	});

	it('ignores other origins, other windows and other messages', () => {
		for (const bad of [
			message({ origin: 'https://evil.example' }),
			message({ source: {} }),
			message({ data: { type: 'something-else' } }),
			message({ data: 'play-config' })
		]) {
			const target = play();
			expect(applyPreview(bad, admin, parent, target)).toBe(false);
			expect(target.configure).not.toHaveBeenCalled();
		}
	});
});

describe('connectPreview', () => {
	it("says ready, applies configurations (with the website's additions) and stops listening", () => {
		const parent = { postMessage: vi.fn() };
		const listeners: ((event: unknown) => void)[] = [];
		vi.stubGlobal('window', { parent });
		vi.stubGlobal('addEventListener', (_: string, listener: (event: unknown) => void) =>
			listeners.push(listener)
		);
		const removed = vi.fn();
		vi.stubGlobal('removeEventListener', removed);
		const target = play();

		const stop = connectPreview(target, admin, (config) => ({
			...(config as object),
			locale: 'en'
		}));
		expect(parent.postMessage).toHaveBeenCalledWith({ type: 'play-ready' }, admin);
		listeners[0]?.({
			data: { type: 'play-config', config: { enabled: true } },
			origin: admin,
			source: parent
		});
		expect(target.configure).toHaveBeenCalledWith({ enabled: true, locale: 'en' });
		stop();
		expect(removed).toHaveBeenCalledWith('message', listeners[0]);
		vi.unstubAllGlobals();
	});
});
