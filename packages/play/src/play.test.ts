import { DEFAULT_TEXTS } from '@hello-eme/play-schema';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAudio } from './audio.js';
import { Input, type InputHooks } from './input.js';
import { loadBest, saveBest } from './progress.js';
import { durationGroup } from './stats.js';
import { fill, textsFor } from './texts.js';
import { resolveConfig } from '@hello-eme/play-schema';
import type { Controls } from '@hello-eme/play-core';

afterEach(() => vi.unstubAllGlobals());

describe('textsFor', () => {
	it('uses the language, with custom texts on top and empty ones ignored', () => {
		const config = resolveConfig({ locale: 'en', texts: { toggle: 'Play!', exit: '  ' } });
		const texts = textsFor(config);
		expect(texts.toggle).toBe('Play!');
		expect(texts.exit).toBe(DEFAULT_TEXTS.en.exit);
		expect(fill(texts.score, { score: 5 })).toBe('Score: 5');
	});
});

describe('best score', () => {
	it('is remembered in localStorage and only ever goes up', () => {
		const store = new Map<string, string>();
		vi.stubGlobal('localStorage', {
			getItem: (key: string) => store.get(key) ?? null,
			setItem: (key: string, value: string) => void store.set(key, value)
		});
		expect(loadBest('k')).toBe(0);
		expect(saveBest('k', 50)).toBe(50);
		expect(saveBest('k', 20)).toBe(50);
		expect(loadBest('k')).toBe(50);
	});

	it('works without storage', () => {
		vi.stubGlobal('localStorage', {
			getItem: () => {
				throw new Error('blocked');
			},
			setItem: () => {
				throw new Error('blocked');
			}
		});
		expect(loadBest('k')).toBe(0);
		expect(saveBest('k', 5)).toBe(5);
	});
});

describe('audio', () => {
	it('stays silent when off, and never throws without Web Audio', () => {
		const config = resolveConfig({ audio: { enabled: true, sounds: { hit: {} } } });
		expect(() => createAudio(config.audio).play('hit')).not.toThrow();
		expect(() => createAudio({ ...config.audio, enabled: false }).play('hit')).not.toThrow();
	});
});

describe('durationGroup', () => {
	it('groups round lengths', () => {
		expect(durationGroup(5)).toBe('0-10s');
		expect(durationGroup(700)).toBe('10min+');
	});
});

describe('Input', () => {
	beforeEach(() => {
		// Key events here have no DOM target.
		vi.stubGlobal('HTMLElement', function HTMLElement() {});
		vi.stubGlobal('Element', function Element() {});
	});
	const config = resolveConfig({});
	const setup = (riding = false, active = true) => {
		const calls = { escape: 0, shop: 0 };
		const hooks: InputHooks = {
			config: () => config,
			active: () => active,
			riding: () => riding,
			escape: () => void calls.escape++,
			toggleShop: () => void calls.shop++
		};
		const controls: Controls = {
			axis: { x: 0, y: 0 },
			drift: false,
			held: new Set(),
			pressed: new Set()
		};
		return { input: new Input(hooks), calls, controls };
	};
	const key = (code: string, extra: Partial<KeyboardEvent> = {}) =>
		({
			code,
			key: code,
			preventDefault() {},
			target: null,
			repeat: false,
			...extra
		}) as KeyboardEvent;

	it('steers with the arrows and WASD; opposite directions cancel', () => {
		const { input, controls } = setup();
		input.keydown(key('ArrowRight'));
		input.keydown(key('KeyW'));
		input.apply(controls, false);
		expect(controls.axis).toEqual({ x: 1, y: -1 });
		input.keydown(key('ArrowLeft'));
		input.apply(controls, false);
		expect(controls.axis.x).toBe(0);
		input.keyup(key('ArrowRight'));
		input.keyup(key('ArrowLeft'));
		input.apply(controls, false);
		expect(controls.axis.x).toBe(0);
	});

	it('holds the moves of the figure while their keys are down', () => {
		const { input, controls } = setup();
		input.keydown(key('Space'));
		input.keydown(key('KeyQ'));
		input.apply(controls, false);
		expect([...controls.held]).toEqual(['punch', 'kick']);
		input.keyup(key('Space'));
		input.apply(controls, false);
		expect([...controls.held]).toEqual(['kick']);
	});

	it('counts a tap that ends before the next frame', () => {
		const { input, controls } = setup();
		input.keydown(key('Space'));
		input.keyup(key('Space'));
		input.apply(controls, false);
		expect([...controls.held]).toEqual(['punch']);
		input.apply(controls, false);
		expect([...controls.held]).toEqual([]);
	});

	it('jumps on foot, honks and drifts in a vehicle, uses with F', () => {
		const onFoot = setup();
		onFoot.input.keydown(key('KeyE'));
		onFoot.input.keydown(key('KeyF'));
		onFoot.input.apply(onFoot.controls, false);
		expect([...onFoot.controls.pressed]).toEqual(['jump', 'use']);

		const inCar = setup(true);
		inCar.input.keydown(key('Enter'));
		inCar.input.keydown(key('Space'));
		inCar.input.apply(inCar.controls, true);
		expect([...inCar.controls.pressed]).toEqual(['honk']);
		expect(inCar.controls.drift).toBe(true);
		expect(inCar.controls.held.size).toBe(0);
	});

	it('uses the touch wheel and pedals in a vehicle only', () => {
		const { input, controls } = setup(true);
		input.wheel = 0.5;
		input.pedal = -1;
		input.apply(controls, true);
		expect(controls.axis).toEqual({ x: 0.5, y: -1 });
		input.apply(controls, false);
		expect(controls.axis).toEqual({ x: 0, y: 0 });
	});

	it('hands Esc and the shop key to the game, and ignores keys when not playing', () => {
		const { input, calls } = setup();
		input.keydown(key('Escape', { key: 'Escape' }));
		input.keydown(key('KeyU'));
		expect(calls).toEqual({ escape: 1, shop: 1 });
		const idle = setup(false, false);
		idle.input.keydown(key('Escape', { key: 'Escape' }));
		expect(idle.calls.escape).toBe(0);
	});

	it('uses the keys of the configuration', () => {
		const custom = resolveConfig({ moves: { punch: { keys: ['KeyG'] } } });
		const hooks: InputHooks = {
			config: () => custom,
			active: () => true,
			riding: () => false,
			escape() {},
			toggleShop() {}
		};
		const input = new Input(hooks);
		const controls: Controls = {
			axis: { x: 0, y: 0 },
			drift: false,
			held: new Set(),
			pressed: new Set()
		};
		input.keydown(key('Space'));
		input.keydown(key('KeyG'));
		input.apply(controls, false);
		expect([...controls.held]).toEqual(['punch']);
	});
});
