'use client';

import {
	configProblems,
	isObject,
	PLAY_SCHEMA,
	PRESETS,
	resolveConfig
} from '@hello-eme/play-schema';
import {
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
	type KeyboardEvent,
	type ReactNode
} from 'react';
import { BalancePanel } from './BalancePanel.js';
import { merge } from './fields/controls.js';
import { styles } from './fields/styles.js';
import type { EditorContext } from './fields/types.js';
import { FlowView } from './FlowView.js';
import { groupNodes, groupOf, resetGroup, type GroupId } from './groups.js';
import { GuideView } from './GuideView.js';
import { useBalance, useHistory } from './hooks.js';
import { LABELS } from './labels.js';
import type { EditorMode, EditorOptions } from './options.js';
import { NodeEditor } from './NodeEditor.js';
import { PresetGallery } from './PresetGallery.js';
import { problemMap, topKey } from './problems.js';
import { ProblemList } from './ProblemList.js';
import { Preview } from './Preview.js';
import { QuickPanel } from './QuickPanel.js';
import { ResponsiveStyle } from './responsive.js';
import { RawJson } from './RawJson.js';
import { countEntries } from './state.js';
import { themeVars } from './theme.js';

export type { EditorMode } from './options.js';

export interface PlayEditorProps extends EditorOptions {
	/** The configuration JSON as stored (any shape; `undefined` is an empty one). */
	value: unknown;
	/** Called with the new JSON after every edit, undo, preset or import. */
	onChange: (value: Record<string, unknown>) => void;
}

type Tab = 'quick' | GroupId | 'flow' | 'guide' | 'raw';

const STORAGE_KEY = 'hello-eme-play-editor-mode';

/** The chosen mode survives reloads (per browser). */
function useMode(initial: EditorMode): [EditorMode, (mode: EditorMode) => void] {
	const [mode, setMode] = useState<EditorMode>(initial);
	useEffect(() => {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved === 'simple' || saved === 'expert') setMode(saved);
		} catch {
			// No storage (private mode): the default stays.
		}
	}, []);
	return [
		mode,
		(next) => {
			setMode(next);
			try {
				localStorage.setItem(STORAGE_KEY, next);
			} catch {
				// Not stored; fine.
			}
		}
	];
}

function download(filename: string, text: string): void {
	const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
}

const isTextField = (target: EventTarget): boolean =>
	target instanceof HTMLElement &&
	(['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable);

/**
 * The whole editor for the game's JSON: quick settings, presets with a live preview, a balance
 * check, the complete form, the flow of triggers, a guide and raw JSON, with undo and redo.
 * It needs no CMS: the host only passes the JSON in and takes it out again. (`@hello-eme/play-payload`
 * is exactly that, for Payload.)
 */
export function PlayEditor(props: PlayEditorProps): ReactNode {
	const lang = props.lang ?? 'en';
	const labels = LABELS[lang];
	const [mode, setMode] = useMode(props.defaultMode ?? 'simple');
	const history = useHistory(props.value ?? {}, (next) =>
		props.onChange(isObject(next) ? next : {})
	);
	const set = (next: unknown, separate = false) =>
		history.set(isObject(next) ? next : {}, separate);

	const hasPreview = props.previewUrl !== undefined || props.previewHtml !== undefined;
	const groups = useMemo(() => groupNodes(PLAY_SCHEMA), []);
	const [tab, setTab] = useState<Tab>('quick');
	const [trying, setTrying] = useState<string | undefined>();
	const [focus, setFocus] = useState<{ path: string; nonce: number } | undefined>();
	const root = useRef<HTMLDivElement>(null);
	const fileInput = useRef<HTMLInputElement>(null);
	const [status, setStatus] = useState('');
	const presetsId = useId();
	useEffect(() => {
		if (status === '') return;
		const timer = setTimeout(() => setStatus(''), 8000);
		return () => clearTimeout(timer);
	}, [status]);
	// Open for a new configuration only; once you edit, it stays however you left it.
	const [presetsOpen] = useState(
		() => !isObject(props.value) || Object.keys(props.value).length === 0
	);

	const stored = useMemo(() => (isObject(props.value) ? props.value : {}), [props.value]);
	const resolved = useMemo(() => resolveConfig(stored), [stored]);
	const problemList = useMemo(() => configProblems(stored), [stored]);
	const problems = useMemo(() => problemMap(problemList), [problemList]);

	const tryConfig = trying === undefined ? undefined : PRESETS[trying]?.config;
	const { balance, running } = useBalance(tryConfig ?? stored);

	const ctx: EditorContext = {
		lang,
		labels,
		root: resolved,
		problems,
		...(focus ? { focus } : {}),
		...(props.media ? { media: props.media } : {}),
		...(props.mediaUploadHref ? { mediaUploadHref: props.mediaUploadHref } : {}),
		...(props.onUpload ? { onUpload: props.onUpload } : {})
	};

	const tabs: Tab[] =
		mode === 'simple'
			? ['quick', 'guide']
			: ['quick', ...groups.map((group) => group.id), 'flow', 'guide', 'raw'];
	const active = tabs.includes(tab) ? tab : 'quick';
	const tabLabel = (id: Tab): string =>
		id === 'quick'
			? labels.tabQuick
			: id === 'flow'
				? labels.tabFlow
				: id === 'guide'
					? labels.tabGuide
					: id === 'raw'
						? labels.rawJson
						: labels[id];

	/** Brings the form to a setting: switches to its tab and scrolls to it. */
	const jump = (path: string) => {
		const group = groupOf(groups, topKey(path));
		if (mode === 'simple') setMode('expert');
		if (group) setTab(group);
		setFocus({ path, nonce: Date.now() });
	};

	useEffect(() => {
		if (!focus) return;
		// After the tab (and a record's chosen entry) has rendered.
		const timer = setTimeout(() => {
			const parts = focus.path.split('.');
			let target: Element | null = null;
			for (let length = parts.length; length > 0 && !target; length--) {
				const wanted = parts.slice(0, length).join('.');
				target = root.current?.querySelector(`[data-pe-path="${CSS.escape(wanted)}"]`) ?? null;
			}
			if (!target) return;
			for (let el: Element | null = target; el; el = el.parentElement) {
				if (el instanceof HTMLDetailsElement) el.open = true;
			}
			target.scrollIntoView({ block: 'center' });
			const control = target.querySelector<HTMLElement>('input, select, textarea, button');
			(control ?? (target instanceof HTMLElement ? target : null))?.focus({ preventScroll: true });
		}, 60);
		return () => clearTimeout(timer);
	}, [focus]);

	const usePreset = (id: string) => {
		const preset = PRESETS[id];
		if (!preset) return;
		// No "are you sure?" dialog (embedded pages may block them): undo is the way back.
		set(structuredClone(preset.config), true);
		setTrying(undefined);
		setStatus(labels.presetApplied);
	};

	const onKeyDown = (event: KeyboardEvent) => {
		if (!(event.ctrlKey || event.metaKey) || isTextField(event.target)) return;
		const key = event.key.toLowerCase();
		if (key === 'z' && !event.shiftKey) history.undo();
		else if ((key === 'z' && event.shiftKey) || key === 'y') history.redo();
		else return;
		event.preventDefault();
	};

	const copy = () => {
		navigator.clipboard
			.writeText(JSON.stringify(stored, null, 2))
			.then(() => setStatus(labels.copied))
			.catch(() => setStatus(''));
	};
	const load = (file: File | undefined) => {
		if (!file) return;
		file
			.text()
			.then((text) => {
				const parsed: unknown = JSON.parse(text);
				if (!isObject(parsed)) throw new Error('not an object');
				set(parsed, true);
				setStatus('');
			})
			.catch(() => setStatus(labels.importFailed));
	};

	const summary = (['entities', 'items', 'upgrades', 'triggers'] as const)
		.map((key) => `${countEntries(resolved, key)} ${labels[key]}`)
		.join(' · ');

	const group = groups.find((candidate) => candidate.id === active);

	return (
		<div
			ref={root}
			className="pe-root"
			style={merge(themeVars, styles.root)}
			role="group"
			aria-label={labels.editorLabel}
			onKeyDown={onKeyDown}
		>
			<ResponsiveStyle />
			<div style={styles.toolbar}>
				<button
					type="button"
					style={styles.button}
					disabled={!history.canUndo}
					onClick={history.undo}
				>
					↶ {labels.undo}
				</button>
				<button
					type="button"
					style={styles.button}
					disabled={!history.canRedo}
					onClick={history.redo}
				>
					↷ {labels.redo}
				</button>
				<span role="group" aria-label={labels.mode} title={labels.modeHint} style={styles.toolbar}>
					{(['simple', 'expert'] as const).map((id) => (
						<button
							key={id}
							type="button"
							aria-pressed={mode === id}
							style={merge(styles.button, mode === id ? styles.primary : {})}
							onClick={() => setMode(id)}
						>
							{id === 'simple' ? labels.modeSimple : labels.modeExpert}
						</button>
					))}
				</span>
				<span style={merge(styles.toolbar, { marginLeft: 'auto' })}>
					<button
						type="button"
						style={styles.button}
						onClick={() => download('play.json', JSON.stringify(stored, null, 2))}
					>
						{labels.exportJson}
					</button>
					<button type="button" style={styles.button} onClick={() => fileInput.current?.click()}>
						{labels.importJson}
					</button>
					<button type="button" style={styles.button} onClick={copy}>
						{labels.copyJson}
					</button>
					<input
						ref={fileInput}
						type="file"
						accept="application/json,.json"
						hidden
						onChange={(event) => {
							load(event.target.files?.[0]);
							event.target.value = '';
						}}
					/>
				</span>
			</div>
			<p style={styles.muted} role="status">
				{status || summary}
			</p>

			{hasPreview && (
				<>
					{trying !== undefined && PRESETS[trying] && (
						<div style={styles.banner} role="status">
							<span>{labels.tryingPreset.replace('{name}', PRESETS[trying].label[lang])}</span>
							<button
								type="button"
								style={merge(styles.button, styles.primary)}
								onClick={() => usePreset(trying)}
							>
								{labels.usePreset}
							</button>
							<button type="button" style={styles.button} onClick={() => setTrying(undefined)}>
								{labels.cancelTry}
							</button>
						</div>
					)}
					<Preview
						{...(props.previewUrl ? { url: props.previewUrl } : { html: props.previewHtml ?? '' })}
						config={tryConfig ?? props.value ?? {}}
						labels={labels}
					/>
				</>
			)}

			{/* The container the narrow-screen rules look at. The preview sits outside it: a container would trap
			    its full-screen overlay inside the editor. */}
			<div className="pe-body" style={styles.root}>
				<details style={styles.section} open={presetsOpen} aria-labelledby={presetsId}>
					<summary id={presetsId} style={styles.summary}>
						{labels.presetsTitle}
					</summary>
					<div style={styles.sectionBody}>
						<PresetGallery
							lang={lang}
							labels={labels}
							trying={trying}
							canTry={hasPreview}
							onTry={setTrying}
							onUse={usePreset}
						/>
					</div>
				</details>

				<details style={styles.section} open>
					<summary style={styles.summary}>{labels.balanceTitle}</summary>
					<div style={styles.sectionBody}>
						<BalancePanel balance={balance} running={running} labels={labels} />
					</div>
				</details>

				<div role="tablist" className="pe-tabs" style={styles.tabs}>
					{tabs.map((id) => (
						<button
							key={id}
							type="button"
							role="tab"
							aria-selected={active === id}
							style={merge(styles.tab, active === id ? styles.tabActive : {})}
							onClick={() => setTab(id)}
						>
							{tabLabel(id)}
						</button>
					))}
				</div>

				<div role="tabpanel">
					{active === 'quick' && (
						<QuickPanel value={stored} lang={lang} labels={labels} onChange={set} />
					)}
					{group && (
						<div style={styles.stack}>
							<NodeEditor
								node={group.node}
								value={stored}
								path=""
								ctx={ctx}
								onChange={(next) => set(next ?? {})}
							/>
							<div style={styles.toolbar}>
								<button
									type="button"
									style={styles.button}
									onClick={() => {
										set(resetGroup(stored, group), true);
										setStatus(labels.tabWasReset);
									}}
								>
									{labels.resetTab}
								</button>
							</div>
						</div>
					)}
					{active === 'flow' && (
						<FlowView value={stored} lang={lang} labels={labels} onEdit={jump} />
					)}
					{active === 'guide' && (
						<GuideView
							lang={lang}
							labels={labels}
							onShow={jump}
							referenceUrl={props.referenceUrl}
						/>
					)}
					{active === 'raw' && (
						<RawJson key={JSON.stringify(stored)} value={stored} labels={labels} onApply={set} />
					)}
				</div>

				<ProblemList problems={problemList} labels={labels} onGo={jump} />
			</div>
		</div>
	);
}
