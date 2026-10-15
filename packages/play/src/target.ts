/** What the figure can "click" by jumping on it. */
export const CLICKABLE =
	'a[href], button, summary, label, select, input, textarea, [role="button"], [role="link"]';

/** Marks the game's own UI (touch controls, hint), which the figure never activates. */
export const GAME_UI = '[data-play-ui]';

/**
 * The element the figure landed on, or undefined if there is nothing to activate.
 * `hit` is what `document.elementFromPoint` found under its feet.
 */
export function clickTarget(hit: Element | null): HTMLElement | undefined {
	if (!hit || hit.closest(GAME_UI)) return undefined;
	const target = hit.closest<HTMLElement>(CLICKABLE);
	if (!target || target.matches(':disabled')) return undefined;
	return target;
}

/** Form fields get focus (so the visitor can type), everything else a click. */
export function activate(target: HTMLElement): void {
	if (target.matches('input:not([type="checkbox"], [type="radio"]), select, textarea')) {
		target.focus();
		return;
	}
	target.click();
}

/** Keys typed into a form field belong to the field, not to the figure. */
export function isEditable(target: EventTarget | null): boolean {
	return (
		target instanceof HTMLElement &&
		(target.isContentEditable || target.matches('input, select, textarea'))
	);
}
