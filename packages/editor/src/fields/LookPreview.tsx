import {
	ITEM_LOOK_PATHS,
	LOOK_ROWS,
	SPRITE_COLORS,
	THROWABLE_LOOK_PATHS,
	type SpritePart
} from '@hello-eme/play/looks';
import type { ItemLook, Look, ThrowableLook } from '@hello-eme/play-schema';

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
					fill:
						props.look === 'heart' || props.look === 'spikes'
							? SPRITE_COLORS.itemAlt
							: props.look === 'wall'
								? SPRITE_COLORS.rock
								: props.look === 'bush'
									? SPRITE_COLORS.grass
									: props.look === 'puddle'
										? SPRITE_COLORS.water
										: SPRITE_COLORS.item
				}}
			/>
		</svg>
	);
}

/** The game's built-in shape of a bomb, rock or mine, as a small SVG. */
export function ThrowableLookPreview(props: { look: ThrowableLook }) {
	return (
		<svg viewBox="-60 -60 120 120" style={{ width: '100%', height: '100%' }} aria-hidden="true">
			<path
				d={THROWABLE_LOOK_PATHS[props.look]}
				strokeWidth={6}
				strokeLinejoin="round"
				style={{
					stroke: SPRITE_COLORS.outline,
					fill:
						props.look === 'rock'
							? SPRITE_COLORS.b
							: props.look === 'mine'
								? SPRITE_COLORS.e
								: props.look === 'ball'
									? SPRITE_COLORS.itemAlt
									: SPRITE_COLORS.shadow
				}}
			/>
		</svg>
	);
}
