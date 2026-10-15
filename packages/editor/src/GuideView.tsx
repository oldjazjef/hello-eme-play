'use client';

import { buildReference, type RefRow } from '@hello-eme/play-schema';
import { useId, useMemo, useState } from 'react';
import { Button, merge } from './fields/controls.js';
import { styles } from './fields/styles.js';
import type { Labels, Lang } from './labels.js';

function RowsTable(props: { rows: readonly RefRow[]; lang: Lang; labels: Labels }) {
	const { labels, lang } = props;
	return (
		<div className="pe-scroll">
			<table style={styles.table}>
				<thead>
					<tr>
						{[
							labels.guideSetting,
							labels.guideType,
							labels.guideDefault,
							labels.guideAllowed,
							labels.guideMeaning
						].map((heading) => (
							<th key={heading} scope="col" style={styles.th}>
								{heading}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{props.rows.map((row) => (
						<tr key={row.path}>
							<td style={merge(styles.td, styles.code)}>{row.path}</td>
							<td style={styles.td}>{row.type}</td>
							<td style={merge(styles.td, styles.code)}>{row.default ?? ''}</td>
							<td style={styles.td}>{row.limits ?? ''}</td>
							<td style={styles.td}>
								{row.label[lang]}
								{row.help && <div style={styles.muted}>{row.help[lang]}</div>}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

const matches = (row: RefRow, query: string, lang: Lang): boolean =>
	`${row.path} ${row.label[lang]} ${row.help?.[lang] ?? ''} ${row.type} ${row.limits ?? ''}`
		.toLowerCase()
		.includes(query);

/**
 * The guide: every setting with its type, default and bounds, plus the events, actions, conditions
 * and keys. Generated from the schema (see `buildReference`), so it is always the current one.
 */
export function GuideView(props: {
	lang: Lang;
	labels: Labels;
	/** Brings the form to a top-level setting. */
	onShow: (key: string) => void;
	/** A page with the complete reference, linked at the top when given. */
	referenceUrl?: string | undefined;
}) {
	const { labels, lang } = props;
	const reference = useMemo(buildReference, []);
	const [text, setText] = useState('');
	const searchId = useId();
	const query = text.trim().toLowerCase();
	const shown = (rows: readonly RefRow[]) =>
		query === '' ? rows : rows.filter((row) => matches(row, query, lang));

	const sections = reference.sections.flatMap((section) => {
		const rows = shown(section.rows);
		return rows.length > 0 ? [{ section, rows }] : [];
	});
	const variantGroups = (
		[
			['guideActions', 'do', reference.actions],
			['guideConditions', 'if', reference.conditions]
		] as const
	).map(([title, by, list]) => ({
		title,
		by,
		variants: list.filter(
			(variant) =>
				query === '' ||
				`${variant.id} ${variant.label[lang]} ${variant.help?.[lang] ?? ''}`
					.toLowerCase()
					.includes(query) ||
				shown(variant.rows).length > 0
		)
	}));
	const events = reference.events.filter(
		(event) => query === '' || `${event.id} ${event.label[lang]}`.toLowerCase().includes(query)
	);
	const keys = reference.keys.filter(
		(key) =>
			query === '' ||
			`${key.path} ${key.label[lang]} ${key.keys.join(' ')}`.toLowerCase().includes(query)
	);
	const empty =
		sections.length === 0 &&
		events.length === 0 &&
		keys.length === 0 &&
		variantGroups.every((group) => group.variants.length === 0);

	return (
		<div style={styles.stack}>
			<div style={styles.toolbar}>
				<label htmlFor={searchId}>{labels.guideSearch}</label>
				<input
					id={searchId}
					type="search"
					style={merge(styles.input, styles.wide)}
					value={text}
					onChange={(event) => setText(event.target.value)}
				/>
				{props.referenceUrl && (
					<a href={props.referenceUrl} target="_blank" rel="noreferrer">
						{labels.guideReference}
					</a>
				)}
			</div>
			{empty && <p style={styles.muted}>{labels.guideNoMatch}</p>}

			{sections.map(({ section, rows }) => (
				<details key={section.id} open={query !== ''} style={styles.section}>
					<summary style={styles.summary}>
						{section.label[lang]}
						<span style={merge(styles.badge, styles.code)}>{section.id}</span>
					</summary>
					<div style={styles.sectionBody}>
						{section.help && <p style={styles.muted}>{section.help[lang]}</p>}
						<RowsTable rows={rows} lang={lang} labels={labels} />
						<div style={styles.toolbar}>
							<Button onClick={() => props.onShow(section.id)}>{labels.guideShow}</Button>
						</div>
					</div>
				</details>
			))}

			{events.length > 0 && (
				<details open={query !== ''} style={styles.section}>
					<summary style={styles.summary}>{labels.guideEvents}</summary>
					<div className="pe-scroll">
						<table style={merge(styles.table, { marginTop: 'calc(var(--pe-base) * 0.5)' })}>
							<tbody>
								{events.map((event) => (
									<tr key={event.id}>
										<td style={merge(styles.td, styles.code)}>{event.id}</td>
										<td style={styles.td}>{event.label[lang]}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</details>
			)}

			{variantGroups.map(
				(group) =>
					group.variants.length > 0 && (
						<details key={group.title} open={query !== ''} style={styles.section}>
							<summary style={styles.summary}>{labels[group.title]}</summary>
							<div style={styles.sectionBody}>
								{group.variants.map((variant) => (
									<div key={variant.id} style={styles.stack}>
										<strong>
											<span style={styles.code}>{`${group.by}: ${variant.id}`}</span> –{' '}
											{variant.label[lang]}
										</strong>
										{variant.help && <span style={styles.muted}>{variant.help[lang]}</span>}
										{variant.rows.length > 0 && (
											<RowsTable rows={variant.rows} lang={lang} labels={labels} />
										)}
									</div>
								))}
							</div>
						</details>
					)
			)}

			{keys.length > 0 && (
				<details open={query !== ''} style={styles.section}>
					<summary style={styles.summary}>{labels.guideKeys}</summary>
					<div style={styles.sectionBody}>
						<p style={styles.muted}>{labels.guideKeysIntro}</p>
						<div className="pe-scroll">
							<table style={styles.table}>
								<thead>
									<tr>
										<th scope="col" style={styles.th}>
											{labels.guideKeyAction}
										</th>
										<th scope="col" style={styles.th}>
											{labels.guideSetting}
										</th>
										<th scope="col" style={styles.th}>
											{labels.guideKeyDefault}
										</th>
									</tr>
								</thead>
								<tbody>
									{keys.map((key) => (
										<tr key={key.path}>
											<td style={styles.td}>{key.label[lang]}</td>
											<td style={merge(styles.td, styles.code)}>{key.path}</td>
											<td style={merge(styles.td, styles.code)}>{key.keys.join(', ') || '—'}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</details>
			)}
		</div>
	);
}
