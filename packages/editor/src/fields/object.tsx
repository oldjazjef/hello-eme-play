import { isObject, type ObjectNode } from '@hello-eme/play-schema';
import { isEmptyObject, setKey } from '../state.js';
import { Section } from './controls.js';
import { styles } from './styles.js';
import type { FieldProps } from './types.js';

export function ObjectField({
	node,
	value,
	onChange,
	ctx,
	path,
	Child,
	depth = 0,
	resettable = true
}: FieldProps<ObjectNode>) {
	const source = isObject(value) ? value : {};
	const fields = Object.entries(node.fields).map(([key, field]) => (
		<Child
			key={key}
			node={field}
			value={source[key]}
			path={path ? `${path}.${key}` : key}
			ctx={ctx}
			depth={depth + 1}
			onChange={(next) => {
				// An object left with nothing written inside is removed again.
				const empty = field.type === 'object' && isEmptyObject(next);
				onChange(setKey(source, key, empty ? undefined : next));
			}}
		/>
	));
	if (depth === 0) return <div style={styles.stack}>{fields}</div>;
	return (
		<Section
			node={node}
			ctx={ctx}
			path={path}
			onReset={resettable && value !== undefined ? () => onChange(undefined) : undefined}
		>
			{fields}
		</Section>
	);
}
