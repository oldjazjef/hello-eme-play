/**
 * A tiny typed event bus. Everything that happens in the world is an event; triggers, statistics
 * and analytics only listen to it.
 */
export interface EventBus<Events extends Record<string, unknown>> {
	on<Name extends keyof Events>(name: Name, listener: (data: Events[Name]) => void): () => void;
	emit<Name extends keyof Events>(name: Name, data: Events[Name]): void;
}

export function createEventBus<Events extends Record<string, unknown>>(): EventBus<Events> {
	const listeners = new Map<keyof Events, Set<(data: never) => void>>();
	return {
		on(name, listener) {
			const set = listeners.get(name) ?? new Set();
			set.add(listener as (data: never) => void);
			listeners.set(name, set);
			return () => set.delete(listener as (data: never) => void);
		},
		emit(name, data) {
			for (const listener of listeners.get(name) ?? []) listener(data as never);
		}
	};
}
