import { describe, expect, it } from 'vitest';
import { createPlay } from './index.js';

describe('createPlay', () => {
	it('resolves and migrates the configuration', () => {
		const play = createPlay({ config: { view: { mode: 'side' } } });
		expect(play.config.view.mode).toBe('side');
		expect(play.config.version).toBe(1);
	});

	it('has a world only while playing', () => {
		const play = createPlay({ config: { entities: { blob: {} } }, seed: 7 });
		expect(play.state).toBe('off');
		expect(play.world).toBeUndefined();
		play.start();
		expect(play.state).toBe('playing');
		expect(play.world?.spawn('blob', 1, 2)).toMatchObject({ x: 1, y: 2 });
		play.stop();
		expect(play.world).toBeUndefined();
	});
});
