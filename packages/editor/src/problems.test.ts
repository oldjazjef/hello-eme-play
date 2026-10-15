import { configProblems } from '@hello-eme/play-schema';
import { describe, expect, it } from 'vitest';
import {
	normalizePath,
	problemMap,
	problemPath,
	problemsAt,
	problemsUnder,
	topKey
} from './problems.js';

describe('problemPath', () => {
	it('reads the quoted setting and turns list positions into path segments', () => {
		expect(problemPath('"spawns[0].entity" must name an entry of "entities" (not "x").')).toBe(
			'spawns.0.entity'
		);
		expect(problemPath('Unknown setting "view.colour".')).toBe('view.colour');
		expect(problemPath('The configuration must be a JSON object.')).toBeUndefined();
	});

	it('normalises nested positions', () => {
		expect(normalizePath('triggers[2].do[1].count')).toBe('triggers.2.do.1.count');
	});
});

describe('problemMap', () => {
	it('groups real problems by field and finds them from a section', () => {
		const messages = configProblems({
			game: { lives: 500 },
			spawns: [{ entity: 'nobody' }],
			view: { colour: 'red' }
		});
		const map = problemMap(messages);
		expect(problemsAt(map, 'game.lives')).toHaveLength(1);
		expect(problemsAt(map, 'spawns.0.entity')).toHaveLength(1);
		expect(problemsUnder(map, 'spawns')).toHaveLength(1);
		expect(problemsUnder(map, 'game')).toHaveLength(1);
		expect(problemsUnder(map, 'view')).toHaveLength(1);
		expect(problemsUnder(map, 'triggers')).toHaveLength(0);
	});

	it('keeps path-less messages apart and does not confuse prefixes', () => {
		const map = problemMap(['Something general.', '"gameplay.x" is odd.']);
		expect(map['']).toEqual(['Something general.']);
		expect(problemsUnder(map, 'game')).toHaveLength(0);
	});

	it('names the tab by the first segment', () => {
		expect(topKey('entities.hero.stats.hp')).toBe('entities');
	});
});
