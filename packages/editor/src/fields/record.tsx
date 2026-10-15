import { defaultOf, isObject, type RecordNode } from '@hello-eme/play-schema';
import { useEffect, useState } from 'react';
import {
	duplicateKey,
	itemTitle,
	newItem,
	pick,
	removeKey,
	renameKey,
	setKey,
	uniqueKey
} from '../state.js';
import { CARD_PATHS, EntryCards } from './cards.js';
import { Button, merge, Section } from './controls.js';
import { SpriteDrop } from './spriteDrop.js';
import { styles } from './styles.js';
import type { EditorContext, FieldProps } from './types.js';

/** The id of an entry: renamed when you leave the field or press Enter. */
function IdInput(props: {
	value: string;
	label: string;
	ctx: EditorContext;
	onRename: (id: string) => void;
}) {
	const [draft, setDraft] = useState<string | undefined>();
	const commit = () => {
		if (draft !== undefined) props.onRename(draft);
		setDraft(undefined);
	};
	return (
		<label style={merge(styles.toolbar, { flex: '1 1 14rem', minWidth: 0 })}>
			<span style={styles.label}>{props.label}</span>
			<input
				type="text"
				style={merge(styles.input, { flex: '1 1 8rem', minWidth: 0 })}
				value={draft ?? props.value}
				onChange={(event) => setDraft(event.target.value)}
				onBlur={commit}
				onKeyDown={(event) => {
					if (event.key === 'Enter') {
						event.preventDefault();
						commit();
					}
				}}
			/>
		</label>
	);
}

export function RecordField({
	node,
	value,
	onChange,
	ctx,
	path,
	Child,
	depth = 0,
	resettable = true
}: FieldProps<RecordNode>) {
	const entries = isObject(value) ? value : (defaultOf(node) as Record<string, unknown>);
	const idLabel = pick(node.idLabel ?? node.label, ctx.lang);
	const ids = Object.keys(entries);
	const cards = CARD_PATHS.has(path);
	const [chosen, setChosen] = useState<string | undefined>();
	const current = chosen !== undefined && ids.includes(chosen) ? chosen : ids[0];
	// "Go to field" in the problem list: show the entry the field belongs to.
	const focusPath = ctx.focus?.path;
	useEffect(() => {
		if (!cards || focusPath === undefined) return;
		const target = ids.find(
			(id) => focusPath === `${path}.${id}` || focusPath.startsWith(`${path}.${id}.`)
		);
		if (target !== undefined) setChosen(target);
		// Only a new request counts, not every render.
	}, [ctx.focus?.nonce]);
	const addEntry = () => {
		const id = uniqueKey(entries, 'new');
		onChange({ ...entries, [id]: newItem(node.of) });
		setChosen(id);
	};
	return (
		<Section
			node={node}
			ctx={ctx}
			path={path}
			badge={String(ids.length)}
			onReset={resettable && value !== undefined ? () => onChange(undefined) : undefined}
		>
			{path === 'sprites' && <SpriteDrop entries={entries} ctx={ctx} onChange={onChange} />}
			{cards && (
				<EntryCards
					path={path}
					node={node}
					entries={entries}
					selected={current}
					onSelect={setChosen}
					onAdd={addEntry}
					canAdd={ids.length < node.maxItems}
					ctx={ctx}
				/>
			)}
			{(cards ? ids.filter((id) => id === current) : ids).map((id) => {
				const entry = entries[id];
				const title = itemTitle(node.of, entry, id, ctx.lang);
				return (
					<Section
						key={id}
						node={node.of}
						ctx={ctx}
						path={`${path}.${id}`}
						title={title}
						badge={title === id ? undefined : id}
						open={cards ? true : undefined}
					>
						<div style={styles.toolbar}>
							<IdInput
								value={id}
								label={`${idLabel} ${ctx.labels.id}`}
								ctx={ctx}
								onRename={(next) => {
									onChange(renameKey(entries, id, next));
									if (id === current) setChosen(next.trim());
								}}
							/>
							<Button
								onClick={() => onChange(duplicateKey(entries, id))}
								disabled={ids.length >= node.maxItems}
								label={`${ctx.labels.duplicate}: ${title}`}
							>
								{ctx.labels.duplicate}
							</Button>
							<Button
								onClick={() => onChange(removeKey(entries, id))}
								label={`${ctx.labels.remove}: ${title}`}
							>
								{ctx.labels.remove}
							</Button>
						</div>
						<Child
							node={node.of}
							value={entry}
							path={`${path}.${id}`}
							ctx={ctx}
							depth={depth + 1}
							resettable={false}
							onChange={(next) => onChange(setKey(entries, id, next ?? newItem(node.of)))}
						/>
					</Section>
				);
			})}
			{!cards && (
				<div style={styles.toolbar}>
					<Button
						primary
						disabled={ids.length >= node.maxItems}
						onClick={addEntry}
						label={`${ctx.labels.add}: ${idLabel}`}
					>
						{ctx.labels.add}
					</Button>
				</div>
			)}
		</Section>
	);
}
