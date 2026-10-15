import type { Node } from '@hello-eme/play-schema';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { pick } from '../state.js';
import { styles } from './styles.js';
import type { EditorContext } from './types.js';

export const merge = (...parts: CSSProperties[]): CSSProperties => Object.assign({}, ...parts);

export function Button(props: {
	children: ReactNode;
	onClick: () => void;
	disabled?: boolean;
	primary?: boolean;
	pressed?: boolean;
	label?: string;
}) {
	return (
		<button
			type="button"
			style={merge(styles.button, props.primary ? styles.primary : {})}
			disabled={props.disabled}
			aria-label={props.label}
			aria-pressed={props.pressed}
			onClick={props.onClick}
		>
			{props.children}
		</button>
	);
}

export function ResetButton(props: { ctx: EditorContext; onReset: () => void; subject: string }) {
	return (
		<Button onClick={props.onReset} label={`${props.ctx.labels.reset}: ${props.subject}`}>
			{props.ctx.labels.resetShort}
		</Button>
	);
}

/** The id the help text of a control gets, for `aria-describedby`. */
export const helpId = (id: string, node: Node): string | undefined =>
	node.help ? `${id}-help` : undefined;

/** Label, control, reset button and help text of a simple setting. */
export function Row(props: {
	id: string;
	node: Node;
	ctx: EditorContext;
	modified: boolean;
	onReset?: () => void;
	children: ReactNode;
}) {
	const { id, node, ctx } = props;
	const label = pick(node.label, ctx.lang);
	return (
		<div style={styles.row}>
			<label htmlFor={id} style={styles.label}>
				{label}
			</label>
			<div style={styles.control}>{props.children}</div>
			<div>
				{props.modified && props.onReset && (
					<ResetButton ctx={ctx} onReset={props.onReset} subject={label} />
				)}
			</div>
			{node.help && (
				<p id={helpId(id, node)} style={styles.help}>
					{pick(node.help, ctx.lang)}
				</p>
			)}
		</div>
	);
}

/** A collapsible group (object, record, list): a heading, an optional reset, and the body. */
export function Section(props: {
	node: Node;
	title?: string;
	badge?: string;
	ctx: EditorContext;
	open?: boolean;
	onReset?: (() => void) | undefined;
	children: ReactNode;
}) {
	const { node, ctx } = props;
	const title = props.title ?? pick(node.label, ctx.lang);
	return (
		<details open={props.open} style={styles.section}>
			<summary style={styles.summary}>
				{title}
				{props.badge && <span style={styles.badge}>{props.badge}</span>}
			</summary>
			<div style={styles.sectionBody}>
				{node.help && (
					<p style={merge(styles.help, { gridColumn: 'auto' })}>{pick(node.help, ctx.lang)}</p>
				)}
				{props.children}
				{props.onReset && (
					<div style={styles.toolbar}>
						<ResetButton ctx={ctx} onReset={props.onReset} subject={title} />
					</div>
				)}
			</div>
		</details>
	);
}

/**
 * A number input that lets you type freely ("1.", empty) and only reports finite numbers.
 * `value` is what is shown while no draft is being typed.
 */
export function NumberInput(props: {
	id?: string;
	value: number;
	min: number;
	max: number;
	step?: number;
	label?: string;
	describedBy?: string | undefined;
	onChange: (value: number) => void;
}) {
	const [draft, setDraft] = useState<string | undefined>();
	return (
		<input
			id={props.id}
			type="number"
			style={merge(styles.input, styles.number)}
			aria-label={props.label}
			aria-describedby={props.describedBy}
			value={draft ?? String(props.value)}
			min={props.min}
			max={props.max}
			step={props.step ?? 'any'}
			onChange={(event) => {
				setDraft(event.target.value);
				const next = event.target.valueAsNumber;
				if (Number.isFinite(next)) props.onChange(next);
			}}
			onBlur={() => setDraft(undefined)}
		/>
	);
}
