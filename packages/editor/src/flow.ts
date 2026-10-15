/**
 * The flow: what can set what off. Triggers, item pickups and upgrades are steps; an action that
 * causes an event (`setView` → `viewChange`, `nextLevel` → `levelUp`) leads on to the triggers
 * waiting for it. Also finds triggers that wait for something that cannot happen and loops.
 * Pure: works on the resolved configuration.
 */
import {
	PLAY_SCHEMA,
	type EventName,
	type Node,
	type ObjectNode,
	type PlayConfig
} from '@hello-eme/play-schema';
import type { Lang } from './labels.js';
import { describeActions, triggerParts } from './sentence.js';

export type StepKind = 'trigger' | 'item' | 'upgrade';

export interface FlowStep {
	kind: StepKind;
	/** The field path of the step's definition (`triggers.2`, `items.star`). */
	path: string;
	/** The event that sets it off. */
	event: EventName;
	/** What the event is, in words ("a monster is beaten"). */
	when: string;
	title: string;
	conditions: string[];
	actions: string[];
	/** Indices (into `steps`) of the triggers this step can cause. */
	causes: number[];
}

export type FlowWarning =
	| { code: 'noSource'; path: string; event: EventName }
	| { code: 'empty'; path: string }
	| { code: 'loop'; path: string; paths: string[] };

export interface Flow {
	steps: FlowStep[];
	warnings: FlowWarning[];
}

/** Events an action makes happen right away. */
const EMITS: Readonly<Record<string, readonly EventName[]>> = {
	setView: ['viewChange'],
	nextLevel: ['levelUp']
};

function nodeAt(root: Node, ...keys: string[]): Node | undefined {
	return keys.reduce<Node | undefined>(
		(node, key) => (node?.type === 'object' ? node.fields[key] : undefined),
		root
	);
}

function triggerNode(): ObjectNode {
	const list = nodeAt(PLAY_SCHEMA, 'triggers');
	if (list?.type !== 'list' || list.of.type !== 'object')
		throw new Error('triggers schema changed');
	return list.of;
}

function entryNode(key: 'items' | 'upgrades'): ObjectNode {
	const record = nodeAt(PLAY_SCHEMA, key);
	if (record?.type !== 'record' || record.of.type !== 'object')
		throw new Error(`${key} schema changed`);
	return record.of;
}

/** The events that can happen at all in this configuration (besides the always possible ones). */
function possible(config: PlayConfig, actions: readonly { do: string }[]): Set<EventName> {
	const events = new Set<EventName>(['start', 'interval', 'hurt', 'death', 'break', 'kill']);
	if (Object.keys(config.items).length > 0) events.add('pickup');
	if (Object.keys(config.upgrades).length > 0) events.add('upgrade');
	if (Object.values(config.entities).some((entity) => entity.kind === 'vehicle')) {
		events.add('enterVehicle');
		events.add('exitVehicle');
	}
	if (config.levels.length > 0) events.add('levelUp');
	if (config.levels.some((level) => level.view !== '')) events.add('viewChange');
	for (const action of actions) for (const name of EMITS[action.do] ?? []) events.add(name);
	return events;
}

export function analyzeFlow(config: PlayConfig, lang: Lang): Flow {
	const steps: FlowStep[] = [];
	const trigger = triggerNode();
	const eventLabelOf = (event: string) => {
		const field = trigger.fields.on;
		return field?.type === 'select' ? (field.optionLabels?.[event]?.[lang] ?? event) : event;
	};
	const doNode = (node: ObjectNode): Node | undefined => node.fields.do;

	config.triggers.forEach((item, index) => {
		const parts = triggerParts(trigger, item, config, lang);
		steps.push({
			kind: 'trigger',
			path: `triggers.${index}`,
			event: item.on,
			when: parts?.event ?? eventLabelOf(item.on),
			title: `${index + 1}`,
			conditions: parts?.conditions ?? [],
			actions: parts?.actions ?? [],
			causes: []
		});
	});

	const item = entryNode('items');
	for (const [id, definition] of Object.entries(config.items)) {
		steps.push({
			kind: 'item',
			path: `items.${id}`,
			event: 'pickup',
			when: eventLabelOf('pickup'),
			title: definition.label || id,
			conditions: [],
			actions: describeActions(doNode(item), definition.do, config, lang),
			causes: []
		});
	}
	const upgrade = entryNode('upgrades');
	for (const [id, definition] of Object.entries(config.upgrades)) {
		if (definition.do.length === 0) continue;
		steps.push({
			kind: 'upgrade',
			path: `upgrades.${id}`,
			event: 'upgrade',
			when: eventLabelOf('upgrade'),
			title: definition.label || id,
			conditions: [],
			actions: describeActions(doNode(upgrade), definition.do, config, lang),
			causes: []
		});
	}

	// What each step does, to find what it causes.
	const doneBy = [
		...config.triggers.map((entry) => entry.do),
		...Object.values(config.items).map((entry) => entry.do),
		...Object.values(config.upgrades)
			.filter((entry) => entry.do.length > 0)
			.map((entry) => entry.do)
	];
	steps.forEach((step, index) => {
		const emitted = new Set((doneBy[index] ?? []).flatMap((action) => EMITS[action.do] ?? []));
		step.causes = steps.flatMap((other, at) =>
			other.kind === 'trigger' && emitted.has(other.event) ? [at] : []
		);
	});

	const warnings: FlowWarning[] = [];
	const can = possible(config, doneBy.flat());
	for (const step of steps) {
		if (step.kind !== 'trigger') continue;
		if (!can.has(step.event))
			warnings.push({ code: 'noSource', path: step.path, event: step.event });
		if (step.actions.length === 0) warnings.push({ code: 'empty', path: step.path });
	}
	for (const cycle of cycles(steps)) {
		const first = cycle[0];
		if (first === undefined) continue;
		warnings.push({
			code: 'loop',
			path: steps[first]?.path ?? '',
			paths: cycle.map((at) => steps[at]?.path ?? '')
		});
	}
	return { steps, warnings };
}

/** Loops of steps that cause each other, each reported once (as the smallest rotation). */
function cycles(steps: readonly FlowStep[]): number[][] {
	const found = new Map<string, number[]>();
	const walk = (start: number, at: number, path: number[]) => {
		for (const next of steps[at]?.causes ?? []) {
			if (next === start) {
				const smallest = Math.min(...path);
				const turn = path.indexOf(smallest);
				const rotated = [...path.slice(turn), ...path.slice(0, turn)];
				found.set(rotated.join(','), rotated);
			} else if (!path.includes(next) && next > start) {
				// Only steps after the start: every loop is found from its smallest member.
				walk(start, next, [...path, next]);
			}
		}
	};
	steps.forEach((_, index) => walk(index, index, [index]));
	return [...found.values()];
}
