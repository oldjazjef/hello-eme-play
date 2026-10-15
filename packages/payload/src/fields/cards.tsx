import { isObject } from '@hello-eme/play-schema';
import type { CSSProperties } from 'react';
import { itemTitle, pick } from '../state.js';
import { Button } from './controls.js';
import { styles } from './styles.js';
import type { EditorContext } from './types.js';
import type { RecordNode } from '@hello-eme/play-schema';

/** The lists that show their entries as cards (a picture and the main facts) instead of rows. */
export const CARD_PATHS: ReadonlySet<string> = new Set(['entities', 'items']);

interface CardFacts {
	title: string;
	/** The picture: the first frame of the entry's sprite, if it has one. */
	image?: CSSProperties;
	facts: string[];
}

const initials = (text: string): string => text.trim().slice(0, 2).toUpperCase();

function spriteStyle(
	entry: Record<string, unknown>,
	ctx: EditorContext
): CSSProperties | undefined {
	const sprites = isObject(ctx.root) && isObject(ctx.root.sprites) ? ctx.root.sprites : {};
	const sprite = typeof entry.sprite === 'string' ? sprites[entry.sprite] : undefined;
	if (!isObject(sprite) || typeof sprite.url !== 'string' || sprite.url === '') return undefined;
	const columns = typeof sprite.columns === 'number' ? sprite.columns : 1;
	const rows = typeof sprite.rows === 'number' ? sprite.rows : 1;
	return {
		backgroundImage: `url("${sprite.url.replaceAll('"', '%22')}")`,
		// A sheet shows its first frame only.
		backgroundSize: `${columns * 100}% ${rows * 100}%`,
		backgroundPosition: '0 0'
	};
}

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
	if (path === 'entities') {
		const stats = isObject(data.stats) ? data.stats : {};
		const kind = optionLabel(node.of, 'kind', data.kind ?? 'monster', ctx);
		if (kind) facts.push(kind);
		const health = stats.hp;
		if (typeof health === 'number') facts.push(`${ctx.labels.health} ${health}`);
		const speed = stats.speed;
		if (typeof speed === 'number') facts.push(`${ctx.labels.speed} ${speed}`);
	} else {
		const pickup = optionLabel(node.of, 'pickup', data.pickup ?? 'touch', ctx);
		if (pickup) facts.push(pickup);
	}
	const image = spriteStyle(data, ctx);
	return image ? { title, image, facts } : { title, facts };
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
							{initials(card.title)}
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
