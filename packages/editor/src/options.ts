/**
 * The editor's options, in a file without any framework imports, so the vanilla API's type
 * declarations don't pull React's types into a page that doesn't use React.
 */
import type { Lang } from './labels.js';

export interface MediaOption {
	label: string;
	url: string;
}

export type EditorMode = 'simple' | 'expert';

export interface EditorOptions {
	/** The language of the form (the game's labels come from the schema in both). Default `en`. */
	lang?: Lang;
	/** Which mode to start in when the visitor has not chosen one yet. Default `simple`. */
	defaultMode?: EditorMode;
	/** Images the picture picker offers. */
	media?: readonly MediaOption[];
	/** Where new images are uploaded by hand (a page address), if you have one. */
	mediaUploadHref?: string;
	/** Stores an image and returns its address. Without it, pictures are embedded in the JSON. */
	onUpload?: (file: File) => Promise<string>;
	/**
	 * A page of your site that loads the game with `data-preview="<this page's origin>"` (see the play
	 * README). The editor shows it next to the form and plays every change, saved or not. Your own
	 * page is the best preview: it is the real site.
	 */
	previewUrl?: string;
	/**
	 * The preview as a complete HTML document (shown in an iframe from `srcdoc`, same origin). The
	 * vanilla build makes one itself when no `previewUrl` is given; see `previewDocument`.
	 */
	previewHtml?: string;
	/** A page with the complete reference; linked from the guide. */
	referenceUrl?: string;
}
