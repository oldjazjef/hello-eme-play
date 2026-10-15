import { describe, expect, it } from 'vitest';
import { createWorld } from '@hello-eme/play-core';
import { animationOf, frameAt, type Sheet } from './sprite.js';

const sheet = (animations: Partial<Sheet['animations']>): Sheet => ({
	columns: 4,
	rows: 2,
	fps: 10,
	animations: {
		idle: [],
		walk: [],
		jump: [],
		hurt: [],
		punch: [],
		kick: [],
		bite: [],
		...animations
	}
});

describe('frameAt', () => {
	it('loops the frames of a state with fps', () => {
		const walking = sheet({ walk: [4, 5, 6] });
		expect([0, 0.1, 0.2, 0.3].map((time) => frameAt(walking, 'walk', time, false))).toEqual([
			4, 5, 6, 4
		]);
	});

	it('falls back to idle, then to the first frame', () => {
		expect(frameAt(sheet({ idle: [3] }), 'kick', 5, false)).toBe(3);
		expect(frameAt(sheet({}), 'kick', 5, false)).toBe(0);
	});

	it('keeps the first frame with reduced motion', () => {
		expect(frameAt(sheet({ walk: [4, 5] }), 'walk', 0.1, true)).toBe(4);
	});
});

describe('animationOf', () => {
	const body = () => createWorld({}).player;

	it('picks the state from what the body does', () => {
		const hero = body();
		expect(animationOf(hero, false)).toBe('idle');
		hero.moving = true;
		expect(animationOf(hero, false)).toBe('walk');
		hero.jump = 0.2;
		expect(animationOf(hero, false)).toBe('jump');
		hero.jump = 0;
		hero.grounded = false;
		expect(animationOf(hero, true)).toBe('jump');
		expect(animationOf(hero, false)).toBe('walk');
		hero.hurt = 0.2;
		expect(animationOf(hero, false)).toBe('hurt');
		hero.pose = { pose: 'kick', left: 0.1 };
		expect(animationOf(hero, false)).toBe('kick');
	});
});
