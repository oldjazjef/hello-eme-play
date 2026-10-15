import {
	isObject,
	ITEM_LOOKS,
	LOOKS,
	type EntityKind,
	type ItemLook,
	type Look
} from '@hello-eme/play-schema';
import type { CSSProperties } from 'react';
import { itemTitle, pick } from '../state.js';
import { Button } from './controls.js';
import { EntityLookPreview, ItemLookPreview } from './LookPreview.js';
import { styles } from './styles.js';
import type { EditorContext } from './types.js';
import type { RecordNode } from '@hello-eme/play-schema';

/** The lists that show their entries as cards (a picture and the main facts) instead of rows. */
export const CARD_PATHS: ReadonlySet<string> = new Set(['entities', 'items', 'sprites']);

interface CardFacts {
	title: string;
	/** The picture: the first frame of the entry's sprite, if it has one. */
	image?: CSSProperties;
	/** Otherwise the game's built-in picture of its look. */
	builtIn?: { kind: 'entity'; look: Look } | { kind: 'item'; look: ItemLook };
	facts: string[];
}

const initials = (text: string): string => text.trim().slice(0, 2).toUpperCase();

/** The first frame of a picture of the library (a sheet shows its first frame only). */
function frameStyle(sprite: Record<string, unknown>): CSSProperties | undefined {
	if (typeof sprite.url !== 'string' || sprite.url === '') return undefined;
	const columns = typeof sprite.columns === 'number' ? sprite.columns : 1;
	const rows = typeof sprite.rows === 'number' ? sprite.rows : 1;
	return {
		backgroundImage: `url("${sprite.url.replaceAll('"', '%22')}")`,
		backgroundSize: `${columns * 100}% ${rows * 100}%`,
		backgroundPosition: '0 0'
	};
}

/** The entry's own picture from the library, if it names one that has an address. */
function spriteStyle(
	entry: Record<string, unknown>,
	ctx: EditorContext
): CSSProperties | undefined {
	const sprites = isObject(ctx.root) && isObject(ctx.root.sprites) ? ctx.root.sprites : {};
	const sprite = typeof entry.sprite === 'string' ? sprites[entry.sprite] : undefined;
	return isObject(sprite) ? frameStyle(sprite) : undefined;
}

/** What the resolved configuration says about an entry (defaults filled in), for its look. */
function resolvedEntry(ctx: EditorContext, path: string, id: string): Record<string, unknown> {
	const group = isObject(ctx.root) && isObject(ctx.root[path]) ? ctx.root[path] : {};
	const entry = group[id];
	return isObject(entry) ? entry : {};
}

const KIND_LOOK: Record<EntityKind, Look> = {
	figure: 'figure',
	monster: 'enemy',
	vehicle: 'car'
};

/** Option label of a select field of the entry's node, or the plain value. */
function optionLabel(node: RecordNode['of'], key: string, value: unknown, ctx: EditorContext) {
	const field = node.type === 'object' ? node.fields[key] : undefined;
	if (field?.type !== 'select' || typeof value !== 'string') return undefined;
	const label = field.optionLabels?.[value];
	return label ? pick(label, ctx.lang) : value;
}

function factsOf(
	path: string,
	node: RecordNode,
	id: string,
	entry: unknown,
	ctx: EditorContext
): CardFacts {
	const data = isObject(entry) ? entry : {};
	const title = itemTitle(node.of, data, id, ctx.lang);
	const facts: string[] = [];
	const resolved = resolvedEntry(ctx, path, id);
	let builtIn: CardFacts['builtIn'];
	let own: CSSProperties | undefined = spriteStyle(data, ctx);
	if (path === 'entities') {
		const stats = isObject(data.stats) ? data.stats : {};
		const kind = optionLabel(node.of, 'kind', data.kind ?? 'monster', ctx);
		if (kind) facts.push(kind);
		const health = stats.hp;
		if (typeof health === 'number') facts.push(`${ctx.labels.health} ${health}`);
		const speed = stats.speed;
		if (typeof speed === 'number') facts.push(`${ctx.labels.speed} ${speed}`);
		const named =
			resolved.look ?? KIND_LOOK[(resolved.kind as keyof typeof KIND_LOOK) ?? 'monster'];
		const look = LOOKS.find((candidate) => candidate === named);
		if (look) builtIn = { kind: 'entity', look };
	} else if (path === 'items') {
		const pickup = optionLabel(node.of, 'pickup', data.pickup ?? 'touch', ctx);
		if (pickup) facts.push(pickup);
		const look = ITEM_LOOKS.find((candidate) => candidate === resolved.look);
		if (look) builtIn = { kind: 'item', look };
	} else {
		// A picture of the library: its own first frame.
		const picture = { ...resolved, ...data };
		own = frameStyle(picture);
		if (typeof picture.size === 'number') facts.push(`${picture.size} px`);
		const columns = typeof picture.columns === 'number' ? picture.columns : 1;
		const rows = typeof picture.rows === 'number' ? picture.rows : 1;
		if (columns * rows > 1) facts.push(`${columns} × ${rows}`);
	}
	return { title, facts, ...(own ? { image: own } : {}), ...(builtIn ? { builtIn } : {}) };
}

/** A grid of cards, one per entry; the chosen one is edited below. */
export function EntryCards(props: {
	path: string;
	node: RecordNode;
	entries: Record<string, unknown>;
	selected: string | undefined;
	onSelect: (id: string) => void;
	onAdd: () => void;
	canAdd: boolean;
	ctx: EditorContext;
}) {
	const { ctx } = props;
	return (
		<div style={styles.cards}>
			{Object.entries(props.entries).map(([id, entry]) => {
				const card = factsOf(props.path, props.node, id, entry, ctx);
				return (
					<button
						key={id}
						type="button"
						aria-pressed={props.selected === id}
						style={{ ...styles.card, ...(props.selected === id ? styles.cardActive : {}) }}
						onClick={() => props.onSelect(id)}
					>
						<span style={styles.thumb} aria-hidden="true">
							{!card.builtIn && initials(card.title)}
							{card.builtIn?.kind === 'entity' && <EntityLookPreview look={card.builtIn.look} />}
							{card.builtIn?.kind === 'item' && <ItemLookPreview look={card.builtIn.look} />}
							{card.image && <span style={{ ...styles.thumbImage, ...card.image }} />}
						</span>
						<strong>{card.title}</strong>
						<span style={styles.muted}>{card.facts.join(' · ')}</span>
					</button>
				);
			})}
			<Button primary disabled={!props.canAdd} onClick={props.onAdd} label={ctx.labels.add}>
				+ {ctx.labels.add}
			</Button>
		</div>
	);
}
