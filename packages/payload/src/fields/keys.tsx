import type { KeysNode } from '@hello-eme/play-schema';
import { useEffect, useId, useState } from 'react';
import { keyList, parseKeys } from '../state.js';
import { Button, helpId, merge, Row } from './controls.js';
import { styles } from './styles.js';
import type { FieldProps } from './types.js';

export function KeysField({ node, value, onChange, ctx, resettable = true }: FieldProps<KeysNode>) {
	const id = useId();
	const keys = keyList(value, node.default);
	const [draft, setDraft] = useState<string | undefined>();
	const [capturing, setCapturing] = useState(false);

	// While capturing, the next key press is recorded (Escape cancels), whatever has focus.
	useEffect(() => {
		if (!capturing) return;
		const listener = (event: KeyboardEvent) => {
			event.preventDefault();
			event.stopPropagation();
			setCapturing(false);
			if (event.code !== 'Escape' && event.code !== '' && !keys.includes(event.code)) {
				onChange([...keys, event.code]);
			}
		};
		window.addEventListener('keydown', listener, true);
		return () => window.removeEventListener('keydown', listener, true);
	});

	return (
		<Row
			id={id}
			node={node}
			ctx={ctx}
			modified={value !== undefined}
			{...(resettable ? { onReset: () => onChange(undefined) } : {})}
		>
			<input
				id={id}
				type="text"
				style={merge(styles.input, styles.wide)}
				placeholder={ctx.labels.keysHint}
				aria-describedby={helpId(id, node)}
				value={draft ?? keys.join(', ')}
				onChange={(event) => {
					setDraft(event.target.value);
					const list = parseKeys(event.target.value);
					if (list.length > 0) onChange(list);
				}}
				onBlur={() => setDraft(undefined)}
			/>
			<Button onClick={() => setCapturing(!capturing)} pressed={capturing}>
				{capturing ? ctx.labels.pressAKey : ctx.labels.pressKey}
			</Button>
		</Row>
	);
}
