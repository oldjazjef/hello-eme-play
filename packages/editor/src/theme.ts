import type { CSSProperties } from 'react';

/**
 * The editor's colours and sizes as `--pe-*` custom properties, set on its root element. Inside
 * Payload they take the admin theme's values (so the form looks native, in light and dark); anywhere
 * else the fallbacks apply, which follow the visitor's colour scheme. Override any of them on a
 * parent element to re-theme the editor.
 */
export const themeVars = {
	'--pe-base': 'var(--base, 1.25rem)',
	'--pe-bg': 'var(--theme-elevation-0, light-dark(#fff, #151618))',
	'--pe-surface': 'var(--theme-elevation-50, light-dark(#f6f6f7, #1d1f22))',
	'--pe-surface-2': 'var(--theme-elevation-100, light-dark(#ececee, #272a2e))',
	'--pe-input-bg': 'var(--theme-input-bg, light-dark(#fff, #1d1f22))',
	'--pe-border': 'var(--theme-elevation-150, light-dark(#d9d9de, #34373c))',
	'--pe-border-strong': 'var(--theme-elevation-250, light-dark(#b9b9c0, #4b4f56))',
	'--pe-text': 'var(--theme-text, light-dark(#17181a, #ececee))',
	'--pe-muted': 'var(--theme-elevation-500, light-dark(#5e6068, #a0a3ab))',
	'--pe-accent': 'var(--theme-elevation-800, light-dark(#26282c, #e6e7ea))',
	'--pe-accent-text': 'var(--theme-elevation-0, light-dark(#fff, #151618))',
	'--pe-radius': 'var(--style-radius-m, 8px)',
	'--pe-radius-s': 'var(--style-radius-s, 4px)',
	'--pe-warning': 'var(--theme-warning-600, light-dark(#9a5b00, #f0b050))',
	'--pe-error': 'var(--theme-error-500, light-dark(#c62828, #ff8a80))',
	'--pe-ok': 'var(--theme-success-600, light-dark(#1b7a3d, #6fd08c))',
	'--pe-mono': 'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)',
	colorScheme: 'light dark'
} as CSSProperties;
