/**
 * The editor without a framework or a CMS: `dist/editor.iife.js` (React included) puts
 * `window.PlayEditor.mount(element, options)` on the page. Also usable from a bundler.
 *
 *   <div id="editor"></div>
 *   <script src="editor.js"></script>
 *   <script>
 *     PlayEditor.mount(document.getElementById('editor'), {
 *       value: await (await fetch('/play.json')).json(),
 *       onChange: (json) => save(json)
 *     });
 *   </script>
 */
import { isObject } from '@hello-eme/play-schema';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { PlayEditor, type PlayEditorProps } from './PlayEditor.js';
import { toLang } from './labels.js';

export interface MountOptions extends Omit<PlayEditorProps, 'value' | 'onChange'> {
	/** The configuration to start from. Default: what `storageKey` holds, else an empty one. */
	value?: unknown;
	/** Called with the new JSON after every change. */
	onChange?: (value: Record<string, unknown>) => void;
	/** Keeps a draft in this browser's `localStorage` under this key (loaded when `value` is absent). */
	storageKey?: string;
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
	const { value: initial, onChange, storageKey, lang, ...rest } = options;
	let current: Record<string, unknown> =
		(isObject(initial) ? initial : undefined) ?? readDraft(storageKey) ?? {};
	let replace: ((value: Record<string, unknown>) => void) | undefined;
	const root = createRoot(element);

	function Standalone() {
		const [value, setValue] = useState(current);
		replace = (next) => {
			current = next;
			setValue(next);
		};
		return (
			<PlayEditor
				{...rest}
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

declare global {
	interface Window {
		PlayEditor?: { mount: typeof mount };
	}
}

// The drop-in script: `window.PlayEditor`. Harmless when imported by a bundler.
if (typeof window !== 'undefined') window.PlayEditor = { mount };
