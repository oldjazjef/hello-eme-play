/**
 * Drawing: pixel art figures, monsters and vehicles (or the configured pictures), items, shards and
 * tire marks. Everything is drawn on one canvas that covers the window; world positions are page
 * coordinates, so the scroll position is subtracted.
 */
import { jumpHeight, walkFrame, type Body, type Pickup } from '@hello-eme/play-core';
import type {
	EntityDefinition,
	Facing,
	ItemDefinition,
	Look,
	PlayConfig
} from '@hello-eme/play-schema';
import { opacity as skidOpacity, SKID, type SkidMark } from './skid.js';
import type { Shard } from './wreck.js';

/**
 * The figure, seen from above and facing down: hair, a peek of the face, shoulders, arms, feet.
 * One character per pixel; `.` is transparent. Other directions are drawn rotated. In the side view
 * the same picture is the figure seen from the front.
 */
const STANDING = [
	'...hhhh...',
	'..hhhhhh..',
	'.bhhhhhhb.',
	'sbhhhhhhbs',
	'sbbhsshbbs',
	'.bbbbbbbb.',
	'..bb..bb..',
	'..ff..ff..',
	'..........',
	'..........'
];

/** One foot forward, the opposite arm swinging forward. */
const STEP = [
	'...hhhh...',
	'..hhhhhh..',
	'sbhhhhhhb.',
	'.bhhhhhhb.',
	'.bbhsshbbs',
	'.bbbbbbbbs',
	'..bb..bb..',
	'..bb..ff..',
	'..ff......',
	'..........'
];

/** Punching: the right arm stretched forward, fist first. */
const PUNCHING = [
	'...hhhh...',
	'..hhhhhh..',
	'.bhhhhhhb.',
	'sbhhhhhhb.',
	'sbbhsshbb.',
	'.bbbbbbbbb',
	'..bb..bbb.',
	'..ff..ffb.',
	'........b.',
	'.......ss.'
];

/** Kicking: one leg stretched forward, the arms out for balance. */
const KICKING = [
	'...hhhh...',
	'..hhhhhh..',
	'sbhhhhhhbs',
	'.bhhhhhhb.',
	'.bbhsshbb.',
	'.bbbbbbbb.',
	'..bb..bb..',
	'..ff..bb..',
	'......bb..',
	'......ff..'
];

const mirror = (rows: readonly string[]) => rows.map((row) => [...row].reverse().join(''));

const WALKING = [STEP, mirror(STEP)] as const;

/** A monster from above, facing down: a horned blob with big eyes. */
const ENEMY_STANDING = [
	'.e......e.',
	'.ee....ee.',
	'..eeeeee..',
	'.eeeeeeee.',
	'eexxeexxee',
	'eexweewxee',
	'.eeeeeeee.',
	'..ee..ee..',
	'..ff..ff..',
	'..........'
];

const ENEMY_STEP = [...ENEMY_STANDING.slice(0, 7), '..ee..ee..', '..ee..ff..', '..ff......'];

const ENEMY_WALKING = [ENEMY_STEP, mirror(ENEMY_STEP)] as const;

/** The car from above, front to the right: body, rear window, windscreen, wheels, headlights. */
const CAR_ROWS = [
	'..ff.......ff...',
	'.cccccccccccccc.',
	'ccccwwwccwwwwccl',
	'ccccwwwccwwwwccc',
	'ccccwwwccwwwwccc',
	'ccccwwwccwwwwccc',
	'ccccwwwccwwwwccl',
	'.cccccccccccccc.',
	'..ff.......ff...'
];

/** Hair, skin, body, feet; car, window, lights; enemy, enemy eyes. */
export type SpritePart = 'h' | 's' | 'b' | 'f' | 'c' | 'w' | 'l' | 'e' | 'x';

/**
 * The color of every part: a CSS custom property the website can set (e.g. to its own design
 * tokens, which then follow its theme and light/dark mode) and a fallback. `outline` separates
 * the sprites from whatever they walk over.
 */
export const SPRITE_COLORS: Record<SpritePart | 'shadow' | 'outline' | 'item' | 'itemAlt', string> =
	{
		h: 'var(--play-hair, #1e1b4b)',
		s: 'var(--play-skin, #f6b98f)',
		b: 'var(--play-body, #6d28d9)',
		f: 'var(--play-feet, #1e1b4b)',
		c: 'var(--play-car, #5eead4)',
		w: 'var(--play-window, #1e1b4b)',
		l: 'var(--play-light, #fcd34d)',
		e: 'var(--play-enemy, #dc2626)',
		x: 'var(--play-enemy-eyes, #ffffff)',
		shadow: 'var(--play-shadow, #1e1b4b)',
		outline: 'var(--play-outline, #ffffff)',
		item: 'var(--play-item, #f59e0b)',
		itemAlt: 'var(--play-item-alt, #dc2626)'
	};

export type SpriteColors = Record<keyof typeof SPRITE_COLORS, string>;

const isPart = (char: string): char is SpritePart =>
	['h', 's', 'b', 'f', 'c', 'w', 'l', 'e', 'x'].includes(char);

/** Size of one sprite pixel in CSS pixels. */
export const PIXEL = 5;
/** The `size` the built-in sprites are drawn at (scale 1). */
const BASE_SIZE: Record<Look, number> = { figure: 50, enemy: 50, car: 90 };
/** How much bigger the figure gets at the top of a jump (it comes closer to the viewer). */
const JUMP_SCALE = 0.4;

/** A picture from the configuration, loading or loaded. */
export interface Picture {
	image: HTMLImageElement;
	size: number;
	facing: Facing;
}

export type Pictures = Record<string, Picture>;

/** Starts loading the configured pictures (the pixel art is drawn until one is ready). */
export function loadPictures(sprites: PlayConfig['sprites']): Pictures {
	return Object.fromEntries(
		Object.entries(sprites)
			.filter(([, { url }]) => url.trim() !== '')
			.map(([id, { url, size, facing }]) => {
				const image = new Image();
				image.decoding = 'async';
				image.src = url;
				return [id, { image, size, facing }];
			})
	);
}

const FACING_ANGLE: Record<Facing, number> = {
	right: 0,
	down: Math.PI / 2,
	left: Math.PI,
	up: -Math.PI / 2
};

export interface Scene {
	colors: SpriteColors;
	pictures: Pictures;
	reducedMotion: boolean;
	scroll: { x: number; y: number };
	side: boolean;
}

/** Draws a picture centered, turned from where it looks (`facing`) to `rotation` (0 = right). */
function drawPicture(
	ctx: CanvasRenderingContext2D,
	{ image, size, facing }: Picture,
	x: number,
	y: number,
	rotation: number,
	scale: number,
	flip = false
): boolean {
	if (!image.complete || image.naturalWidth === 0) return false;
	const longer = Math.max(image.naturalWidth, image.naturalHeight);
	const width = (image.naturalWidth / longer) * size;
	const height = (image.naturalHeight / longer) * size;
	ctx.save();
	ctx.translate(x, y);
	ctx.rotate(rotation - FACING_ANGLE[facing]);
	ctx.scale(flip ? -scale : scale, scale);
	ctx.drawImage(image, -width / 2, -height / 2, width, height);
	ctx.restore();
	return true;
}

/** Pixel art, centered and rotated, with an outline so it stands out from any background. */
function drawPixels(
	ctx: CanvasRenderingContext2D,
	rows: readonly string[],
	x: number,
	y: number,
	rotation: number,
	scale: number,
	colors: SpriteColors,
	flip = false
): void {
	const width = (rows[0]?.length ?? 0) * PIXEL;
	const height = rows.length * PIXEL;
	const pixels = rows.flatMap((row, py) =>
		[...row].flatMap((char, px) => (isPart(char) ? [{ px, py, part: char }] : []))
	);
	ctx.save();
	ctx.translate(x, y);
	ctx.rotate(rotation);
	ctx.scale(flip ? -scale : scale, scale);
	ctx.translate(-width / 2, -height / 2);
	// Outline first: every pixel, one sprite pixel bigger on each side.
	ctx.fillStyle = colors.outline;
	for (const { px, py } of pixels)
		ctx.fillRect((px - 1) * PIXEL, (py - 1) * PIXEL, PIXEL * 3, PIXEL * 3);
	for (const { px, py, part } of pixels) {
		ctx.fillStyle = colors[part];
		ctx.fillRect(px * PIXEL, py * PIXEL, PIXEL, PIXEL);
	}
	ctx.restore();
}

function shadow(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	half: number,
	colors: SpriteColors,
	lift: number
): void {
	ctx.save();
	ctx.globalAlpha = 0.25;
	ctx.fillStyle = colors.shadow;
	ctx.beginPath();
	ctx.ellipse(x, y, half * (1 - lift * 0.3), half * 0.6, 0, 0, Math.PI * 2);
	ctx.fill();
	ctx.restore();
}

function humanoidRows(body: Body, look: Look): readonly string[] {
	if (look === 'enemy') {
		return body.distance > 0 && body.moving
			? (ENEMY_WALKING[walkFrame(body)] ?? ENEMY_STANDING)
			: ENEMY_STANDING;
	}
	if (body.pose?.pose === 'kick') return KICKING;
	if (body.pose?.pose === 'punch' || body.pose?.pose === 'bite') return PUNCHING;
	return body.moving ? (WALKING[walkFrame(body)] ?? STANDING) : STANDING;
}

/** Draws a figure, monster or vehicle, in the current view. */
export function drawBody(
	ctx: CanvasRenderingContext2D,
	body: Body,
	definition: EntityDefinition,
	scene: Scene
): void {
	const { colors, scroll } = scene;
	const x = body.x - scroll.x;
	const y = body.y - scroll.y;
	const scale = definition.size / BASE_SIZE[definition.look];
	const picture = definition.sprite ? scene.pictures[definition.sprite] : undefined;
	const height = scene.reducedMotion ? 0 : jumpHeight(body);
	const blink = body.invulnerable > 0 && Math.floor(body.invulnerable * 10) % 2 === 0;
	ctx.globalAlpha = body.hurt > 0 || blink ? 0.45 : 1;

	if (scene.side) {
		drawSide(ctx, body, definition, scene, x, y, scale, picture);
		ctx.globalAlpha = 1;
		return;
	}
	if (definition.look === 'car') {
		if (!(picture && drawPicture(ctx, picture, x, y, body.angle, scale))) {
			drawPixels(ctx, CAR_ROWS, x, y, body.angle, scale, colors);
		}
		ctx.globalAlpha = 1;
		return;
	}
	const half = (10 * PIXEL * scale) / 2;
	shadow(ctx, x, y + PIXEL, half, colors, height);
	const grow = scale * (1 + height * JUMP_SCALE);
	if (!(picture && drawPicture(ctx, picture, x, y, body.angle, grow))) {
		// The sprite faces down (π/2); turn it to where the body goes.
		drawPixels(
			ctx,
			humanoidRows(body, definition.look),
			x,
			y,
			body.angle - Math.PI / 2,
			grow,
			colors
		);
	}
	ctx.globalAlpha = 1;
}

function drawSide(
	ctx: CanvasRenderingContext2D,
	body: Body,
	definition: EntityDefinition,
	scene: Scene,
	x: number,
	feet: number,
	scale: number,
	picture: Picture | undefined
): void {
	const { colors } = scene;
	const left = Math.cos(body.angle) < 0;
	if (definition.look === 'car') {
		const width = 16 * PIXEL * scale;
		const height = 5 * PIXEL * scale;
		shadow(ctx, x, feet, width / 2, colors, 0);
		if (
			picture &&
			drawPicture(ctx, picture, x, feet - height, 0, 1, left !== (picture.facing === 'left'))
		)
			return;
		ctx.save();
		ctx.translate(x, feet);
		if (left) ctx.scale(-1, 1);
		ctx.fillStyle = colors.outline;
		ctx.fillRect(-width / 2 - 2, -height - 2, width + 4, height * 0.75 + 4);
		ctx.fillStyle = colors.c;
		ctx.fillRect(-width / 2, -height, width, height * 0.75);
		ctx.fillRect(-width * 0.25, -height * 1.45, width * 0.5, height * 0.5);
		ctx.fillStyle = colors.w;
		ctx.fillRect(-width * 0.2, -height * 1.38, width * 0.4, height * 0.38);
		ctx.fillStyle = colors.l;
		ctx.fillRect(width / 2 - 4, -height * 0.9, 6, height * 0.2);
		ctx.fillStyle = colors.f;
		for (const wheel of [-0.3, 0.3]) {
			ctx.beginPath();
			ctx.arc(width * wheel, -height * 0.1, height * 0.3, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.restore();
		return;
	}
	const rows = humanoidRows(body, definition.look);
	const full = rows.length * PIXEL * scale;
	shadow(ctx, x, feet, (10 * PIXEL * scale) / 2, colors, body.grounded ? 0 : 1);
	const centerY = feet - full / 2 + PIXEL * scale * 2;
	if (
		picture &&
		drawPicture(
			ctx,
			picture,
			x,
			feet - picture.size / 2,
			0,
			1,
			left !== (picture.facing === 'left')
		)
	)
		return;
	drawPixels(ctx, rows, x, centerY, 0, scale, colors, left);
}

/** A small bar above a monster that has lost health (always for bosses). */
export function drawHealth(
	ctx: CanvasRenderingContext2D,
	body: Body,
	max: number,
	scene: Scene,
	size: number
): void {
	if (body.hp >= max) return;
	const width = Math.max(30, size * 0.8);
	const x = body.x - scene.scroll.x - width / 2;
	const y = body.y - scene.scroll.y - (scene.side ? size + 8 : size * 0.7);
	ctx.fillStyle = scene.colors.shadow;
	ctx.globalAlpha = 0.5;
	ctx.fillRect(x, y, width, 5);
	ctx.globalAlpha = 1;
	ctx.fillStyle = scene.colors.e;
	ctx.fillRect(x, y, width * Math.max(0, body.hp / max), 5);
}

/** Draws an item: its picture, or a small shape for its look; it bobs and blinks before it vanishes. */
export function drawPickup(
	ctx: CanvasRenderingContext2D,
	pickup: Pickup,
	definition: ItemDefinition,
	scene: Scene
): void {
	if (pickup.ttl < 3 && Math.floor(pickup.ttl * 6) % 2 === 0) return;
	const bob = scene.reducedMotion ? 0 : Math.sin(pickup.age * 4) * 3;
	const x = pickup.x - scene.scroll.x;
	const y = pickup.y - scene.scroll.y - (scene.side ? definition.size / 2 : 0) + bob;
	const picture = definition.sprite ? scene.pictures[definition.sprite] : undefined;
	if (picture && drawPicture(ctx, picture, x, y, 0, 1, false)) return;
	const r = definition.size / 2;
	const { colors } = scene;
	ctx.save();
	ctx.translate(x, y);
	ctx.lineWidth = 3;
	ctx.strokeStyle = colors.outline;
	ctx.fillStyle = definition.look === 'heart' ? colors.itemAlt : colors.item;
	ctx.beginPath();
	switch (definition.look) {
		case 'heart':
			ctx.moveTo(0, r * 0.8);
			ctx.bezierCurveTo(-r * 1.4, -r * 0.1, -r * 0.6, -r * 1.1, 0, -r * 0.4);
			ctx.bezierCurveTo(r * 0.6, -r * 1.1, r * 1.4, -r * 0.1, 0, r * 0.8);
			break;
		case 'star':
			for (let i = 0; i < 10; i++) {
				const radius = i % 2 === 0 ? r : r * 0.45;
				const angle = (Math.PI / 5) * i - Math.PI / 2;
				ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
			}
			break;
		case 'gem':
			ctx.moveTo(0, -r);
			ctx.lineTo(r * 0.8, -r * 0.2);
			ctx.lineTo(0, r);
			ctx.lineTo(-r * 0.8, -r * 0.2);
			break;
		case 'bolt':
			ctx.moveTo(r * 0.2, -r);
			ctx.lineTo(-r * 0.6, r * 0.1);
			ctx.lineTo(-r * 0.05, r * 0.1);
			ctx.lineTo(-r * 0.2, r);
			ctx.lineTo(r * 0.6, -r * 0.2);
			ctx.lineTo(r * 0.05, -r * 0.2);
			break;
	}
	ctx.closePath();
	ctx.stroke();
	ctx.fill();
	ctx.restore();
}

/** Colors of the shards a broken element bursts into (indexes are `Shard.color`). */
export const shardColors = (colors: SpriteColors): readonly string[] => [
	colors.b,
	colors.c,
	colors.l,
	colors.h
];

/** Colors of the shards a beaten monster bursts into. */
export const monsterShardColors = (colors: SpriteColors): readonly string[] => [
	colors.e,
	colors.e,
	colors.x
];

/** Draws shards (page coordinates) as sprite pixels, in `palette` (by `Shard.color`). */
export function drawShards(
	ctx: CanvasRenderingContext2D,
	shards: readonly Shard[],
	scene: Scene,
	palette: readonly string[]
): void {
	for (const shard of shards) {
		ctx.globalAlpha = Math.min(1, shard.life * 2);
		ctx.fillStyle = palette[shard.color] ?? scene.colors.h;
		ctx.fillRect(
			shard.x - scene.scroll.x - PIXEL / 2,
			shard.y - scene.scroll.y - PIXEL / 2,
			PIXEL,
			PIXEL
		);
	}
	ctx.globalAlpha = 1;
}

/** Draws tire marks (page coordinates), fading with age. */
export function drawSkidMarks(
	ctx: CanvasRenderingContext2D,
	marks: readonly SkidMark[],
	scene: Scene,
	now: number
): void {
	ctx.save();
	ctx.strokeStyle = scene.colors.shadow;
	ctx.lineWidth = SKID.width;
	ctx.lineCap = 'round';
	for (const mark of marks) {
		ctx.globalAlpha = skidOpacity(mark, now);
		ctx.beginPath();
		ctx.moveTo(mark.x1 - scene.scroll.x, mark.y1 - scene.scroll.y);
		ctx.lineTo(mark.x2 - scene.scroll.x, mark.y2 - scene.scroll.y);
		ctx.stroke();
	}
	ctx.restore();
}

/**
 * Resolves the sprite colors to values a canvas understands (canvas can't read CSS variables or
 * `light-dark()`). `probe` is any element inside the themed document.
 */
export function resolveColors(probe: HTMLElement): SpriteColors {
	const read = (color: string) => {
		probe.style.color = color;
		return getComputedStyle(probe).color;
	};
	return Object.fromEntries(
		Object.entries(SPRITE_COLORS).map(([part, color]) => [part, read(color)])
	) as SpriteColors;
}
