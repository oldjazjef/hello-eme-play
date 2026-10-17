/**
 * Pictures for the example games, made as small SVGs and handed out as `data:` addresses, so a game
 * loads and plays without any file next to it. Creatures and people are seen from the front (the
 * sprite setting `rotate: false` keeps them upright), vehicles from above, facing right. No DOM.
 */
import type { Facing } from '../types.js';

const INK = '#1e1b4b';

const uri = (svg: string): string => `data:image/svg+xml,${encodeURIComponent(svg)}`;
const wrap = (body: string, width = 64, height = 64): string =>
	uri(
		`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" stroke-linejoin="round" stroke-linecap="round">${body}</svg>`
	);

/** A picture entry for `sprites`: the address, the size on the page and where it looks. */
export function sprite(url: string, size: number, facing: Facing = 'down', rotate = false) {
	return { url, size, facing, rotate };
}

export type Feature =
	| 'none'
	| 'ears'
	| 'horns'
	| 'leaf'
	| 'flame'
	| 'fin'
	| 'wings'
	| 'spikes'
	| 'antenna'
	| 'crown'
	| 'shell';

export interface CreatureOptions {
	body: string;
	belly?: string;
	accent?: string;
	feature?: Feature;
	/** `spots` or `stripes` on the body. */
	pattern?: 'none' | 'spots' | 'stripes';
	/** Fangs instead of a smile. */
	fangs?: boolean;
	/** One big eye. */
	cyclops?: boolean;
	/** Tired, angry or sleepy eyes. */
	mood?: 'happy' | 'angry' | 'sleepy';
}

function featureOf(
	feature: Feature,
	body: string,
	accent: string
): { back: string; front: string } {
	const stroke = `stroke="${INK}" stroke-width="2.5"`;
	switch (feature) {
		case 'ears':
			return {
				back: `<path d="M14 26 L10 6 L26 18 Z" fill="${body}" ${stroke}/><path d="M50 26 L54 6 L38 18 Z" fill="${body}" ${stroke}/><path d="M14 22 L13 12 L20 18 Z" fill="${accent}"/><path d="M50 22 L51 12 L44 18 Z" fill="${accent}"/>`,
				front: ''
			};
		case 'horns':
			return {
				back: `<path d="M16 24 L10 6 L24 17 Z" fill="${accent}" ${stroke}/><path d="M48 24 L54 6 L40 17 Z" fill="${accent}" ${stroke}/>`,
				front: ''
			};
		case 'leaf':
			return {
				back: `<path d="M32 20 C24 6 10 8 8 12 C14 20 24 22 32 20 Z" fill="${accent}" ${stroke}/><path d="M32 20 C40 6 54 8 56 12 C50 20 40 22 32 20 Z" fill="${accent}" ${stroke}/>`,
				front: ''
			};
		case 'flame':
			return {
				back: `<path d="M32 22 C20 14 26 6 30 2 C30 10 38 10 38 18 C42 14 42 10 40 8 C48 14 46 22 32 22 Z" fill="${accent}" ${stroke}/><path d="M32 22 C27 18 30 13 32 11 C34 14 37 15 32 22 Z" fill="#fde047"/>`,
				front: ''
			};
		case 'fin':
			return {
				back: `<path d="M32 22 C24 8 18 8 16 10 C20 16 22 20 22 24 Z" fill="${accent}" ${stroke}/><path d="M32 22 C40 8 46 8 48 10 C44 16 42 20 42 24 Z" fill="${accent}" ${stroke}/><path d="M32 56 L22 62 L42 62 Z" fill="${accent}" ${stroke}/>`,
				front: ''
			};
		case 'wings':
			return {
				back: `<path d="M16 34 C2 22 2 40 6 46 C12 44 14 42 18 42 Z" fill="${accent}" ${stroke}/><path d="M48 34 C62 22 62 40 58 46 C52 44 50 42 46 42 Z" fill="${accent}" ${stroke}/>`,
				front: ''
			};
		case 'spikes':
			return {
				back: `<path d="M18 24 L22 10 L28 20 L32 6 L36 20 L42 10 L46 24 Z" fill="${accent}" ${stroke}/>`,
				front: ''
			};
		case 'antenna':
			return {
				back: `<path d="M26 20 C24 12 20 8 16 8 M38 20 C40 12 44 8 48 8" fill="none" stroke="${INK}" stroke-width="2.5"/><circle cx="16" cy="8" r="3.5" fill="${accent}" ${stroke}/><circle cx="48" cy="8" r="3.5" fill="${accent}" ${stroke}/>`,
				front: ''
			};
		case 'crown':
			return {
				back: '',
				front: `<path d="M20 22 L20 10 L26 16 L32 6 L38 16 L44 10 L44 22 Z" fill="#facc15" ${stroke}/><circle cx="32" cy="15" r="2" fill="${accent}"/>`
			};
		case 'shell':
			return {
				back: '',
				front: `<ellipse cx="32" cy="46" rx="17" ry="9" fill="${accent}" ${stroke}/><path d="M22 44 L26 50 M32 42 L32 52 M42 44 L38 50" stroke="${INK}" stroke-width="2" fill="none"/>`
			};
		default:
			return { back: '', front: '' };
	}
}

/** A creature from the front: a round body with a belly, a face and one feature. */
export function creature(options: CreatureOptions): string {
	const { body, belly = '#fff7e0', accent = '#f97316', feature = 'none' } = options;
	const stroke = `stroke="${INK}" stroke-width="2.5"`;
	const parts = featureOf(feature, body, accent);
	const pattern =
		options.pattern === 'spots'
			? `<circle cx="20" cy="38" r="3.5" fill="${accent}" opacity=".8"/><circle cx="44" cy="34" r="4" fill="${accent}" opacity=".8"/><circle cx="40" cy="48" r="3" fill="${accent}" opacity=".8"/>`
			: options.pattern === 'stripes'
				? `<path d="M18 32 L26 30 M16 40 L26 38 M46 32 L38 30 M48 40 L38 38" stroke="${accent}" stroke-width="3.5" fill="none" opacity=".85"/>`
				: '';
	const mood = options.mood ?? 'happy';
	const eye = (x: number) =>
		options.cyclops
			? ''
			: `<ellipse cx="${x}" cy="33" rx="5" ry="${mood === 'sleepy' ? 2 : 6}" fill="#fff" ${stroke}/><circle cx="${x + (x < 32 ? 1 : -1)}" cy="34" r="2.6" fill="${INK}"/>`;
	const eyes = options.cyclops
		? `<ellipse cx="32" cy="32" rx="9" ry="8" fill="#fff" ${stroke}/><circle cx="32" cy="33" r="4" fill="${INK}"/><circle cx="34" cy="31" r="1.4" fill="#fff"/>`
		: `${eye(23)}${eye(41)}`;
	const brows =
		mood === 'angry' && !options.cyclops
			? `<path d="M16 24 L28 29 M48 24 L36 29" stroke="${INK}" stroke-width="3" fill="none"/>`
			: '';
	const mouth = options.fangs
		? `<path d="M24 46 Q32 52 40 46" fill="#fff" ${stroke}/><path d="M27 47 L28.5 51 L30 48 M34 48 L35.5 51 L37 47" fill="#fff" stroke="${INK}" stroke-width="1.5"/>`
		: mood === 'angry'
			? `<path d="M25 49 Q32 44 39 49" fill="none" stroke="${INK}" stroke-width="2.5"/>`
			: `<path d="M26 45 Q32 52 38 45" fill="none" stroke="${INK}" stroke-width="2.5"/>`;
	const cheeks =
		mood === 'happy' && !options.fangs
			? `<circle cx="16" cy="43" r="3.2" fill="${accent}" opacity=".45"/><circle cx="48" cy="43" r="3.2" fill="${accent}" opacity=".45"/>`
			: '';
	return wrap(
		`${parts.back}<ellipse cx="32" cy="40" rx="22" ry="19" fill="${body}" ${stroke}/>${pattern}<ellipse cx="32" cy="46" rx="13" ry="10" fill="${belly}" opacity=".9"/>${eyes}${brows}${mouth}${cheeks}${parts.front}`
	);
}

export interface PersonOptions {
	skin?: string;
	hair?: string;
	shirt: string;
	pants?: string;
	/** `cap`, `helmet`, `hood`, `crown` or `hat`. */
	hat?: 'none' | 'cap' | 'helmet' | 'hood' | 'crown' | 'hat';
	hatColor?: string;
	/** Something held in the hand. */
	holds?: 'none' | 'sword' | 'net' | 'bomb' | 'ball' | 'wrench';
	cape?: string;
}

/** A person from the front. */
export function person(options: PersonOptions): string {
	const {
		skin = '#f6b98f',
		hair = '#3b2a20',
		shirt,
		pants = '#334155',
		hatColor = '#dc2626'
	} = options;
	const stroke = `stroke="${INK}" stroke-width="2.5"`;
	const cape = options.cape
		? `<path d="M20 30 L12 58 L52 58 L44 30 Z" fill="${options.cape}" ${stroke}/>`
		: '';
	const hats: Record<string, string> = {
		none: `<path d="M20 20 C20 8 44 8 44 20 C38 14 26 14 20 20 Z" fill="${hair}" ${stroke}/>`,
		cap: `<path d="M19 20 C19 6 45 6 45 20 Z" fill="${hatColor}" ${stroke}/><path d="M34 19 L52 21 L34 24 Z" fill="${hatColor}" ${stroke}/>`,
		helmet: `<path d="M18 22 C18 4 46 4 46 22 Z" fill="#94a3b8" ${stroke}/><path d="M30 6 L34 6 L34 16 L30 16 Z" fill="${hatColor}"/>`,
		hood: `<path d="M16 26 C14 4 50 4 48 26 C44 16 20 16 16 26 Z" fill="${hatColor}" ${stroke}/>`,
		crown: `<path d="M20 18 L20 6 L26 12 L32 3 L38 12 L44 6 L44 18 Z" fill="#facc15" ${stroke}/>`,
		hat: `<ellipse cx="32" cy="16" rx="18" ry="4" fill="${hatColor}" ${stroke}/><path d="M22 16 C22 4 42 4 42 16 Z" fill="${hatColor}" ${stroke}/>`
	};
	const holds = options.holds ?? 'none';
	const held: Record<string, string> = {
		none: '',
		sword: `<path d="M52 44 L58 12" stroke="#e2e8f0" stroke-width="4"/><path d="M48 44 L56 44" stroke="${INK}" stroke-width="3"/>`,
		net: `<path d="M52 46 L56 20" stroke="#92400e" stroke-width="3"/><circle cx="56" cy="14" r="8" fill="#fff" fill-opacity=".5" ${stroke}/>`,
		bomb: `<circle cx="54" cy="42" r="6" fill="${INK}"/><path d="M54 36 L57 31" stroke="${INK}" stroke-width="2"/><circle cx="58" cy="30" r="2" fill="#f97316"/>`,
		ball: `<circle cx="54" cy="42" r="6" fill="#dc2626" ${stroke}/><path d="M48 42 L60 42" stroke="${INK}" stroke-width="2"/><circle cx="54" cy="42" r="2" fill="#fff" stroke="${INK}" stroke-width="1.5"/>`,
		wrench: `<path d="M52 48 L56 26" stroke="#94a3b8" stroke-width="4"/><circle cx="57" cy="22" r="5" fill="none" stroke="#94a3b8" stroke-width="3"/>`
	};
	return wrap(
		`${cape}<rect x="22" y="48" width="8" height="12" rx="3" fill="${pants}" ${stroke}/><rect x="34" y="48" width="8" height="12" rx="3" fill="${pants}" ${stroke}/><rect x="18" y="28" width="28" height="24" rx="8" fill="${shirt}" ${stroke}/><rect x="12" y="30" width="8" height="16" rx="4" fill="${shirt}" ${stroke}/><rect x="44" y="30" width="8" height="16" rx="4" fill="${shirt}" ${stroke}/><circle cx="16" cy="48" r="3.5" fill="${skin}" ${stroke}/><circle cx="48" cy="48" r="3.5" fill="${skin}" ${stroke}/><circle cx="32" cy="20" r="12" fill="${skin}" ${stroke}/><circle cx="27" cy="21" r="2" fill="${INK}"/><circle cx="37" cy="21" r="2" fill="${INK}"/><path d="M28 26 Q32 29 36 26" fill="none" stroke="${INK}" stroke-width="2"/>${hats[options.hat ?? 'none']}${held[holds]}`
	);
}

export type VehicleKind = 'car' | 'bike' | 'truck' | 'tank' | 'sports' | 'ship' | 'monster';

/** A vehicle from above, facing right. */
export function vehicle(kind: VehicleKind, color: string, accent = '#fde047'): string {
	const stroke = `stroke="${INK}" stroke-width="2.5"`;
	const wheel = (x: number, y: number, r = 5) =>
		`<rect x="${x - r}" y="${y - r * 0.6}" width="${r * 2}" height="${r * 1.2}" rx="2" fill="${INK}"/>`;
	let body: string;
	switch (kind) {
		case 'bike':
			body = `<rect x="16" y="22" width="64" height="4" rx="2" fill="#475569" ${stroke}/><rect x="10" y="20" width="14" height="8" rx="4" fill="${INK}"/><rect x="72" y="20" width="14" height="8" rx="4" fill="${INK}"/><ellipse cx="46" cy="24" rx="14" ry="7" fill="${color}" ${stroke}/><circle cx="48" cy="24" r="6" fill="#f6b98f" ${stroke}/><path d="M70 14 L78 24 L70 34" fill="none" stroke="${INK}" stroke-width="3"/>`;
			break;
		case 'truck':
			body = `${wheel(22, 8)}${wheel(46, 8)}${wheel(22, 40)}${wheel(46, 40)}${wheel(76, 8)}${wheel(76, 40)}<rect x="6" y="9" width="52" height="30" rx="3" fill="#cbd5e1" ${stroke}/><rect x="58" y="9" width="30" height="30" rx="6" fill="${color}" ${stroke}/><rect x="72" y="13" width="12" height="22" rx="3" fill="#bae6fd" ${stroke}/><rect x="86" y="14" width="4" height="6" fill="${accent}"/><rect x="86" y="28" width="4" height="6" fill="${accent}"/>`;
			break;
		case 'tank':
			body = `<rect x="8" y="4" width="76" height="12" rx="5" fill="#475569" ${stroke}/><rect x="8" y="32" width="76" height="12" rx="5" fill="#475569" ${stroke}/><rect x="12" y="12" width="68" height="24" rx="5" fill="${color}" ${stroke}/><circle cx="44" cy="24" r="10" fill="${color}" ${stroke}/><rect x="48" y="21" width="42" height="6" rx="2" fill="#475569" ${stroke}/>`;
			break;
		case 'sports':
			body = `${wheel(26, 7)}${wheel(26, 41)}${wheel(70, 7)}${wheel(70, 41)}<path d="M6 24 C6 14 18 10 30 10 L60 10 C74 10 90 16 92 24 C90 32 74 38 60 38 L30 38 C18 38 6 34 6 24 Z" fill="${color}" ${stroke}/><path d="M44 14 L60 14 L64 24 L60 34 L44 34 Z" fill="#bae6fd" ${stroke}/><path d="M10 24 L88 24" stroke="${accent}" stroke-width="3"/>`;
			break;
		case 'ship':
			body = `<path d="M4 24 C8 8 40 6 60 8 L92 24 L60 40 C40 42 8 40 4 24 Z" fill="${color}" ${stroke}/><circle cx="40" cy="24" r="9" fill="#e2e8f0" ${stroke}/><rect x="52" y="20" width="26" height="8" rx="3" fill="${accent}" ${stroke}/>`;
			break;
		case 'monster':
			body = `<rect x="4" y="2" width="22" height="14" rx="4" fill="${INK}"/><rect x="4" y="32" width="22" height="14" rx="4" fill="${INK}"/><rect x="62" y="2" width="22" height="14" rx="4" fill="${INK}"/><rect x="62" y="32" width="22" height="14" rx="4" fill="${INK}"/><rect x="8" y="10" width="76" height="28" rx="8" fill="${color}" ${stroke}/><rect x="50" y="13" width="22" height="22" rx="5" fill="#bae6fd" ${stroke}/><rect x="84" y="14" width="5" height="7" fill="${accent}"/><rect x="84" y="27" width="5" height="7" fill="${accent}"/>`;
			break;
		default:
			body = `${wheel(22, 6)}${wheel(22, 42)}${wheel(66, 6)}${wheel(66, 42)}<rect x="6" y="8" width="82" height="32" rx="9" fill="${color}" ${stroke}/><rect x="52" y="12" width="20" height="24" rx="4" fill="#bae6fd" ${stroke}/><rect x="20" y="12" width="14" height="24" rx="4" fill="#e0f2fe" opacity=".7"/><rect x="86" y="12" width="4" height="7" fill="${accent}"/><rect x="86" y="29" width="4" height="7" fill="${accent}"/>`;
	}
	return wrap(body, 96, 48);
}

export type IconKind =
	| 'potion'
	| 'coin'
	| 'heart'
	| 'star'
	| 'bomb'
	| 'ball'
	| 'bolt'
	| 'box'
	| 'flask'
	| 'shield'
	| 'boot'
	| 'gem'
	| 'rock'
	| 'fireball'
	| 'apple'
	| 'tree'
	| 'wall'
	| 'spikes'
	| 'spring'
	| 'hedge'
	| 'barricade';

/** A small picture of a thing (an item, a throwable). */
export function icon(kind: IconKind, color: string, accent = '#ffffff'): string {
	const stroke = `stroke="${INK}" stroke-width="3"`;
	const shapes: Record<IconKind, string> = {
		tree: `<rect x="27" y="38" width="10" height="22" rx="2" fill="#92400e" ${stroke}/><circle cx="32" cy="26" r="20" fill="${color}" ${stroke}/><circle cx="24" cy="20" r="6" fill="${accent}" opacity=".35"/><circle cx="40" cy="30" r="5" fill="${accent}" opacity=".25"/>`,
		wall: `<rect x="4" y="10" width="56" height="44" rx="3" fill="${color}" ${stroke}/><path d="M4 24 L60 24 M4 38 L60 38 M20 10 L20 24 M44 10 L44 24 M32 24 L32 38 M14 38 L14 54 M48 38 L48 54" stroke="${accent}" stroke-width="2.5" fill="none" opacity=".8"/>`,
		spikes: `<path d="M4 56 L4 54 L12 12 L20 54 L22 54 L30 8 L38 54 L40 54 L48 12 L56 54 L60 56 Z" fill="${color}" ${stroke}/><path d="M12 12 L10 40 M30 8 L28 38 M48 12 L46 40" stroke="${accent}" stroke-width="2.5" fill="none" opacity=".7"/>`,
		spring: `<circle cx="32" cy="32" r="26" fill="${color}" ${stroke}/><circle cx="32" cy="32" r="17" fill="none" stroke="${accent}" stroke-width="3" opacity=".75"/><path d="M32 20 L32 44 M20 32 L44 32" stroke="${accent}" stroke-width="5"/>`,
		hedge: `<circle cx="18" cy="36" r="16" fill="${color}" ${stroke}/><circle cx="46" cy="36" r="16" fill="${color}" ${stroke}/><circle cx="32" cy="24" r="18" fill="${color}" ${stroke}/><circle cx="26" cy="20" r="3" fill="${accent}" opacity=".7"/><circle cx="40" cy="30" r="3" fill="${accent}" opacity=".7"/><circle cx="20" cy="40" r="3" fill="${accent}" opacity=".7"/>`,
		barricade: `<rect x="4" y="22" width="56" height="10" rx="3" fill="${color}" ${stroke}/><rect x="4" y="40" width="56" height="10" rx="3" fill="${color}" ${stroke}/><path d="M10 14 L10 58 M54 14 L54 58" stroke="${INK}" stroke-width="5"/><path d="M14 22 L22 32 M30 22 L38 32 M46 22 L54 32" stroke="${accent}" stroke-width="3"/>`,
		potion: `<path d="M26 8 L38 8 L38 22 L50 48 C52 54 48 58 42 58 L22 58 C16 58 12 54 14 48 L26 22 Z" fill="${color}" ${stroke}/><rect x="24" y="4" width="16" height="8" rx="2" fill="#92400e" ${stroke}/><path d="M20 44 L44 44" stroke="${accent}" stroke-width="3" opacity=".7"/>`,
		flask: `<path d="M24 6 L40 6 L40 24 L54 52 C56 58 52 60 46 60 L18 60 C12 60 8 58 10 52 L24 24 Z" fill="${color}" fill-opacity=".85" ${stroke}/><path d="M20 6 L44 6" stroke="${INK}" stroke-width="4"/>`,
		coin: `<circle cx="32" cy="32" r="24" fill="${color}" ${stroke}/><circle cx="32" cy="32" r="16" fill="none" stroke="${accent}" stroke-width="3" opacity=".8"/><path d="M32 22 L32 42 M27 27 Q32 21 37 27 Q27 34 37 39 Q32 44 27 38" fill="none" stroke="${accent}" stroke-width="3"/>`,
		heart: `<path d="M32 56 C4 36 8 10 24 12 C28 12 31 15 32 19 C33 15 36 12 40 12 C56 10 60 36 32 56 Z" fill="${color}" ${stroke}/><path d="M18 22 Q22 16 27 18" fill="none" stroke="${accent}" stroke-width="3" opacity=".8"/>`,
		star: `<path d="M32 4 L40 24 L61 25 L45 38 L50 59 L32 47 L14 59 L19 38 L3 25 L24 24 Z" fill="${color}" ${stroke}/>`,
		bomb: `<circle cx="30" cy="38" r="20" fill="${color}" ${stroke}/><path d="M42 20 L50 10" stroke="#92400e" stroke-width="4"/><circle cx="52" cy="8" r="5" fill="#f97316" ${stroke}/><path d="M20 32 Q22 26 28 26" fill="none" stroke="${accent}" stroke-width="3" opacity=".6"/>`,
		ball: `<circle cx="32" cy="32" r="26" fill="${color}" ${stroke}/><path d="M6 32 A26 26 0 0 0 58 32 Z" fill="${accent}" ${stroke}/><path d="M6 32 L58 32" stroke="${INK}" stroke-width="4"/><circle cx="32" cy="32" r="8" fill="${accent}" ${stroke}/>`,
		bolt: `<path d="M38 2 L12 36 L28 36 L22 62 L52 24 L34 24 Z" fill="${color}" ${stroke}/>`,
		box: `<rect x="8" y="14" width="48" height="42" rx="4" fill="${color}" ${stroke}/><path d="M8 26 L56 26 M32 14 L32 26" stroke="${INK}" stroke-width="3"/><rect x="26" y="26" width="12" height="10" fill="${accent}" ${stroke}/>`,
		shield: `<path d="M32 4 L56 12 L54 34 C52 46 42 54 32 60 C22 54 12 46 10 34 L8 12 Z" fill="${color}" ${stroke}/><path d="M32 14 L32 50 M18 28 L46 28" stroke="${accent}" stroke-width="4"/>`,
		boot: `<path d="M20 6 L40 6 L40 30 L58 38 C60 50 56 56 48 56 L14 56 C10 56 8 52 10 48 L20 40 Z" fill="${color}" ${stroke}/><path d="M20 12 L40 12" stroke="${accent}" stroke-width="4"/>`,
		gem: `<path d="M32 4 L56 22 L32 60 L8 22 Z" fill="${color}" ${stroke}/><path d="M8 22 L56 22 M32 4 L22 22 L32 60 L42 22 Z" fill="none" stroke="${accent}" stroke-width="2.5" opacity=".7"/>`,
		rock: `<path d="M10 40 L16 16 L34 8 L52 18 L56 42 L40 56 L18 54 Z" fill="${color}" ${stroke}/><path d="M20 24 L34 20 M30 40 L44 36" stroke="${accent}" stroke-width="3" opacity=".5"/>`,
		fireball: `<path d="M32 60 C12 56 8 38 20 26 C20 34 26 36 28 30 C28 18 36 10 44 4 C46 16 58 24 54 42 C52 52 44 60 32 60 Z" fill="${color}" ${stroke}/><path d="M32 56 C22 54 22 44 30 38 C32 44 40 44 38 52 C36 55 34 56 32 56 Z" fill="${accent}"/>`,
		apple: `<path d="M32 18 C14 8 4 30 14 46 C20 58 28 58 32 54 C36 58 44 58 50 46 C60 30 50 8 32 18 Z" fill="${color}" ${stroke}/><path d="M32 18 L34 6" stroke="#92400e" stroke-width="4"/><path d="M34 10 C42 4 50 8 50 8 C46 14 38 14 34 10 Z" fill="${accent}" ${stroke}/>`
	};
	return wrap(shapes[kind]);
}
