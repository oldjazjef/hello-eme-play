import type { CSSProperties } from 'react';

/** Only `--pe-*` variables (see `theme.ts`), so the form follows the host's theme: Payload's admin or its own. */
export const styles = {
	stack: { display: 'grid', gap: 'calc(var(--pe-base) * 0.5)' },
	row: {
		display: 'grid',
		gridTemplateColumns: 'minmax(10rem, 16rem) 1fr auto',
		alignItems: 'center',
		gap: 'calc(var(--pe-base) * 0.5)'
	},
	label: { fontWeight: 500 },
	control: {
		display: 'flex',
		flexWrap: 'wrap',
		alignItems: 'center',
		gap: 'calc(var(--pe-base) * 0.4)'
	},
	help: {
		gridColumn: '1 / -1',
		margin: 0,
		color: 'var(--pe-muted)',
		fontSize: '0.85em'
	},
	input: {
		padding: 'calc(var(--pe-base) * 0.3) calc(var(--pe-base) * 0.5)',
		border: '1px solid var(--pe-border)',
		borderRadius: 'var(--pe-radius-s)',
		background: 'var(--pe-input-bg)',
		color: 'var(--pe-text)',
		font: 'inherit'
	},
	number: { width: '8rem' },
	wide: { flex: 1, minWidth: '12rem' },
	button: {
		padding: 'calc(var(--pe-base) * 0.25) calc(var(--pe-base) * 0.6)',
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: 'var(--pe-border-strong)',
		borderRadius: 'var(--pe-radius-s)',
		background: 'var(--pe-surface)',
		color: 'var(--pe-text)',
		font: 'inherit',
		cursor: 'pointer'
	},
	primary: {
		background: 'var(--pe-accent)',
		color: 'var(--pe-accent-text)',
		borderColor: 'var(--pe-accent)'
	},
	section: {
		border: '1px solid var(--pe-border)',
		borderRadius: 'var(--pe-radius)',
		padding: 'calc(var(--pe-base) * 0.5) calc(var(--pe-base) * 0.75)'
	},
	summary: { cursor: 'pointer', fontWeight: 600 },
	sectionBody: {
		display: 'grid',
		gap: 'calc(var(--pe-base) * 0.5)',
		paddingTop: 'calc(var(--pe-base) * 0.5)'
	},
	toolbar: {
		display: 'flex',
		flexWrap: 'wrap',
		alignItems: 'center',
		gap: 'calc(var(--pe-base) * 0.4)'
	},
	badge: {
		marginLeft: 'calc(var(--pe-base) * 0.5)',
		color: 'var(--pe-muted)',
		fontWeight: 400
	},
	tabs: {
		display: 'flex',
		gap: 'calc(var(--pe-base) * 0.25)',
		borderBottom: '1px solid var(--pe-border)'
	},
	tab: {
		padding: 'calc(var(--pe-base) * 0.4) calc(var(--pe-base) * 0.8)',
		borderStyle: 'solid',
		borderWidth: '0 0 2px',
		borderColor: 'transparent',
		background: 'none',
		color: 'var(--pe-text)',
		font: 'inherit',
		cursor: 'pointer'
	},
	tabActive: { borderColor: 'transparent transparent var(--pe-accent)', fontWeight: 600 },
	preview: {
		width: '100%',
		height: '28rem',
		border: '1px solid var(--pe-border)',
		borderRadius: 'var(--pe-radius)',
		background: 'var(--pe-bg)'
	},
	cards: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fill, minmax(9rem, 1fr))',
		gap: 'calc(var(--pe-base) * 0.5)'
	},
	card: {
		display: 'grid',
		justifyItems: 'center',
		gap: 'calc(var(--pe-base) * 0.25)',
		padding: 'calc(var(--pe-base) * 0.5)',
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: 'var(--pe-border)',
		borderRadius: 'var(--pe-radius)',
		background: 'var(--pe-surface)',
		color: 'var(--pe-text)',
		font: 'inherit',
		textAlign: 'center',
		cursor: 'pointer'
	},
	cardActive: { borderColor: 'var(--pe-accent)', borderWidth: '2px' },
	thumb: {
		position: 'relative',
		display: 'grid',
		placeItems: 'center',
		width: '4rem',
		height: '4rem',
		borderRadius: 'var(--pe-radius)',
		background: 'var(--pe-surface-2)',
		color: 'var(--pe-muted)',
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
		fontFamily: 'var(--pe-mono)'
	},
	warning: { color: 'var(--pe-warning)' },
	error: { color: 'var(--pe-error)' },
	muted: { color: 'var(--pe-muted)' },
	root: {
		display: 'grid',
		gap: 'calc(var(--pe-base) * 0.75)',
		color: 'var(--pe-text)',
		font: 'inherit'
	},
	chip: {
		display: 'inline-block',
		padding: '0.05em 0.65em',
		border: '1px solid currentColor',
		borderRadius: '999px',
		fontSize: '0.85em',
		fontWeight: 600,
		whiteSpace: 'nowrap'
	},
	ok: { color: 'var(--pe-ok)' },
	banner: {
		display: 'flex',
		flexWrap: 'wrap',
		alignItems: 'center',
		gap: 'calc(var(--pe-base) * 0.5)',
		padding: 'calc(var(--pe-base) * 0.5) calc(var(--pe-base) * 0.75)',
		border: '1px solid var(--pe-accent)',
		borderRadius: 'var(--pe-radius)',
		background: 'var(--pe-surface)'
	},
	table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' },
	th: {
		textAlign: 'left',
		padding: 'calc(var(--pe-base) * 0.2) calc(var(--pe-base) * 0.4)',
		borderBottom: '1px solid var(--pe-border-strong)'
	},
	td: {
		verticalAlign: 'top',
		padding: 'calc(var(--pe-base) * 0.2) calc(var(--pe-base) * 0.4)',
		borderBottom: '1px solid var(--pe-border)'
	},
	code: { fontFamily: 'var(--pe-mono)', fontSize: '0.9em' },
	dropzone: {
		padding: 'calc(var(--pe-base) * 0.75)',
		border: '2px dashed var(--pe-border-strong)',
		borderRadius: 'var(--pe-radius)',
		textAlign: 'center'
	},
	dropActive: { borderColor: 'var(--pe-accent)', background: 'var(--pe-surface)' },
	slider: { flex: 1, minWidth: '10rem' },
	flowRow: {
		display: 'grid',
		gridTemplateColumns: 'minmax(8rem, 1fr) minmax(8rem, 2fr) auto',
		alignItems: 'start',
		gap: 'calc(var(--pe-base) * 0.5)',
		padding: 'calc(var(--pe-base) * 0.5) calc(var(--pe-base) * 0.75)',
		border: '1px solid var(--pe-border)',
		borderRadius: 'var(--pe-radius)',
		background: 'var(--pe-surface)'
	},
	list: { margin: 0, paddingLeft: '1.2em' }
} satisfies Record<string, CSSProperties>;
