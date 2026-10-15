import type { StringNode } from '@hello-eme/play-schema';
import { useId } from 'react';
import { helpId, merge, Row } from './controls.js';
import { styles } from './styles.js';
import type { FieldProps } from './types.js';

/** Settings that hold the address of an uploaded image get the media library next to them. */
export const isMediaPath = (path: string): boolean => /(^|\.)sprites\.[^.]+\.url$/.test(path);

export function StringField({
	node,
	value,
	onChange,
	ctx,
	path,
	resettable = true
}: FieldProps<StringNode>) {
	const id = useId();
	const shown = typeof value === 'string' ? value : node.default;
	const common = {
		id,
		style: merge(styles.input, styles.wide),
		'aria-describedby': helpId(id, node),
		value: shown
	};
	const media = isMediaPath(path) ? ctx.media : undefined;
	return (
		<Row
			id={id}
			node={node}
			ctx={ctx}
			path={path}
			modified={value !== undefined}
			{...(resettable ? { onReset: () => onChange(undefined) } : {})}
		>
			{node.multiline ? (
				<textarea {...common} rows={4} onChange={(event) => onChange(event.target.value)} />
			) : (
				<input {...common} type="text" onChange={(event) => onChange(event.target.value)} />
			)}
			{media && (
				<>
					<select
						aria-label={ctx.labels.media}
						style={styles.input}
						value=""
						onChange={(event) => {
							if (event.target.value) onChange(event.target.value);
						}}
					>
						<option value="">{ctx.labels.media}</option>
						{media.map((option) => (
							<option key={option.url} value={option.url}>
								{option.label}
							</option>
						))}
					</select>
					{ctx.mediaUploadHref && (
						<a href={ctx.mediaUploadHref} target="_blank" rel="noreferrer">
							{ctx.labels.mediaUpload}
						</a>
					)}
				</>
			)}
		</Row>
	);
}
