/** Event data for statistics: flat values only (tools like Umami chart strings and sum numbers). */
export type EventData = Record<string, string | number | boolean>;

/** How a round started: the toggle, or getting into a vehicle that drove in by itself. */
export type PlaySource = 'toggle' | 'visit';

/** Upper bounds (seconds) of the duration groups Umami shows as a chart. */
const DURATION_GROUPS: readonly [number, string][] = [
	[10, '0-10s'],
	[30, '10-30s'],
	[60, '30-60s'],
	[180, '1-3min'],
	[600, '3-10min']
];

export function durationGroup(seconds: number): string {
	return DURATION_GROUPS.find(([limit]) => seconds < limit)?.[1] ?? '10min+';
}
