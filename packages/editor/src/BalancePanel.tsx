'use client';

import type { CSSProperties } from 'react';
import type { Balance, Verdict } from './balance.js';
import { merge } from './fields/controls.js';
import { styles } from './fields/styles.js';
import { fill, type Labels } from './labels.js';

const VERDICT_LABEL: Record<Verdict, keyof Labels> = {
	balanced: 'verdictBalanced',
	hard: 'verdictHard',
	veryHard: 'verdictVeryHard',
	easy: 'verdictEasy',
	idle: 'verdictIdle'
};

const VERDICT_STYLE: Record<Verdict, CSSProperties> = {
	balanced: styles.ok,
	hard: styles.warning,
	veryHard: styles.error,
	easy: styles.warning,
	idle: styles.muted
};

/** The verdict as a small badge. */
export function VerdictChip(props: { verdict: Verdict; labels: Labels }) {
	return (
		<span style={merge(styles.chip, VERDICT_STYLE[props.verdict])}>
			{props.labels[VERDICT_LABEL[props.verdict]]}
		</span>
	);
}

const percent = (share: number): number => Math.round(share * 100);

/** What the practice bot found, in one line, plus the engine's hints. */
export function BalancePanel(props: {
	balance: Balance | undefined;
	running: boolean;
	labels: Labels;
}) {
	const { balance, running, labels } = props;
	return (
		<div style={styles.stack} aria-busy={running}>
			{balance === undefined ? (
				<p style={styles.muted}>{running ? labels.balanceRunning : labels.balanceNone}</p>
			) : (
				<>
					<p style={styles.toolbar} aria-live="polite">
						<VerdictChip verdict={balance.verdict} labels={labels} />
						<span>
							{fill(labels.balanceLine, {
								rounds: balance.report.rounds.length,
								seconds: Math.round(balance.report.seconds.max),
								died: percent(balance.report.rate.died),
								won: percent(balance.report.rate.won),
								timeout: percent(balance.report.rate.timeout)
							})}
						</span>
					</p>
					{balance.report.hints.length > 0 && (
						<ul style={styles.list}>
							{balance.report.hints.map((hint) => (
								<li key={hint}>{hint}</li>
							))}
						</ul>
					)}
					<p style={styles.muted}>{labels.balanceNote}</p>
				</>
			)}
		</div>
	);
}
