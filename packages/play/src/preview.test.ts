import { describe, expect, it, vi } from 'vitest';
import { applyPreview } from './preview.js';

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
