import { describe, expect, it } from 'vitest';
import { createWorld, type Body } from '@hello-eme/play-core';
import { animationOf, frameAt, sideRows, type Sheet } from './sprite.js';

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

describe('side view pictures', () => {
	const body = (extra: Partial<Body> = {}) =>
		({ moving: false, distance: 0, grounded: true, pose: undefined, ...extra }) as Body;

	it('shows the figure in profile: the face is on the right', () => {
		const rows = sideRows(body(), 'figure');
		const skin = rows.flatMap((row) => [...row].flatMap((char, x) => (char === 's' ? [x] : [])));
		expect(Math.min(...skin)).toBeGreaterThan(4);
	});

	it('has a profile for every pose, all the same size', () => {
		const poses = [
			body(),
			body({ moving: true, distance: 5 }),
			body({ grounded: false }),
			body({ pose: { pose: 'punch' } as Body['pose'] }),
			body({ pose: { pose: 'kick' } as Body['pose'] })
		];
		for (const look of ['figure', 'enemy'] as const)
			for (const pose of poses) {
				const rows = sideRows(pose, look);
				expect(rows).toHaveLength(10);
				expect(rows.every((row) => row.length === 10)).toBe(true);
			}
	});
});
