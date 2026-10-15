import type { SelectNode } from '@hello-eme/play-schema';
import { useId } from 'react';
import { pick } from '../state.js';
import { helpId, merge, Row } from './controls.js';
import { styles } from './styles.js';
import type { FieldProps } from './types.js';

export function SelectField({
	node,
	value,
	onChange,
	ctx,
	path,
	resettable = true
}: FieldProps<SelectNode>) {
	const id = useId();
	const shown = typeof value === 'string' ? value : node.default;
	const options = node.options.includes(shown) ? node.options : [...node.options, shown];
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
				{options.map((option) => {
					const label = node.optionLabels?.[option];
					return (
						<option key={option} value={option}>
							{label ? pick(label, ctx.lang) : option}
						</option>
					);
				})}
			</select>
		</Row>
	);
}
