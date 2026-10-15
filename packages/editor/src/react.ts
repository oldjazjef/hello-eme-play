/**
 * @hello-eme/play-editor/react: the editor as a React component, for hosts that already use React
 * (the Payload plugin is one). It needs `react` >= 19; the pieces are exported for custom layouts.
 */
export { PlayEditor, type EditorMode, type PlayEditorProps } from './PlayEditor.js';
export { NodeEditor, type EditorContext, type NodeEditorProps } from './NodeEditor.js';
export { GuideView } from './GuideView.js';
export { Preview, originOf } from './Preview.js';
export { objectProblem } from './state.js';
export { themeVars } from './theme.js';
export { LABELS, fill, toLang, type Labels, type Lang } from './labels.js';
export type { EditorOptions, MediaOption } from './options.js';
export { BUILTIN_PLAY, previewDocument, SAMPLE_PAGE } from './previewPage.js';
export * from './tools.js';
