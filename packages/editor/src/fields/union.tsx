import { isObject, type UnionNode } from '@hello-eme/play-schema';
import { useId } from 'react';
import { pick, setKey, unionDefaults } from '../state.js';
import { merge, Row } from './controls.js';
import { styles } from './styles.js';
import type { FieldProps } from './types.js';

/** A select of the variant, and below it that variant's fields. */
export function UnionField({
	node,
	value,
	onChange,
	ctx,
	path,
	Child,
	depth = 0,
	resettable = true
}: FieldProps<UnionNode>) {
	const id = useId();
	const source = isObject(value) ? value : {};
	const chosen = String(source[node.by]);
	const variant = node.variants[chosen];
	return (
		<div style={styles.stack}>
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
					value={variant ? chosen : ''}
					onChange={(event) => {
						if (event.target.value) onChange(unionDefaults(node, event.target.value));
					}}
				>
					{!variant && <option value="">{ctx.labels.choose}</option>}
					{Object.entries(node.variants).map(([name, option]) => (
						<option key={name} value={name}>
							{pick(option.label, ctx.lang)}
						</option>
					))}
				</select>
			</Row>
			{variant?.help && (
				<p style={merge(styles.help, { gridColumn: 'auto' })}>{pick(variant.help, ctx.lang)}</p>
			)}
			{variant &&
				Object.entries(variant.fields).map(([key, field]) => (
					<Child
						key={`${chosen}.${key}`}
						node={field}
						value={source[key]}
						path={`${path}.${key}`}
						ctx={ctx}
						depth={depth + 1}
						onChange={(next) => onChange(setKey(source, key, next))}
					/>
				))}
		</div>
	);
}
