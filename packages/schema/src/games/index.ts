import type { Preset } from '../presets.js';
import { bombastic } from './bombastic.js';
import { derby } from './derby.js';
import { dungeon } from './dungeon.js';
import { ememons } from './ememons.js';
import { laststand } from './laststand.js';
import { pagio } from './pagio.js';
import { roadrage } from './roadrage.js';
import { safari } from './safari.js';
import { slimes } from './slimes.js';
import { zombies } from './zombies.js';

/** Ten complete games with pictures, to load in the editor and play. */
export const GAMES: Record<string, Preset> = {
	'game-ememons': ememons,
	'game-bombastic': bombastic,
	'game-roadrage': roadrage,
	'game-zombies': zombies,
	'game-slimes': slimes,
	'game-pagio': pagio,
	'game-dungeon': dungeon,
	'game-laststand': laststand,
	'game-safari': safari,
	'game-derby': derby
};
