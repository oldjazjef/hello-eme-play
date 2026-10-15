/** Every text the game shows. `{count}`, `{score}` and the like are replaced at runtime. */
export const TEXT_KEYS = [
	'toggle',
	'keyboardHint',
	'touchHint',
	'nearHint',
	'driveHint',
	'touchDriveHint',
	'sideHint',
	'visitNotice',
	'controls',
	'up',
	'down',
	'left',
	'right',
	'jump',
	'punch',
	'kick',
	'drift',
	'steering',
	'gas',
	'brake',
	'honk',
	'wrecked',
	'repair',
	'hideHint',
	'showHint',
	'getIn',
	'getOut',
	'exit',
	'dismiss',
	'score',
	'level',
	'health',
	'gameOver',
	'victory',
	'restart',
	'highScore',
	'shop',
	'shopClose',
	'buy',
	'bought',
	'cost'
] as const;

export type TextKey = (typeof TEXT_KEYS)[number];
export type GameTexts = Record<TextKey, string>;
export type Locale = 'de' | 'en';
export const LOCALES: readonly Locale[] = ['de', 'en'];

export const DEFAULT_TEXTS: Record<Locale, GameTexts> = {
	de: {
		toggle: 'Spielmodus',
		keyboardHint:
			'Pfeiltasten oder WASD: laufen · Leertaste: boxen · Q: kicken · E: springen und klicken · Esc: beenden',
		touchHint:
			'Steuerkreuz: laufen · Springen: springen und klicken · Boxen und Kicken: Gegner und Elemente treffen',
		nearHint: 'F oder «Einsteigen»: ins Auto steigen',
		driveHint:
			'Pfeiltasten oder WASD: Gas, Bremse und lenken · Leertaste oder Shift halten: driften · Enter oder H: hupen und klicken · F oder Esc: aussteigen',
		touchDriveHint:
			'Lenkrad ziehen: lenken · Gas und Bremse halten · Drift halten: driften · Hupe: hupen und klicken',
		sideHint:
			'Pfeiltasten oder WASD: laufen und springen · Leertaste: boxen · Q: kicken · Esc: beenden',
		visitNotice: 'Ein Auto ist vorgefahren.',
		controls: 'Steuerung der Figur',
		up: 'Nach oben',
		down: 'Nach unten',
		left: 'Nach links',
		right: 'Nach rechts',
		jump: 'Springen',
		punch: 'Boxen',
		kick: 'Kicken',
		drift: 'Drift',
		steering: 'Lenkrad',
		gas: 'Gas',
		brake: 'Bremse',
		honk: 'Hupe',
		wrecked: 'Zerstört: {count}',
		repair: 'Seite reparieren',
		hideHint: 'Hinweis ausblenden',
		showHint: 'Hinweis einblenden',
		getIn: 'Einsteigen',
		getOut: 'Aussteigen',
		exit: 'Beenden',
		dismiss: 'Auto wegschicken',
		score: 'Punkte: {score}',
		level: 'Level {level}',
		health: 'Leben',
		gameOver: 'Game over! {score} Punkte.',
		victory: 'Gewonnen! {score} Punkte.',
		restart: 'Nochmal',
		highScore: 'Bestwert: {score}',
		shop: 'Upgrades',
		shopClose: 'Upgrades schliessen',
		buy: 'Kaufen',
		bought: 'Gekauft',
		cost: '{points} Punkte'
	},
	en: {
		toggle: 'Game mode',
		keyboardHint:
			'Arrow keys or WASD: walk · Space: punch · Q: kick · E: jump and click · Esc: exit',
		touchHint: 'D-pad: walk · Jump: jump and click · Punch and Kick: hit enemies and things',
		nearHint: 'F or “Get in”: get into the car',
		driveHint:
			'Arrow keys or WASD: gas, brake and steer · Hold space or Shift: drift · Enter or H: honk and click · F or Esc: get out',
		touchDriveHint:
			'Drag the wheel: steer · Hold gas and brake · Hold Drift: drift · Honk: honk and click',
		sideHint: 'Arrow keys or WASD: walk and jump · Space: punch · Q: kick · Esc: exit',
		visitNotice: 'A car pulled up.',
		controls: 'Figure controls',
		up: 'Up',
		down: 'Down',
		left: 'Left',
		right: 'Right',
		jump: 'Jump',
		punch: 'Punch',
		kick: 'Kick',
		drift: 'Drift',
		steering: 'Steering wheel',
		gas: 'Gas',
		brake: 'Brake',
		honk: 'Honk',
		wrecked: 'Broken: {count}',
		repair: 'Repair page',
		hideHint: 'Hide hint',
		showHint: 'Show hint',
		getIn: 'Get in',
		getOut: 'Get out',
		exit: 'Exit',
		dismiss: 'Send the car away',
		score: 'Score: {score}',
		level: 'Level {level}',
		health: 'Health',
		gameOver: 'Game over! {score} points.',
		victory: 'You won! {score} points.',
		restart: 'Play again',
		highScore: 'Best: {score}',
		shop: 'Upgrades',
		shopClose: 'Close upgrades',
		buy: 'Buy',
		bought: 'Bought',
		cost: '{points} points'
	}
};

/** Replaces `{name}` placeholders. */
export function fill(template: string, values: Record<string, string | number>): string {
	return template.replace(/\{(\w+)\}/g, (match, name: string) =>
		name in values ? String(values[name]) : match
	);
}
