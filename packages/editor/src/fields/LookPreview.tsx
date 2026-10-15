import { ITEM_LOOK_PATHS, LOOK_ROWS, SPRITE_COLORS, type SpritePart } from '@hello-eme/play/looks';
import type { ItemLook, Look } from '@hello-eme/play-schema';

const PIXEL = 10;

/** The game's built-in picture of a figure, monster or vehicle, as a small SVG. */
export function EntityLookPreview(props: { look: Look }) {
	const rows = LOOK_ROWS[props.look];
	const cells = rows.flatMap((row, y) =>
		[...row].flatMap((char, x) =>
			char in SPRITE_COLORS && char !== '.' ? [{ x, y, part: char as SpritePart }] : []
		)
	);
	const width = (rows[0]?.length ?? 0) * PIXEL;
	const height = rows.length * PIXEL;
	return (
		<svg
			viewBox={`${-PIXEL} ${-PIXEL} ${width + 2 * PIXEL} ${height + 2 * PIXEL}`}
			style={{ width: '100%', height: '100%' }}
			aria-hidden="true"
		>
			{/* The outline the game draws around every sprite: one pixel bigger on each side. */}
			<g style={{ fill: SPRITE_COLORS.outline }}>
				{cells.map(({ x, y }) => (
					<rect
						key={`o${x}-${y}`}
						x={(x - 1) * PIXEL}
						y={(y - 1) * PIXEL}
						width={PIXEL * 3}
						height={PIXEL * 3}
					/>
				))}
			</g>
			{cells.map(({ x, y, part }) => (
				<rect
					key={`${x}-${y}`}
					x={x * PIXEL}
					y={y * PIXEL}
					width={PIXEL}
					height={PIXEL}
					style={{ fill: SPRITE_COLORS[part] }}
				/>
			))}
		</svg>
	);
}

/** The game's built-in shape of an item, as a small SVG. */
export function ItemLookPreview(props: { look: ItemLook }) {
	return (
		<svg viewBox="-60 -60 120 120" style={{ width: '100%', height: '100%' }} aria-hidden="true">
			<path
				d={ITEM_LOOK_PATHS[props.look]}
				strokeWidth={6}
				strokeLinejoin="round"
				style={{
					stroke: SPRITE_COLORS.outline,
					fill: props.look === 'heart' ? SPRITE_COLORS.itemAlt : SPRITE_COLORS.item
				}}
			/>
		</svg>
	);
}
