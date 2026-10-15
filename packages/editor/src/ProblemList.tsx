'use client';

import { merge } from './fields/controls.js';
import { styles } from './fields/styles.js';
import type { Labels } from './labels.js';
import { problemPath } from './problems.js';

/** What `configProblems` found, each with a button that brings the form to the field. */
export function ProblemList(props: {
	problems: readonly string[];
	labels: Labels;
	onGo: (path: string) => void;
}) {
	const { labels } = props;
	return (
		<section aria-label={labels.problemsFound}>
			<h4 style={styles.warning}>{labels.problemsFound}</h4>
			{props.problems.length === 0 ? (
				<p style={styles.muted}>{labels.noProblems}</p>
			) : (
				<ul style={styles.list}>
					{props.problems.map((problem) => {
						const path = problemPath(problem);
						return (
							<li key={problem} style={merge(styles.warning, { marginBottom: '0.25em' })}>
								{problem}{' '}
								{path !== undefined && (
									<button
										type="button"
										style={merge(styles.button, { marginLeft: '0.5em' })}
										onClick={() => props.onGo(path)}
									>
										{labels.goToField}
									</button>
								)}
							</li>
						);
					})}
				</ul>
			)}
		</section>
	);
}
