import { describe, expect, it } from 'vitest';
import { addMarks, fresh, opacity, SKID } from './skid.js';

const wheels = (x: number) => [
	{ x, y: 0 },
	{ x, y: 20 }
];

describe('skid marks', () => {
	it('add one segment per wheel, from where it was to where it is', () => {
		const marks = addMarks([], wheels(0), wheels(5), 100);
		expect(marks).toEqual([
			{ x1: 0, y1: 0, x2: 5, y2: 0, at: 100 },
			{ x1: 0, y1: 20, x2: 5, y2: 20, at: 100 }
		]);
	});

	it('keep only the newest marks when there are too many', () => {
		let marks = addMarks([], wheels(0), wheels(1), 0);
		for (let i = 0; i < SKID.max; i++) marks = addMarks(marks, wheels(i), wheels(i + 1), i);
		expect(marks).toHaveLength(SKID.max);
		expect(marks.at(-1)?.x2).toBe(SKID.max);
	});

	it('fade out and disappear at the end of their life', () => {
		const [mark] = addMarks([], wheels(0), wheels(5), 0);
		if (!mark) throw new Error('no mark');
		expect(opacity(mark, 1000)).toBe(SKID.opacity);
		expect(opacity(mark, SKID.life - SKID.fade / 2)).toBeCloseTo(SKID.opacity / 2);
		expect(fresh([mark], SKID.life - 1)).toHaveLength(1);
		expect(fresh([mark], SKID.life)).toHaveLength(0);
	});
});
