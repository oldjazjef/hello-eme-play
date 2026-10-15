/**
 * @hello-eme/play-sim: plays many seeded rounds of a configuration headlessly with a bot, and
 * reports how they went (for balancing). Also the `play-sim` command.
 */
export { BOTS, botByName, type Bot, type BotName } from './bot.js';
export {
	playRound,
	simulate,
	type Outcome,
	type Report,
	type Round,
	type SimOptions,
	type Summary
} from './sim.js';
