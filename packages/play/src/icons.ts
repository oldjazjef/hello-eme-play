/**
 * The few icons the game's controls need, as SVG markup (paths from Lucide, ISC license).
 * Built with DOM methods, never `innerHTML`, so the game also runs under Trusted Types.
 */
export type IconName =
	'up' | 'down' | 'left' | 'right' | 'close' | 'panelOpen' | 'panelClose' | 'gamepad';

const PATHS: Record<IconName, readonly string[]> = {
	up: ['m5 12 7-7 7 7', 'M12 19V5'],
	down: ['M12 5v14', 'm19 12-7 7-7-7'],
	left: ['m12 19-7-7 7-7', 'M19 12H5'],
	right: ['M5 12h14', 'm12 5 7 7-7 7'],
	close: ['M18 6 6 18', 'm6 6 12 12'],
	panelOpen: [
		'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
		'M9 3v18',
		'm14 9 3 3-3 3'
	],
	panelClose: [
		'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
		'M9 3v18',
		'm16 15-3-3 3-3'
	],
	gamepad: [
		'M6 11h4',
		'M8 9v4',
		'M15 12h.01',
		'M18 10h.01',
		'M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z'
	]
};

const SVG = 'http://www.w3.org/2000/svg';

/** A decorative (screen readers skip it) 24×24 stroke icon. */
export function icon(name: IconName, className = 'play-icon'): SVGSVGElement {
	const svg = document.createElementNS(SVG, 'svg');
	svg.setAttribute('viewBox', '0 0 24 24');
	svg.setAttribute('fill', 'none');
	svg.setAttribute('stroke', 'currentColor');
	svg.setAttribute('stroke-width', '2');
	svg.setAttribute('stroke-linecap', 'round');
	svg.setAttribute('stroke-linejoin', 'round');
	svg.setAttribute('aria-hidden', 'true');
	svg.setAttribute('class', className);
	for (const d of PATHS[name]) {
		const path = document.createElementNS(SVG, 'path');
		path.setAttribute('d', d);
		svg.append(path);
	}
	return svg;
}
