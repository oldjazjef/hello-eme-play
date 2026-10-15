/**
 * The game's stylesheet. Every color, radius and font is a CSS custom property with a fallback,
 * so a website restyles the game by setting `--play-*` (e.g. to its own design tokens) on
 * `:root`. Sprite colors are custom properties too (see `SPRITE_COLORS`).
 * Added as a constructed stylesheet: no `<style>` element, so it also works under a strict CSP.
 */
export const STYLES = /* css */ `
.play-canvas {
	position: fixed;
	inset: 0;
	width: 100%;
	height: 100%;
	pointer-events: none;
	z-index: var(--play-z, 9990);
}
.play-probe {
	position: absolute;
	width: 1px;
	height: 1px;
	overflow: hidden;
	clip-path: inset(50%);
}
.play-dock {
	position: fixed;
	left: 1rem;
	right: 1rem;
	bottom: 1rem;
	z-index: var(--play-z, 9990);
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 0.5rem;
	pointer-events: none;
	font-family: var(--play-font, inherit);
	font-size: 0.875rem;
	line-height: 1.25rem;
}
.play-panel {
	pointer-events: auto;
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.5rem 1rem;
	max-width: 56rem;
	padding: 0.5rem 0.75rem;
	border: 2px solid var(--play-border, #1e1b4b);
	border-radius: var(--play-radius, 0.5rem);
	background: var(--play-surface, #ffffff);
	color: var(--play-text, #1e1b4b);
	box-shadow: var(--play-shadow-box, 0 10px 15px -3px rgb(0 0 0 / 0.15));
}
.play-hint {
	/* The instructions sit at the top of the screen, out of the way of the touch controls. */
	position: fixed;
	top: 1rem;
	left: 1rem;
	right: 1rem;
	width: fit-content;
}
.play-hint > p {
	flex: 1;
	min-width: 0;
	margin: 0;
}
.play-row {
	display: flex;
	flex-shrink: 0;
	align-items: center;
	gap: 0.75rem;
}
.play-tab {
	pointer-events: auto;
	position: fixed;
	top: 1rem;
	left: 0;
	z-index: var(--play-z, 9990);
	display: flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.75rem 0.75rem 0.75rem 0.5rem;
	border: 2px solid var(--play-border, #1e1b4b);
	border-left: 0;
	border-radius: 0 var(--play-radius, 0.5rem) var(--play-radius, 0.5rem) 0;
	background: var(--play-surface, #ffffff);
	color: var(--play-text, #1e1b4b);
	font: inherit;
	font-weight: 600;
	cursor: pointer;
	box-shadow: var(--play-shadow-box, 0 10px 15px -3px rgb(0 0 0 / 0.15));
}
.play-button,
.play-outline,
.play-icon-button,
.play-pill,
.play-pad-button,
.play-tab,
.play-toggle {
	font: inherit;
	cursor: pointer;
}
.play-button,
.play-outline {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 0.375rem 0.875rem;
	border: 2px solid var(--play-primary, #6d28d9);
	border-radius: var(--play-radius, 0.5rem);
	background: var(--play-primary, #6d28d9);
	color: var(--play-primary-text, #ffffff);
	font-weight: 600;
}
.play-outline {
	background: transparent;
	border-color: var(--play-border, #1e1b4b);
	color: inherit;
}
.play-large {
	padding: 0.625rem 1.25rem;
	font-size: 1rem;
}
.play-icon-button {
	display: inline-grid;
	place-items: center;
	padding: 0.375rem;
	border: 0;
	border-radius: var(--play-radius, 0.5rem);
	background: transparent;
	color: inherit;
}
.play-icon {
	width: 1.25rem;
	height: 1.25rem;
}
.play-small-icon {
	width: 1rem;
	height: 1rem;
}
.play-pad {
	pointer-events: auto;
	display: none;
	width: 100%;
	align-items: flex-end;
	justify-content: space-between;
}
.play-dpad {
	display: grid;
	grid-template: repeat(3, auto) / repeat(3, auto);
	gap: 0.25rem;
}
.play-actions {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 0.5rem;
}
.play-pad-button,
.play-pill {
	touch-action: none;
	user-select: none;
	-webkit-user-select: none;
	border: 2px solid var(--play-control-text, #ffffff);
	background: var(--play-control, #1e1b4b);
	color: var(--play-control-text, #ffffff);
	box-shadow: var(--play-shadow-box, 0 10px 15px -3px rgb(0 0 0 / 0.15));
}
.play-pad-button:active,
.play-pill:active {
	background: var(--play-primary, #6d28d9);
	color: var(--play-primary-text, #ffffff);
}
.play-pad-button {
	display: grid;
	place-items: center;
	width: 3rem;
	height: 3rem;
	border-radius: 9999px;
}
.play-pill {
	padding: 0.5rem 1rem;
	border-radius: var(--play-radius, 0.5rem);
	font-weight: 500;
}
.play-wheel {
	touch-action: none;
	user-select: none;
	-webkit-user-select: none;
	position: relative;
	display: grid;
	place-items: center;
	width: 7rem;
	height: 7rem;
	border: 0.75rem solid var(--play-control, #1e1b4b);
	border-radius: 9999px;
	background: transparent;
	box-shadow: 0 0 0 2px var(--play-control-text, #ffffff), var(--play-shadow-box, 0 10px 15px -3px rgb(0 0 0 / 0.15));
}
/* Spokes: a bar across and one down to the bottom, so the turn is visible. */
.play-wheel::before,
.play-wheel::after {
	content: '';
	position: absolute;
	background: var(--play-control, #1e1b4b);
}
.play-wheel::before {
	inset: 50% 0 auto 0;
	height: 0.75rem;
	transform: translateY(-50%);
}
.play-wheel::after {
	inset: 50% auto 0 50%;
	width: 0.75rem;
	transform: translateX(-50%);
}
.play-wheel-hub {
	z-index: 1;
	width: 2.5rem;
	height: 2.5rem;
	border: 2px solid var(--play-control-text, #ffffff);
	border-radius: 9999px;
	background: var(--play-primary, #6d28d9);
}
.play-cluster {
	display: flex;
	align-items: flex-end;
	gap: 0.375rem;
}
.play-gas {
	width: 4.5rem;
	height: 4.5rem;
}
.play-gas .play-icon {
	width: 2rem;
	height: 2rem;
}
.play-hold {
	touch-action: none;
	user-select: none;
	-webkit-user-select: none;
}
.play-hud {
	gap: 0.75rem;
	padding: 0.375rem 0.75rem;
	font-weight: 600;
}
.play-health {
	position: relative;
	width: 8rem;
	height: 0.75rem;
	overflow: hidden;
	border: 2px solid var(--play-border, #1e1b4b);
	border-radius: 9999px;
	background: var(--play-track, #e5e7eb);
}
.play-health > span {
	position: absolute;
	inset: 0 auto 0 0;
	background: var(--play-health, #16a34a);
	transition: width 150ms ease-out;
}
.play-health[data-low] > span {
	background: var(--play-health-low, #dc2626);
}
.play-toggle {
	position: fixed;
	right: 1rem;
	bottom: 1rem;
	z-index: var(--play-z, 9990);
	display: grid;
	place-items: center;
	width: 3rem;
	height: 3rem;
	border: 2px solid var(--play-border, #1e1b4b);
	border-radius: 9999px;
	background: var(--play-surface, #ffffff);
	color: var(--play-text, #1e1b4b);
	box-shadow: var(--play-shadow-box, 0 10px 15px -3px rgb(0 0 0 / 0.15));
}
:is(.play-button, .play-outline, .play-icon-button, .play-pill,
	.play-pad-button, .play-wheel, .play-tab, .play-toggle):focus-visible {
	outline: 2px solid var(--play-focus, #6d28d9);
	outline-offset: 2px;
}
.play-coarse,
.play-toggle[hidden] {
	display: none;
}
@media (pointer: coarse) {
	.play-pad {
		display: flex;
	}
	.play-fine {
		display: none;
	}
	.play-coarse {
		display: block;
	}
	.play-hint {
		max-width: none;
		width: auto;
	}
}
.play-wreck[data-cracks] {
	outline: 2px dashed var(--play-text, #1e1b4b);
	outline-offset: 2px;
}
.play-wreck[data-cracks='1'] {
	opacity: 0.85;
}
.play-wreck[data-cracks='2'] {
	opacity: 0.6;
}
.play-wreck[data-wrecked] {
	visibility: hidden;
}
@media (prefers-reduced-motion: no-preference) {
	.play-shake {
		animation: play-shake 260ms ease-out;
	}
	.play-hint,
	.play-tab {
		animation: play-in 200ms ease-out;
	}
}
@keyframes play-shake {
	20% {
		translate: 0.4rem 0;
		rotate: 1.5deg;
	}
	40% {
		translate: -0.4rem 0;
		rotate: -1.5deg;
	}
	60% {
		translate: 0.25rem 0;
	}
	80% {
		translate: -0.1rem 0;
	}
}
@keyframes play-in {
	from {
		opacity: 0;
		translate: 0 -0.75rem;
	}
}

.play-toast {
	position: fixed;
	top: 5rem;
	left: 50%;
	z-index: var(--play-z, 9990);
	max-width: min(90vw, 32rem);
	transform: translateX(-50%);
	padding: 0.5rem 1rem;
	border: 2px solid var(--play-border, #1e1b4b);
	border-radius: var(--play-radius, 0.5rem);
	background: var(--play-primary, #6d28d9);
	color: var(--play-primary-text, #ffffff);
	font: inherit;
	font-weight: 600;
	pointer-events: none;
	box-shadow: var(--play-shadow-box, 0 10px 15px -3px rgb(0 0 0 / 0.15));
}
.play-toast[hidden] {
	display: none;
}
.play-boss {
	position: fixed;
	top: 7.5rem;
	left: 50%;
	z-index: var(--play-z, 9990);
	width: min(60vw, 24rem);
	transform: translateX(-50%);
	pointer-events: none;
	text-align: center;
	font-weight: 600;
	color: var(--play-text, #1e1b4b);
}
.play-boss > .play-health {
	width: 100%;
	margin-top: 0.125rem;
}
.play-boss[hidden] {
	display: none;
}
.play-shop {
	flex-direction: column;
	align-items: stretch;
	max-height: 60vh;
	overflow: auto;
}
.play-shop h2 {
	margin: 0;
	font-size: 1rem;
}
.play-shop ul {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	margin: 0;
	padding: 0;
	list-style: none;
}
.play-shop li {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 0.25rem 0.75rem;
}
.play-shop li > div {
	flex: 1;
	min-width: 10rem;
}
.play-shop small {
	display: block;
	opacity: 0.8;
}
.play-shop button:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}
.play-stats {
	display: flex;
	flex-wrap: wrap;
	gap: 0.25rem 0.75rem;
	margin: 0;
	font-size: 0.8125rem;
}
.play-stats dt {
	display: inline;
	opacity: 0.8;
}
.play-stats dd {
	display: inline;
	margin: 0 0 0 0.25rem;
	font-weight: 600;
}
.play-level {
	font-weight: 600;
}
`;

let added = false;

/** Adds the stylesheet to the document once. */
export function addStyles(): void {
	if (added) return;
	added = true;
	const sheet = new CSSStyleSheet();
	sheet.replaceSync(STYLES);
	document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
}
