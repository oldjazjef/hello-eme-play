/**
 * The editor for any page, with no framework to set up: this build carries everything it needs
 * (React included, hidden inside) and shows the game's live preview without a page of your own.
 *
 *   <div id="editor"></div>
 *   <script src="editor.js"></script>
 *   <script>
 *     PlayEditor.mount(document.getElementById('editor'), {
 *       value: await (await fetch('/play.json')).json(),
 *       onChange: (json) => save(json)
 *     });
 *   </script>
 *
 * As a module: `import { mount } from '@hello-eme/play-editor'`.
 */
import { isObject } from '@hello-eme/play-schema';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { GuideView } from './GuideView.js';
import { LABELS, toLang } from './labels.js';
import type { EditorOptions } from './options.js';
import { PlayEditor } from './PlayEditor.js';
import { BUILTIN_PLAY, previewDocument } from './previewPage.js';
import { themeVars } from './theme.js';

export interface MountOptions extends EditorOptions {
	/** The configuration to start from. Default: what `storageKey` holds, else an empty one. */
	value?: unknown;
	/** Called with the new JSON after every change. */
	onChange?: (value: Record<string, unknown>) => void;
	/** Keeps a draft in this browser's `localStorage` under this key (loaded when `value` is absent). */
	storageKey?: string;
	/**
	 * `false`: no live preview. By default the editor shows the game on a small sample page, unless
	 * you give a `previewUrl` (a page of your own) or `previewHtml`.
	 */
	preview?: boolean;
}

export interface MountedEditor {
	/** The current JSON. */
	getValue: () => Record<string, unknown>;
	/** Replaces the JSON (starts a fresh undo history). */
	setValue: (value: unknown) => void;
	destroy: () => void;
}

function readDraft(key: string | undefined): Record<string, unknown> | undefined {
	if (!key) return undefined;
	try {
		const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? 'null');
		return isObject(parsed) ? parsed : undefined;
	} catch {
		return undefined;
	}
}

function saveDraft(key: string | undefined, value: Record<string, unknown>): void {
	if (!key) return;
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// Storage full or blocked: the editor still works, the draft just is not kept.
	}
}

/** Mounts the editor into `element` and keeps its own state, so the page only listens to `onChange`. */
export function mount(element: HTMLElement, options: MountOptions = {}): MountedEditor {
	const {
		value: initial,
		onChange,
		storageKey,
		lang,
		preview,
		previewUrl,
		previewHtml,
		...rest
	} = options;
	let current: Record<string, unknown> =
		(isObject(initial) ? initial : undefined) ?? readDraft(storageKey) ?? {};
	let replace: ((value: Record<string, unknown>) => void) | undefined;
	const root = createRoot(element);

	// Your own page, else HTML you gave, else the built-in sample page.
	const builtin =
		preview !== false && previewUrl === undefined && previewHtml === undefined && BUILTIN_PLAY
			? previewDocument(BUILTIN_PLAY, location.origin)
			: undefined;
	const shown = {
		...(previewUrl !== undefined ? { previewUrl } : {}),
		...((previewHtml ?? builtin) !== undefined && previewUrl === undefined
			? { previewHtml: previewHtml ?? builtin ?? '' }
			: {})
	};

	function Standalone() {
		const [value, setValue] = useState(current);
		replace = (next) => {
			current = next;
			setValue(next);
		};
		return (
			<PlayEditor
				{...rest}
				{...(preview === false ? {} : shown)}
				lang={lang ?? toLang(navigator.language)}
				value={value}
				onChange={(next) => {
					current = next;
					setValue(next);
					saveDraft(storageKey, next);
					onChange?.(next);
				}}
			/>
		);
	}
	root.render(<Standalone />);

	return {
		getValue: () => current,
		setValue: (next) => replace?.(isObject(next) ? next : {}),
		destroy: () => root.unmount()
	};
}

export interface GuideOptions {
	lang?: 'de' | 'en';
	/** Called when "Show in form" is pressed for a setting (its top-level key). */
	onShow?: (key: string) => void;
	/** A page with the complete reference, linked at the top. */
	referenceUrl?: string;
}

/** Mounts only the guide (every setting, event, action, condition and key, searchable): a reference page. */
export function mountGuide(
	element: HTMLElement,
	options: GuideOptions = {}
): { destroy: () => void } {
	const lang = options.lang ?? toLang(navigator.language);
	const root = createRoot(element);
	root.render(
		<div style={{ ...themeVars, color: 'var(--pe-text)' }}>
			<GuideView
				lang={lang}
				labels={LABELS[lang]}
				onShow={options.onShow ?? (() => undefined)}
				referenceUrl={options.referenceUrl}
			/>
		</div>
	);
	return { destroy: () => root.unmount() };
}

declare global {
	interface Window {
		PlayEditor?: { mount: typeof mount; mountGuide: typeof mountGuide };
	}
}

// The drop-in script: `window.PlayEditor`. Harmless when imported by a bundler.
if (typeof window !== 'undefined') window.PlayEditor = { mount, mountGuide };
