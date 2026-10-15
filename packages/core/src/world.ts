import type { PlayConfig } from '@hello-eme/play-schema';
import { createEventBus, type EventBus } from './events.js';
import { createRandom, type Random } from './random.js';

export interface Entity {
	id: number;
	/** Key into `config.entities`. */
	definition: string;
	x: number;
	y: number;
	/** Current values by stat id. */
	stats: Record<string, number>;
}

export interface WorldEvents extends Record<string, unknown> {
	'entity.spawned': { entity: Entity };
	'entity.removed': { entity: Entity };
}

/** One step of the game: a system reads and changes the world. Systems run in the order given. */
export type System = (world: World, dt: number) => void;

export interface World {
	readonly config: PlayConfig;
	readonly events: EventBus<WorldEvents>;
	readonly random: Random;
	readonly entities: readonly Entity[];
	/** Adds an entity of a defined kind at a position; unknown definitions return undefined. */
	spawn(definition: string, x: number, y: number): Entity | undefined;
	remove(id: number): void;
	/** Runs every system once. */
	step(dt: number): void;
}

export interface WorldOptions {
	/** Same seed, same game. */
	seed?: number;
	systems?: readonly System[];
}

export function createWorld(config: PlayConfig, options: WorldOptions = {}): World {
	const events = createEventBus<WorldEvents>();
	const random = createRandom(options.seed ?? Date.now());
	const systems = options.systems ?? [];
	let entities: Entity[] = [];
	let nextId = 1;

	const world: World = {
		config,
		events,
		random,
		get entities() {
			return entities;
		},
		spawn(definition, x, y) {
			const found = config.entities[definition];
			if (!found) return undefined;
			const entity: Entity = { id: nextId++, definition, x, y, stats: { ...found.stats } };
			entities = [...entities, entity];
			events.emit('entity.spawned', { entity });
			return entity;
		},
		remove(id) {
			const entity = entities.find((candidate) => candidate.id === id);
			if (!entity) return;
			entities = entities.filter((candidate) => candidate.id !== id);
			events.emit('entity.removed', { entity });
		},
		step(dt) {
			for (const system of systems) system(world, dt);
		}
	};
	return world;
}
