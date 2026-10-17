import type { Preset } from '../../presets.js';
import { asteroids } from './asteroids.js';
import { bricks } from './bricks.js';
import { frogger } from './frogger.js';
import { jumper } from './jumper.js';
import { munch } from './munch.js';
import { ping } from './ping.js';
import { snake } from './snake.js';
import { titan } from './titan.js';

/** Arcade classics rebuilt from the engine's pieces: a game of each kind to load and play. */
export const RETRO: Record<string, Preset> = {
	'retro-asteroids': asteroids,
	'retro-frogger': frogger,
	'retro-snake': snake,
	'retro-munch': munch,
	'retro-bricks': bricks,
	'retro-ping': ping,
	'retro-jumper': jumper,
	'retro-titan': titan
};
