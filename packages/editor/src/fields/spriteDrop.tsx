import { useId, useRef, useState, type DragEvent } from 'react';
import { fill, type Labels } from '../labels.js';
import { guessSprite, type SpriteWarning } from '../sprites.js';
import { readImage, toDataUrl } from '../upload.js';
import type { Json } from '../state.js';
import { merge } from './controls.js';
import { styles } from './styles.js';
import type { EditorContext } from './types.js';

const WARNING_LABELS: Record<SpriteWarning, keyof Labels> = {
	notImage: 'spriteWarnNotImage',
	unsupported: 'spriteWarnUnsupported',
	tiny: 'spriteWarnTiny',
	tooBig: 'spriteWarnTooBig',
	heavy: 'spriteWarnHeavy',
	noSize: 'spriteWarnNoSize'
};

/**
 * Drop pictures here to add them to the sprite library: each is stored (host upload, or embedded in
 * the JSON), measured, and gets sensible settings (a strip of square frames becomes a sheet).
 */
export function SpriteDrop(props: {
	entries: Json;
	onChange: (entries: Json) => void;
	ctx: EditorContext;
}) {
	const { ctx } = props;
	const { labels } = ctx;
	const input = useRef<HTMLInputElement>(null);
	const id = useId();
	const [over, setOver] = useState(false);
	const [busy, setBusy] = useState(false);
	const [notes, setNotes] = useState<string[]>([]);

	const add = async (files: readonly File[]) => {
		if (files.length === 0) return;
		setBusy(true);
		const messages: string[] = [];
		let entries = props.entries;
		let added = 0;
		for (const file of files) {
			try {
				const info = await readImage(file);
				const url = await (ctx.onUpload ?? toDataUrl)(file);
				const guess = guessSprite(file.name, info, url, entries);
				entries = { ...entries, [guess.id]: guess.sprite };
				added += 1;
				for (const warning of guess.warnings) {
					messages.push(fill(labels[WARNING_LABELS[warning]], { name: file.name }));
				}
			} catch {
				messages.push(fill(labels.spriteFailed, { name: file.name }));
			}
		}
		if (added > 0) props.onChange(entries);
		if (!ctx.onUpload && added > 0) messages.push(labels.spriteEmbedded);
		setNotes([...(added > 0 ? [fill(labels.spriteAdded, { n: added })] : []), ...messages]);
		setBusy(false);
	};

	const onDrop = (event: DragEvent) => {
		event.preventDefault();
		setOver(false);
		void add([...event.dataTransfer.files]);
	};

	return (
		<div
			style={merge(styles.dropzone, over ? styles.dropActive : {})}
			onDragOver={(event) => {
				event.preventDefault();
				setOver(true);
			}}
			onDragLeave={() => setOver(false)}
			onDrop={onDrop}
		>
			<input
				ref={input}
				id={id}
				type="file"
				accept="image/*"
				multiple
				hidden
				onChange={(event) => {
					void add([...(event.target.files ?? [])]);
					event.target.value = '';
				}}
			/>
			<span aria-live="polite">
				{busy ? (
					labels.spriteBusy
				) : (
					<>
						{labels.spriteDrop}{' '}
						<button type="button" style={styles.button} onClick={() => input.current?.click()}>
							{labels.spriteChoose}
						</button>
					</>
				)}
			</span>
			{notes.length > 0 && (
				<ul role="status" style={merge(styles.list, styles.muted, { textAlign: 'left' })}>
					{notes.map((note) => (
						<li key={note}>{note}</li>
					))}
				</ul>
			)}
		</div>
	);
}
