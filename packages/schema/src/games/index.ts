import type { Preset } from '../presets.js';
import { bombastic } from './bombastic.js';
import { derby } from './derby.js';
import { dungeon } from './dungeon.js';
import { ememons } from './ememons.js';
import { laststand } from './laststand.js';
import { withObjects } from './objects.js';
import { pagio } from './pagio.js';
export { RETRO } from './retro/index.js';
import { roadrage } from './roadrage.js';
import { safari } from './safari.js';
import { slimes } from './slimes.js';
import { zombies } from './zombies.js';

/** Ten complete games with pictures, to load in the editor and play. */
export const GAMES: Record<string, Preset> = {
	'game-ememons': withObjects('game-ememons', ememons),
	'game-bombastic': withObjects('game-bombastic', bombastic),
	'game-roadrage': withObjects('game-roadrage', roadrage),
	'game-zombies': withObjects('game-zombies', zombies),
	'game-slimes': withObjects('game-slimes', slimes),
	'game-pagio': withObjects('game-pagio', pagio),
	'game-dungeon': withObjects('game-dungeon', dungeon),
	'game-laststand': withObjects('game-laststand', laststand),
	'game-safari': withObjects('game-safari', safari),
	'game-derby': withObjects('game-derby', derby)
};
