import type { BooleanNode } from '@hello-eme/play-schema';
import { useId } from 'react';
import { helpId, Row } from './controls.js';
import type { FieldProps } from './types.js';

export function BooleanField({
	node,
	value,
	onChange,
	ctx,
	path,
	resettable = true
}: FieldProps<BooleanNode>) {
	const id = useId();
	return (
		<Row
			id={id}
			node={node}
			ctx={ctx}
			path={path}
			modified={value !== undefined}
			{...(resettable ? { onReset: () => onChange(undefined) } : {})}
		>
			<input
				id={id}
				type="checkbox"
				aria-describedby={helpId(id, node)}
				checked={typeof value === 'boolean' ? value : node.default}
				onChange={(event) => onChange(event.target.checked)}
			/>
		</Row>
	);
}
