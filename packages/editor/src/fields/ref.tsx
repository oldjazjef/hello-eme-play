import type { RefNode } from '@hello-eme/play-schema';
import { useId } from 'react';
import { refOptions } from '../state.js';
import { helpId, merge, Row } from './controls.js';
import { styles } from './styles.js';
import type { FieldProps } from './types.js';

export function RefField({
	node,
	value,
	onChange,
	ctx,
	path,
	resettable = true
}: FieldProps<RefNode>) {
	const id = useId();
	const shown = typeof value === 'string' ? value : node.default;
	const options = refOptions(ctx.root, node.to);
	const known = shown === '' || options.some((option) => option.id === shown);
	return (
		<Row
			id={id}
			node={node}
			ctx={ctx}
			path={path}
			modified={value !== undefined}
			{...(resettable ? { onReset: () => onChange(undefined) } : {})}
		>
			<select
				id={id}
				style={merge(styles.input, styles.wide)}
				aria-describedby={helpId(id, node)}
				value={shown}
				onChange={(event) => onChange(event.target.value)}
			>
				{(node.optional || shown === '') && (
					<option value="">{node.optional ? ctx.labels.none : ctx.labels.choose}</option>
				)}
				{options.map((option) => (
					<option key={option.id} value={option.id}>
						{option.label && option.label !== option.id
							? `${option.label} (${option.id})`
							: option.id}
					</option>
				))}
				{!known && (
					<option value={shown}>
						{shown} ({ctx.labels.missing})
					</option>
				)}
			</select>
		</Row>
	);
}
