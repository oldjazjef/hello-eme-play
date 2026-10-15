'use client';

import {
	configProblems,
	isObject,
	PLAY_SCHEMA,
	PRESETS,
	resolveConfig
} from '@hello-eme/play-schema';
import { useConfig, useField, useTranslation } from '@payloadcms/ui';
import type { JSONFieldClientProps } from 'payload';
import { useEffect, useId, useMemo, useState } from 'react';
import { merge } from './fields/controls.js';
import { groupNodes, type GroupId } from './groups.js';
import { styles } from './fields/styles.js';
import type { EditorContext, MediaOption } from './fields/types.js';
import { LABELS, toLang, type Labels } from './labels.js';
import { NodeEditor } from './NodeEditor.js';
import { countEntries, pick } from './state.js';

export type PlayConfigFieldProps = JSONFieldClientProps & {
	/** Slug of the upload collection the pictures come from (default `media`). */
	mediaCollection?: string;
};

type Tab = GroupId | 'raw';

interface MediaDoc {
	filename?: string | null;
	url?: string | null;
	mimeType?: string | null;
}

/** Images of the media collection, for the picture picker. Empty when the request fails. */
function useMedia(apiRoute: string, collection: string): MediaOption[] {
	const [media, setMedia] = useState<MediaOption[]>([]);
	useEffect(() => {
		const controller = new AbortController();
		fetch(`${apiRoute}/${collection}?limit=100&where[mimeType][like]=image`, {
			credentials: 'include',
			signal: controller.signal
		})
			.then((response) => (response.ok ? response.json() : { docs: [] }))
			.then((body: { docs?: MediaDoc[] }) =>
				setMedia(
					(body.docs ?? []).flatMap((doc) =>
						doc.url ? [{ url: doc.url, label: doc.filename ?? doc.url }] : []
					)
				)
			)
			.catch(() => undefined);
		return () => controller.abort();
	}, [apiRoute, collection]);
	return media;
}

function RawJson(props: { value: unknown; labels: Labels; onApply: (value: unknown) => void }) {
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

/**
 * Edits the game's JSON with a form generated from `PLAY_SCHEMA` (or as raw JSON). Only what an
 * editor changes is written, so the stored JSON stays small and new defaults reach old sites.
 */
export function PlayConfigField({ path, mediaCollection = 'media' }: PlayConfigFieldProps) {
	const { value, setValue } = useField<unknown>({ path });
	const { i18n } = useTranslation();
	const { config: payloadConfig } = useConfig();
	const lang = toLang(i18n.language);
	const labels = LABELS[lang];
	const groups = useMemo(() => groupNodes(PLAY_SCHEMA), []);
	const [tab, setTab] = useState<Tab>('groupGame');
	const [preset, setPreset] = useState('');
	const presetId = useId();

	const apiRoute = payloadConfig.routes.api;
	const media = useMedia(apiRoute, mediaCollection);
	const stored = isObject(value) ? value : {};
	const problems = useMemo(() => configProblems(value ?? {}), [value]);
	const resolved = useMemo(() => resolveConfig(stored), [stored]);
	const ctx: EditorContext = {
		lang,
		labels,
		root: resolved,
		media,
		mediaUploadHref: `${payloadConfig.routes.admin}/collections/${mediaCollection}/create`
	};

	const summary = (['entities', 'items', 'upgrades', 'triggers'] as const)
		.map((key) => `${countEntries(resolved, key)} ${labels[key]}`)
		.join(' · ');

	const applyPreset = () => {
		const chosen = PRESETS[preset];
		if (chosen && window.confirm(labels.confirmPreset)) {
			setValue(structuredClone(chosen.config));
			setPreset('');
		}
	};

	return (
		<div className="field-type" style={styles.stack}>
			<p style={styles.muted} aria-label={labels.summary}>
				{summary}
			</p>

			<div style={styles.toolbar}>
				<label htmlFor={presetId}>{labels.preset}</label>
				<select
					id={presetId}
					style={styles.input}
					value={preset}
					onChange={(event) => setPreset(event.target.value)}
				>
					<option value="">{labels.choosePreset}</option>
					{Object.entries(PRESETS).map(([id, option]) => (
						<option key={id} value={id}>
							{pick(option.label, lang)}
						</option>
					))}
				</select>
				<button type="button" style={styles.button} disabled={!preset} onClick={applyPreset}>
					{labels.applyPreset}
				</button>
			</div>
			{PRESETS[preset] && <p style={styles.muted}>{pick(PRESETS[preset].description, lang)}</p>}

			<div role="tablist" style={styles.tabs}>
				{[...groups.map((group) => group.id), 'raw' as const].map((id) => (
					<button
						key={id}
						type="button"
						role="tab"
						aria-selected={tab === id}
						style={merge(styles.tab, tab === id ? styles.tabActive : {})}
						onClick={() => setTab(id)}
					>
						{id === 'raw' ? labels.rawJson : labels[id]}
					</button>
				))}
			</div>

			<div role="tabpanel">
				{tab === 'raw' ? (
					<RawJson value={value} labels={labels} onApply={setValue} />
				) : (
					groups
						.filter((group) => group.id === tab)
						.map((group) => (
							<NodeEditor
								key={group.id}
								node={group.node}
								value={stored}
								path=""
								ctx={ctx}
								onChange={(next) => setValue(next ?? {})}
							/>
						))
				)}
			</div>

			<section aria-label={labels.problems}>
				<h4 style={styles.warning}>{labels.problems}</h4>
				{problems.length === 0 ? (
					<p style={styles.muted}>{labels.noProblems}</p>
				) : (
					<ul>
						{problems.map((problem) => (
							<li key={problem} style={styles.warning}>
								{problem}
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	);
}
