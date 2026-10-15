import type { NumberNode } from '@hello-eme/play-schema';
import { useId } from 'react';
import { helpId, NumberInput, Row } from './controls.js';
import { styles } from './styles.js';
import type { FieldProps } from './types.js';

export function NumberField({
	node,
	value,
	onChange,
	ctx,
	resettable = true
}: FieldProps<NumberNode>) {
	const id = useId();
	const shown = typeof value === 'number' ? value : node.default;
	return (
		<Row
			id={id}
			node={node}
			ctx={ctx}
			modified={value !== undefined}
			{...(resettable ? { onReset: () => onChange(undefined) } : {})}
		>
			<NumberInput
				id={id}
				value={shown}
				min={node.min}
				max={node.max}
				step={node.int ? 1 : undefined}
				describedBy={helpId(id, node)}
				onChange={onChange}
			/>
			{node.unit && <span style={styles.muted}>{node.unit}</span>}
		</Row>
	);
}
