'use client';

import { resolveConfig } from '@hello-eme/play-schema';
import { useMemo } from 'react';
import { analyzeFlow, type FlowStep, type FlowWarning } from './flow.js';
import { Button, merge } from './fields/controls.js';
import { styles } from './fields/styles.js';
import { fill, type Labels, type Lang } from './labels.js';

function warningText(warning: FlowWarning, labels: Labels): string {
	switch (warning.code) {
		case 'noSource':
			return fill(labels.warnNoSource, { event: warning.event });
		case 'empty':
			return labels.warnEmpty;
		case 'loop':
			return fill(labels.warnLoop, { paths: warning.paths.join(' → ') });
	}
}

const KIND_LABEL = { trigger: 'flowTrigger', item: 'flowItem', upgrade: 'flowUpgrade' } as const;

function Step(props: {
	step: FlowStep;
	steps: readonly FlowStep[];
	labels: Labels;
	onEdit: (path: string) => void;
}) {
	const { step, labels } = props;
	const title = `${labels[KIND_LABEL[step.kind]]} ${step.title}`;
	return (
		<li style={styles.flowRow} data-flow-step={step.path}>
			<div>
				<strong>{labels.flowWhen}</strong> {step.when}
				{step.conditions.length > 0 && (
					<div style={styles.muted}>
						{labels.flowOnlyIf} {step.conditions.join(' + ')}
					</div>
				)}
			</div>
			<div>
				<strong>{labels.flowThen}</strong>{' '}
				{step.actions.length > 0 ? (
					step.actions.join(', ')
				) : (
					<span style={styles.warning}>{labels.flowNoActions}</span>
				)}
				{step.causes.length > 0 && (
					<div style={styles.muted}>
						↳ {labels.flowCauses}:{' '}
						{step.causes
							.map((at) => props.steps[at])
							.flatMap((cause) => (cause ? [`${labels.flowTrigger} ${cause.title}`] : []))
							.join(', ')}
					</div>
				)}
			</div>
			<Button onClick={() => props.onEdit(step.path)} label={`${labels.flowEdit}: ${title}`}>
				{title}
			</Button>
		</li>
	);
}

/** What sets off what, as a list: trigger, item and upgrade effects, linked where one leads to another. */
export function FlowView(props: {
	value: unknown;
	lang: Lang;
	labels: Labels;
	onEdit: (path: string) => void;
}) {
	const { labels } = props;
	const flow = useMemo(
		() => analyzeFlow(resolveConfig(props.value ?? {}), props.lang),
		[props.value, props.lang]
	);
	return (
		<div style={styles.stack}>
			<p style={styles.muted}>{labels.flowIntro}</p>
			{flow.warnings.length > 0 && (
				<ul style={merge(styles.list, styles.warning)} role="status">
					{flow.warnings.map((warning) => (
						<li key={`${warning.code}-${warning.path}`}>
							<button
								type="button"
								style={merge(styles.button, {
									borderStyle: 'none',
									background: 'none',
									color: 'inherit',
									textDecoration: 'underline'
								})}
								onClick={() => props.onEdit(warning.path)}
							>
								{warning.path}
							</button>{' '}
							{warningText(warning, labels)}
						</li>
					))}
				</ul>
			)}
			{flow.steps.length === 0 ? (
				<p style={styles.muted}>{labels.flowNothing}</p>
			) : (
				<ol style={merge(styles.stack, { margin: 0, padding: 0, listStyle: 'none' })}>
					{flow.steps.map((step) => (
						<Step
							key={step.path}
							step={step}
							steps={flow.steps}
							labels={labels}
							onEdit={props.onEdit}
						/>
					))}
				</ol>
			)}
		</div>
	);
}
