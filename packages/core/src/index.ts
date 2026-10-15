/**
 * @hello-eme/play-core: the game logic without a DOM (entities, stats, systems, triggers, seeded
 * randomness), so it runs in tests and in headless simulations.
 */
export { createEventBus, type EventBus } from './events.js';
export { createRandom, type Random } from './random.js';
export {
	createStaticHost,
	EDGE,
	HARD_EDGE,
	radiusOf,
	sizeOf,
	type StaticHostOptions
} from './space.js';
export { statOf } from './stats.js';
export { ACTION_RUNNERS } from './triggers.js';
export { upgradePrice } from './progress.js';
export { CAR, isSkidding, rearWheels } from './vehicle.js';
export { JUMP_SECONDS, jumpHeight, STRIDE, walkFrame } from './walk.js';
export { createWorld, type WorldOptions } from './world.js';
export type {
	Body,
	Controls,
	DefeatSource,
	Host,
	Mod,
	Phase,
	Pickup,
	Platform,
	Stats,
	World,
	WorldEvents
} from './types.js';
