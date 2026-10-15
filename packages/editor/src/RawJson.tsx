'use client';

import { isObject } from '@hello-eme/play-schema';
import { useId, useState } from 'react';
import { merge } from './fields/controls.js';
import { styles } from './fields/styles.js';
import type { Labels } from './labels.js';

/** The configuration as text. Applies when you leave the field; a parse error applies nothing. */
export function RawJson(props: {
	value: unknown;
	labels: Labels;
	onApply: (value: unknown) => void;
}) {
	const { labels } = props;
	const id = useId();
	const [draft, setDraft] = useState(() => JSON.stringify(props.value ?? {}, null, 2));
	const [error, setError] = useState<string | undefined>();
	const apply = () => {
		try {
			const parsed: unknown = JSON.parse(draft);
			if (!isObject(parsed)) return setError(labels.notObject);
			setError(undefined);
			props.onApply(parsed);
		} catch (cause) {
			setError(`${labels.invalidJson}: ${cause instanceof Error ? cause.message : ''}`);
		}
	};
	return (
		<div style={styles.stack}>
			<label htmlFor={id}>{labels.rawJson}</label>
			<textarea
				id={id}
				style={merge(styles.input, styles.textarea)}
				spellCheck={false}
				value={draft}
				aria-invalid={error !== undefined}
				aria-describedby={`${id}-hint`}
				onChange={(event) => setDraft(event.target.value)}
				onBlur={apply}
			/>
			<p id={`${id}-hint`} style={styles.muted}>
				{labels.rawHint}
			</p>
			{error && (
				<p role="alert" style={styles.error}>
					{error}
				</p>
			)}
		</div>
	);
}
