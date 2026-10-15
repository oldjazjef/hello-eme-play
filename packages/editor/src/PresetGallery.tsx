'use client';

import { PRESETS, resolveConfig } from '@hello-eme/play-schema';
import { useEffect, useState } from 'react';
import { runBalance, type Verdict } from './balance.js';
import { VerdictChip } from './BalancePanel.js';
import { Button, merge } from './fields/controls.js';
import { styles } from './fields/styles.js';
import { fill, type Labels, type Lang } from './labels.js';
import { countEntries, pick } from './state.js';

/** The presets never change, so each is played once per page load. */
const verdicts = new Map<string, Verdict | undefined>();

function presetVerdicts(): Record<string, Verdict | undefined> {
	for (const [id, preset] of Object.entries(PRESETS)) {
		if (!verdicts.has(id)) verdicts.set(id, runBalance(preset.config)?.verdict);
	}
	return Object.fromEntries(verdicts);
}

/**
 * The presets as cards: what each is, how big it is and how hard it plays. "Try it" shows one in
 * the preview without touching the configuration; "Use" replaces the configuration (undo brings it back).
 */
export function PresetGallery(props: {
	lang: Lang;
	labels: Labels;
	/** The preset being tried in the preview, if any. */
	trying: string | undefined;
	canTry: boolean;
	onTry: (id: string | undefined) => void;
	onUse: (id: string) => void;
}) {
	const { labels, lang } = props;
	const [found, setFound] = useState<Record<string, Verdict | undefined>>({});
	// After the first paint, so the gallery shows at once and the chips fill in.
	useEffect(() => {
		const timer = setTimeout(() => setFound(presetVerdicts()), 0);
		return () => clearTimeout(timer);
	}, []);

	return (
		<div style={styles.cards}>
			{Object.entries(PRESETS).map(([id, preset]) => {
				const config = resolveConfig(preset.config);
				const verdict = found[id];
				const active = props.trying === id;
				return (
					<div
						key={id}
						style={merge(styles.card, active ? styles.cardActive : {}, { cursor: 'default' })}
					>
						<strong>{pick(preset.label, lang)}</strong>
						<span style={styles.muted}>{pick(preset.description, lang)}</span>
						<span style={styles.muted}>
							{fill(labels.presetCounts, {
								entities: countEntries(config, 'entities'),
								items: countEntries(config, 'items'),
								triggers: countEntries(config, 'triggers')
							})}
						</span>
						{verdict && <VerdictChip verdict={verdict} labels={labels} />}
						<span style={styles.toolbar}>
							{props.canTry && (
								<Button pressed={active} onClick={() => props.onTry(active ? undefined : id)}>
									{labels.tryPreset}
								</Button>
							)}
							<Button primary onClick={() => props.onUse(id)}>
								{labels.usePreset}
							</Button>
						</span>
					</div>
				);
			})}
		</div>
	);
}
