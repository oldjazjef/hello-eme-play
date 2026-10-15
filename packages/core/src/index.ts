/**
 * @hello-eme/play-core: the game logic without a DOM (entities, stats, systems, events, seeded
 * randomness), so it runs in tests and in headless simulations.
 */
export { createEventBus, type EventBus } from './events.js';
export { createRandom, type Random } from './random.js';
export {
	createWorld,
	type Entity,
	type System,
	type World,
	type WorldEvents,
	type WorldOptions
} from './world.js';
