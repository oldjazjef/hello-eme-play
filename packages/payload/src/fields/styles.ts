import type { CSSProperties } from 'react';

/** Payload's CSS variables only, so the form follows the admin theme. */
export const styles = {
	stack: { display: 'grid', gap: 'calc(var(--base) * 0.5)' },
	row: {
		display: 'grid',
		gridTemplateColumns: 'minmax(10rem, 16rem) 1fr auto',
		alignItems: 'center',
		gap: 'calc(var(--base) * 0.5)'
	},
	label: { fontWeight: 500 },
	control: {
		display: 'flex',
		flexWrap: 'wrap',
		alignItems: 'center',
		gap: 'calc(var(--base) * 0.4)'
	},
	help: {
		gridColumn: '1 / -1',
		margin: 0,
		color: 'var(--theme-elevation-500)',
		fontSize: '0.85em'
	},
	input: {
		padding: 'calc(var(--base) * 0.3) calc(var(--base) * 0.5)',
		border: '1px solid var(--theme-elevation-150)',
		borderRadius: 'var(--style-radius-s)',
		background: 'var(--theme-input-bg)',
		color: 'var(--theme-text)',
		font: 'inherit'
	},
	number: { width: '8rem' },
	wide: { flex: 1, minWidth: '12rem' },
	button: {
		padding: 'calc(var(--base) * 0.25) calc(var(--base) * 0.6)',
		border: '1px solid var(--theme-elevation-250)',
		borderRadius: 'var(--style-radius-s)',
		background: 'var(--theme-elevation-50)',
		color: 'var(--theme-text)',
		font: 'inherit',
		cursor: 'pointer'
	},
	primary: {
		background: 'var(--theme-elevation-800)',
		color: 'var(--theme-elevation-0)',
		borderColor: 'var(--theme-elevation-800)'
	},
	section: {
		border: '1px solid var(--theme-elevation-150)',
		borderRadius: 'var(--style-radius-m)',
		padding: 'calc(var(--base) * 0.5) calc(var(--base) * 0.75)'
	},
	summary: { cursor: 'pointer', fontWeight: 600 },
	sectionBody: {
		display: 'grid',
		gap: 'calc(var(--base) * 0.5)',
		paddingTop: 'calc(var(--base) * 0.5)'
	},
	toolbar: {
		display: 'flex',
		flexWrap: 'wrap',
		alignItems: 'center',
		gap: 'calc(var(--base) * 0.4)'
	},
	badge: {
		marginLeft: 'calc(var(--base) * 0.5)',
		color: 'var(--theme-elevation-500)',
		fontWeight: 400
	},
	tabs: {
		display: 'flex',
		gap: 'calc(var(--base) * 0.25)',
		borderBottom: '1px solid var(--theme-elevation-150)'
	},
	tab: {
		padding: 'calc(var(--base) * 0.4) calc(var(--base) * 0.8)',
		border: 'none',
		borderBottom: '2px solid transparent',
		background: 'none',
		color: 'var(--theme-text)',
		font: 'inherit',
		cursor: 'pointer'
	},
	tabActive: { borderBottomColor: 'var(--theme-elevation-800)', fontWeight: 600 },
	cards: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fill, minmax(9rem, 1fr))',
		gap: 'calc(var(--base) * 0.5)'
	},
	card: {
		display: 'grid',
		justifyItems: 'center',
		gap: 'calc(var(--base) * 0.25)',
		padding: 'calc(var(--base) * 0.5)',
		border: '1px solid var(--theme-elevation-150)',
		borderRadius: 'var(--style-radius-m)',
		background: 'var(--theme-elevation-50)',
		color: 'var(--theme-text)',
		font: 'inherit',
		textAlign: 'center',
		cursor: 'pointer'
	},
	cardActive: { borderColor: 'var(--theme-elevation-800)', borderWidth: '2px' },
	thumb: {
		position: 'relative',
		display: 'grid',
		placeItems: 'center',
		width: '4rem',
		height: '4rem',
		borderRadius: 'var(--style-radius-m)',
		background: 'var(--theme-elevation-100)',
		color: 'var(--theme-elevation-500)',
		fontWeight: 600
	},
	thumbImage: {
		position: 'absolute',
		inset: 0,
		backgroundRepeat: 'no-repeat',
		imageRendering: 'pixelated'
	},
	textarea: {
		width: '100%',
		minHeight: '28rem',
		fontFamily: 'var(--font-mono, monospace)'
	},
	warning: { color: 'var(--theme-warning-600, var(--theme-error-500))' },
	error: { color: 'var(--theme-error-500)' },
	muted: { color: 'var(--theme-elevation-500)' }
} satisfies Record<string, CSSProperties>;
