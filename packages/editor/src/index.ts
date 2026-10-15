/**
 * @hello-eme/play-editor: the editor for the JSON configuration of @hello-eme/play, for any page.
 * `mount` puts the whole editor (quick settings, presets, live preview, balance check, form, flow,
 * guide, undo) into an element. No framework needed; React users: `@hello-eme/play-editor/react`.
 */
export {
	mount,
	mountGuide,
	type GuideOptions,
	type MountedEditor,
	type MountOptions
} from './vanilla.js';
export type { EditorMode, EditorOptions, MediaOption } from './options.js';
export type { Lang } from './labels.js';
export { previewDocument, SAMPLE_PAGE } from './previewPage.js';
export * from './tools.js';
