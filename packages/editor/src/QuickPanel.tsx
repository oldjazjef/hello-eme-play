'use client';

import { resolveConfig } from '@hello-eme/play-schema';
import { useId } from 'react';
import { NumberInput } from './fields/controls.js';
import { styles } from './fields/styles.js';
import type { Labels, Lang } from './labels.js';
import { applyQuick, quickValues, type QuickSetting, type QuickValue } from './quick.js';
import { pick } from './state.js';

function Control(props: {
	setting: QuickSetting;
	value: QuickValue;
	lang: Lang;
	onChange: (value: QuickValue) => void;
}) {
	const { setting, value } = props;
	const id = useId();
	const label = pick(setting.label, props.lang);
	const control = setting.control;
	return (
		<div className="pe-row" style={styles.row}>
			<label htmlFor={id} style={styles.label}>
				{label}
			</label>
			<div style={styles.control}>
				{control.kind === 'number' && typeof value === 'number' && (
					<>
						<input
							id={id}
							type="range"
							style={styles.slider}
							min={control.min}
							max={control.max}
							step={control.step}
							value={value}
							aria-describedby={`${id}-help`}
							onChange={(event) => props.onChange(event.target.valueAsNumber)}
						/>
						<NumberInput
							value={value}
							min={control.min}
							max={control.max}
							step={control.step}
							label={label}
							onChange={props.onChange}
						/>
						{control.unit && <span style={styles.muted}>{control.unit}</span>}
					</>
				)}
				{control.kind === 'boolean' && (
					<input
						id={id}
						type="checkbox"
						aria-describedby={`${id}-help`}
						checked={value === true}
						onChange={(event) => props.onChange(event.target.checked)}
					/>
				)}
				{control.kind === 'select' && (
					<select
						id={id}
						style={styles.input}
						aria-describedby={`${id}-help`}
						value={String(value)}
						onChange={(event) => props.onChange(event.target.value)}
					>
						{control.options.map((option) => (
							<option key={option.value} value={option.value}>
								{pick(option.label, props.lang)}
							</option>
						))}
					</select>
				)}
			</div>
			<div />
			<p id={`${id}-help`} style={styles.help}>
				{pick(setting.help, props.lang)}
			</p>
		</div>
	);
}

/** The few settings most people change, as sliders and switches that write the same JSON as the form. */
export function QuickPanel(props: {
	value: unknown;
	lang: Lang;
	labels: Labels;
	onChange: (next: unknown) => void;
}) {
	const config = resolveConfig(props.value ?? {});
	return (
		<div style={styles.stack}>
			<p style={styles.muted}>{props.labels.quickIntro}</p>
			{quickValues(config).map(({ setting, value }) => (
				<Control
					key={setting.id}
					setting={setting}
					value={value}
					lang={props.lang}
					onChange={(next) => props.onChange(applyQuick(props.value, setting, next))}
				/>
			))}
		</div>
	);
}
