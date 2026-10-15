'use client';

import { useEffect, useRef, useState } from 'react';
import type { Labels } from './labels.js';
import { styles } from './fields/styles.js';

/** Must match the engine's preview mode (`data-preview`, see the play README). */
const CONFIG = 'play-config';
const READY = 'play-ready';

/** The origin of the preview page, or undefined when the URL is not an absolute http(s) one. */
export function originOf(url: string | undefined): string | undefined {
	if (!url) return undefined;
	try {
		const parsed = new URL(url);
		return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.origin : undefined;
	} catch {
		return undefined;
	}
}

/**
 * The game running next to the form. The preview page (`previewUrl`) loads the game with
 * `data-preview`; it says it is ready and then plays every configuration sent here.
 */
export function Preview(props: { url?: string; html?: string; config: unknown; labels: Labels }) {
	// A page of your own is shown from its address; built-in HTML is a same-origin `srcdoc`.
	const origin =
		props.html !== undefined
			? typeof location === 'undefined'
				? undefined
				: location.origin
			: originOf(props.url);
	const frame = useRef<HTMLIFrameElement>(null);
	// Counts the "ready" messages: the page says it again every time it reloads.
	const [ready, setReady] = useState(0);

	useEffect(() => {
		const onMessage = (event: MessageEvent) => {
			const data: unknown = event.data;
			if (
				event.origin === origin &&
				event.source === frame.current?.contentWindow &&
				typeof data === 'object' &&
				data !== null &&
				'type' in data &&
				data.type === READY
			) {
				setReady((count) => count + 1);
			}
		};
		addEventListener('message', onMessage);
		return () => removeEventListener('message', onMessage);
	}, [origin]);

	// Edits are sent after a short pause, so typing does not restart the game on every key.
	useEffect(() => {
		if (ready === 0 || !origin) return;
		const timer = setTimeout(
			() =>
				frame.current?.contentWindow?.postMessage({ type: CONFIG, config: props.config }, origin),
			400
		);
		return () => clearTimeout(timer);
	}, [ready, origin, props.config]);

	// Full screen: the browser's own (hides its bars on a phone), else a layer over the page (iPhone).
	const box = useRef<HTMLDivElement>(null);
	const [full, setFull] = useState(false);
	useEffect(() => {
		const left = () => {
			if (!document.fullscreenElement) setFull(false);
		};
		const escape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setFull(false);
		};
		document.addEventListener('fullscreenchange', left);
		document.addEventListener('keydown', escape);
		return () => {
			document.removeEventListener('fullscreenchange', left);
			document.removeEventListener('keydown', escape);
		};
	}, []);
	const toggleFull = () => {
		if (full) {
			if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
			setFull(false);
			return;
		}
		setFull(true);
		// If the browser refuses, the layer over the page is the full screen.
		void box.current?.requestFullscreen?.().catch(() => undefined);
	};

	if (!origin) return null;
	return (
		<details open style={styles.section}>
			<summary style={styles.summary}>{props.labels.preview}</summary>
			<div style={styles.sectionBody}>
				<div ref={box} style={full ? styles.previewFull : styles.previewBox}>
					<div style={styles.toolbar}>
						<button type="button" style={styles.button} aria-pressed={full} onClick={toggleFull}>
							{full ? '⤡ ' : '⤢ '}
							{full ? props.labels.previewExit : props.labels.previewFull}
						</button>
					</div>
					<iframe
						ref={frame}
						{...(props.html !== undefined ? { srcDoc: props.html } : { src: props.url })}
						title={props.labels.preview}
						className="pe-preview"
						style={full ? styles.previewFrameFull : styles.preview}
					/>
				</div>
				<p style={styles.muted}>{props.labels.previewHint}</p>
			</div>
		</details>
	);
}
