/** Pictures for the arcade classics: ships, rocks, bricks, ghosts … small SVGs as `data:` addresses. */
import { INK, wrap } from '../art.js';

const line = `stroke="${INK}" stroke-width="2.5"`;

/** A spaceship from above, nose to the right. */
export function rocket(color: string, accent = '#fde047'): string {
	return wrap(
		`<path d="M6 8 L44 24 L6 40 L14 24 Z" fill="${color}" ${line}/><path d="M18 18 L34 24 L18 30 Z" fill="${accent}"/><circle cx="26" cy="24" r="3.5" fill="#e0f2fe"/>`,
		48,
		48
	);
}

/** A rough rock. */
export function asteroid(color: string, accent = '#e2e8f0'): string {
	return wrap(
		`<path d="M10 38 L6 22 L16 8 L34 6 L54 16 L58 34 L44 56 L24 56 Z" fill="${color}" ${line}/><path d="M18 20 L30 16 M30 42 L44 36 M16 34 L24 30" stroke="${accent}" stroke-width="3" fill="none" opacity=".55"/>`
	);
}

/** A flying saucer. */
export function saucer(color: string, accent = '#fde047'): string {
	return wrap(
		`<ellipse cx="32" cy="24" rx="12" ry="12" fill="#bae6fd" ${line}/><ellipse cx="32" cy="36" rx="28" ry="10" fill="${color}" ${line}/><circle cx="14" cy="36" r="2.5" fill="${accent}"/><circle cx="32" cy="40" r="2.5" fill="${accent}"/><circle cx="50" cy="36" r="2.5" fill="${accent}"/>`
	);
}

/** A short beam, flying to the right. */
export function beam(color: string): string {
	return wrap(
		`<rect x="2" y="9" width="44" height="10" rx="5" fill="${color}" ${line}/><rect x="8" y="12" width="32" height="4" rx="2" fill="#ffffff" opacity=".8"/>`,
		48,
		28
	);
}

/** A glowing round shot. */
export function orb(color: string): string {
	return wrap(
		`<circle cx="16" cy="16" r="12" fill="${color}" ${line}/><circle cx="12" cy="12" r="4" fill="#ffffff" opacity=".8"/>`,
		32,
		32
	);
}

/** A brick, twice as wide as high. */
export function brick(color: string, accent = '#ffffff'): string {
	return wrap(
		`<rect x="2" y="2" width="60" height="28" rx="5" fill="${color}" ${line}/><rect x="7" y="6" width="50" height="6" rx="3" fill="${accent}" opacity=".35"/>`,
		64,
		32
	);
}

/** A stone that never breaks. */
export function steel(): string {
	return wrap(
		`<rect x="2" y="2" width="60" height="28" rx="5" fill="#64748b" ${line}/><path d="M8 8 L56 8 M8 24 L56 24" stroke="#cbd5e1" stroke-width="2" opacity=".6"/><circle cx="10" cy="16" r="2" fill="#cbd5e1"/><circle cx="54" cy="16" r="2" fill="#cbd5e1"/>`,
		64,
		32
	);
}

/** A paddle: a wide, thin bar. */
export function paddle(color: string, accent = '#ffffff'): string {
	return wrap(
		`<rect x="2" y="3" width="116" height="18" rx="9" fill="${color}" ${line}/><rect x="14" y="7" width="92" height="4" rx="2" fill="${accent}" opacity=".5"/>`,
		120,
		24
	);
}

/** A ball. */
export function puck(color: string): string {
	return wrap(
		`<circle cx="16" cy="16" r="13" fill="${color}" ${line}/><circle cx="11" cy="11" r="4" fill="#ffffff" opacity=".7"/>`,
		32,
		32
	);
}

/** A small round dot (a pellet). */
export function dot(color: string, radius = 8): string {
	return wrap(`<circle cx="16" cy="16" r="${radius}" fill="${color}" ${line}/>`, 32, 32);
}

/** A round muncher with a wedge missing: it faces right. */
export function muncher(color: string): string {
	return wrap(
		`<path d="M32 32 L58 16 A28 28 0 1 0 58 48 Z" fill="${color}" ${line}/><circle cx="34" cy="16" r="3.5" fill="${INK}"/>`
	);
}

/** A ghost with eyes. */
export function ghost(color: string): string {
	return wrap(
		`<path d="M8 58 L8 30 A24 24 0 0 1 56 30 L56 58 L48 50 L40 58 L32 50 L24 58 L16 50 Z" fill="${color}" ${line}/><circle cx="23" cy="30" r="7" fill="#ffffff"/><circle cx="41" cy="30" r="7" fill="#ffffff"/><circle cx="25" cy="31" r="3.5" fill="${INK}"/><circle cx="43" cy="31" r="3.5" fill="${INK}"/>`
	);
}

/** A maze wall tile. */
export function hedgeWall(color: string): string {
	return wrap(
		`<rect x="2" y="2" width="60" height="60" rx="14" fill="${color}" ${line}/><rect x="10" y="10" width="44" height="44" rx="8" fill="none" stroke="#ffffff" stroke-width="2.5" opacity=".35"/>`
	);
}

/** A snake's head, looking right. */
export function snakeHead(color: string): string {
	return wrap(
		`<rect x="4" y="8" width="56" height="48" rx="20" fill="${color}" ${line}/><circle cx="42" cy="22" r="7" fill="#ffffff"/><circle cx="42" cy="42" r="7" fill="#ffffff"/><circle cx="44" cy="22" r="3.5" fill="${INK}"/><circle cx="44" cy="42" r="3.5" fill="${INK}"/><path d="M60 32 L70 32" stroke="#ef4444" stroke-width="3"/>`
	);
}

/** A frog from above, looking up. */
export function frog(color: string): string {
	return wrap(
		`<ellipse cx="32" cy="38" rx="20" ry="18" fill="${color}" ${line}/><circle cx="22" cy="18" r="9" fill="${color}" ${line}/><circle cx="42" cy="18" r="9" fill="${color}" ${line}/><circle cx="22" cy="17" r="4.5" fill="#ffffff"/><circle cx="42" cy="17" r="4.5" fill="#ffffff"/><circle cx="22" cy="15" r="2.2" fill="${INK}"/><circle cx="42" cy="15" r="2.2" fill="${INK}"/><path d="M12 54 L4 60 M52 54 L60 60 M12 34 L4 30 M52 34 L60 30" stroke="${INK}" stroke-width="4"/>`
	);
}

/** A grassy or roadside tile. */
export function tile(color: string, accent: string): string {
	return wrap(
		`<rect x="0" y="0" width="64" height="64" fill="${color}"/><path d="M8 52 L12 40 M24 56 L26 44 M44 54 L48 42 M54 20 L56 10 M14 18 L16 8" stroke="${accent}" stroke-width="3" fill="none"/>`
	);
}

/** A plain platform, wide and thin. */
export function ledge(color: string, accent: string): string {
	return wrap(
		`<rect x="2" y="2" width="124" height="30" rx="6" fill="${color}" ${line}/><rect x="2" y="2" width="124" height="10" rx="5" fill="${accent}" ${line}/>`,
		128,
		34
	);
}

/** A walking mushroom-like creature, seen from the side. */
export function walker(color: string, accent = '#ffffff'): string {
	return wrap(
		`<path d="M6 34 A26 26 0 0 1 58 34 Z" fill="${color}" ${line}/><circle cx="20" cy="24" r="5" fill="${accent}" opacity=".8"/><circle cx="40" cy="20" r="6" fill="${accent}" opacity=".8"/><rect x="18" y="34" width="28" height="18" rx="6" fill="#fde68a" ${line}/><circle cx="26" cy="42" r="3" fill="${INK}"/><circle cx="38" cy="42" r="3" fill="${INK}"/><rect x="14" y="54" width="14" height="6" rx="3" fill="${INK}"/><rect x="36" y="54" width="14" height="6" rx="3" fill="${INK}"/>`
	);
}

/** A runner seen from the side. */
export function runner(color: string, hat = '#ef4444'): string {
	return wrap(
		`<circle cx="32" cy="16" r="11" fill="#fcd9b6" ${line}/><path d="M20 12 A12 12 0 0 1 44 12 L48 14 L22 16 Z" fill="${hat}" ${line}/><rect x="20" y="26" width="24" height="22" rx="7" fill="${color}" ${line}/><rect x="20" y="46" width="10" height="14" rx="4" fill="#1e3a8a" ${line}/><rect x="34" y="46" width="10" height="14" rx="4" fill="#1e3a8a" ${line}/><circle cx="38" cy="15" r="2" fill="${INK}"/>`
	);
}

/** A flag on a pole. */
export function flag(color: string): string {
	return wrap(
		`<rect x="14" y="4" width="5" height="56" rx="2" fill="#475569" ${line}/><path d="M19 8 L52 18 L19 30 Z" fill="${color}" ${line}/>`
	);
}

/** A little shining coin. */
export function coin(): string {
	return wrap(
		`<circle cx="16" cy="16" r="13" fill="#fbbf24" ${line}/><circle cx="16" cy="16" r="8" fill="none" stroke="#fef3c7" stroke-width="2.5"/>`,
		32,
		32
	);
}

/** A spring on the ground. */
export function coil(color: string): string {
	return wrap(
		`<rect x="6" y="52" width="52" height="8" rx="3" fill="#475569" ${line}/><path d="M12 50 L52 42 L12 34 L52 26 L12 18" fill="none" stroke="${color}" stroke-width="6"/><rect x="8" y="8" width="48" height="10" rx="4" fill="${color}" ${line}/>`
	);
}

/** Lava or water, a plain tile that hurts. */
export function pool(color: string, accent: string): string {
	return wrap(
		`<rect x="0" y="12" width="64" height="40" rx="6" fill="${color}" ${line}/><path d="M6 24 Q16 16 26 24 T46 24 T62 24" stroke="${accent}" stroke-width="3" fill="none"/>`
	);
}

/** A big boss: a stone face. */
export function colossus(color: string, accent: string): string {
	return wrap(
		`<path d="M10 56 L10 24 A22 22 0 0 1 54 24 L54 56 Z" fill="${color}" ${line}/><path d="M16 12 L22 2 L28 12 M36 12 L42 2 L48 12" fill="${accent}" ${line}/><circle cx="24" cy="30" r="6" fill="#fde047" ${line}/><circle cx="40" cy="30" r="6" fill="#fde047" ${line}/><circle cx="25" cy="31" r="2.5" fill="${INK}"/><circle cx="41" cy="31" r="2.5" fill="${INK}"/><path d="M22 46 L28 42 L32 46 L36 42 L42 46" fill="none" stroke="${INK}" stroke-width="3"/>`
	);
}

/** A small helper bot. */
export function drone(color: string): string {
	return wrap(
		`<rect x="12" y="20" width="40" height="28" rx="10" fill="${color}" ${line}/><circle cx="32" cy="34" r="8" fill="#fde047" ${line}/><circle cx="32" cy="34" r="3" fill="${INK}"/><path d="M32 20 L32 8 M24 8 L40 8" stroke="${INK}" stroke-width="3"/>`
	);
}

/** A hero from above (a small knight with a sword), looking right. */
export function knight(color: string): string {
	return wrap(
		`<circle cx="26" cy="32" r="14" fill="${color}" ${line}/><circle cx="32" cy="28" r="4" fill="#fcd9b6"/><rect x="34" y="40" width="26" height="6" rx="3" fill="#e2e8f0" ${line}/><circle cx="22" cy="38" r="5" fill="#fbbf24" ${line}/>`
	);
}

/** A moving platform / log: a wide plank. */
export function plank(): string {
	return wrap(
		`<rect x="2" y="6" width="124" height="20" rx="8" fill="#a16207" ${line}/><path d="M20 10 L20 22 M60 10 L60 22 M100 10 L100 22" stroke="#fde68a" stroke-width="2" opacity=".6"/>`,
		128,
		32
	);
}

/** A paddle standing upright (for the left or right edge). */
export function paddleUpright(color: string, accent = '#ffffff'): string {
	return wrap(
		`<rect x="3" y="2" width="18" height="116" rx="9" fill="${color}" ${line}/><rect x="7" y="14" width="4" height="92" rx="2" fill="${accent}" opacity=".5"/>`,
		24,
		120
	);
}
