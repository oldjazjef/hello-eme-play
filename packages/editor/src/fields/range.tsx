import { isObject, type RangeNode } from '@hello-eme/play-schema';
import { useId } from 'react';
import { pick } from '../state.js';
import { helpId, NumberInput, Row } from './controls.js';
import { styles } from './styles.js';
import type { FieldProps } from './types.js';

export function RangeField({
	node,
	value,
	onChange,
	ctx,
	resettable = true
}: FieldProps<RangeNode>) {
	const id = useId();
	const source = isObject(value) ? value : {};
	const current = {
		min: typeof source.min === 'number' ? source.min : node.default.min,
		max: typeof source.max === 'number' ? source.max : node.default.max
	};
	const label = pick(node.label, ctx.lang);
	return (
		<Row
			id={id}
			node={node}
			ctx={ctx}
			modified={value !== undefined}
			{...(resettable ? { onReset: () => onChange(undefined) } : {})}
		>
			<span style={styles.muted}>{ctx.labels.from}</span>
			<NumberInput
				id={id}
				label={`${label} ${ctx.labels.from}`}
				value={current.min}
				min={node.min}
				max={node.max}
				step={node.int ? 1 : undefined}
				describedBy={helpId(id, node)}
				onChange={(min) => onChange({ ...current, min })}
			/>
			<span style={styles.muted}>{ctx.labels.to}</span>
			<NumberInput
				label={`${label} ${ctx.labels.to}`}
				value={current.max}
				min={node.min}
				max={node.max}
				step={node.int ? 1 : undefined}
				onChange={(max) => onChange({ ...current, max })}
			/>
			{node.unit && <span style={styles.muted}>{node.unit}</span>}
		</Row>
	);
}
