/** The editor's logic without any UI: for hosts that build their own, and for tests. */
export { runBalance, verdictOf, type Balance, type Verdict } from './balance.js';
export { analyzeFlow, type Flow, type FlowStep, type FlowWarning } from './flow.js';
export { applyQuick, QUICK_SETTINGS, quickValues, type QuickSetting } from './quick.js';
export { guessSprite, type ImageInfo, type SpriteGuess } from './sprites.js';
export { problemMap, problemPath } from './problems.js';
