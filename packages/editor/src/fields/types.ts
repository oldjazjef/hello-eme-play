import type { Node } from '@hello-eme/play-schema';
import type { ComponentType } from 'react';
import type { Labels, Lang } from '../labels.js';

export interface MediaOption {
	label: string;
	url: string;
}

/** What every field needs to know about its surroundings. */
export interface EditorContext {
	lang: Lang;
	labels: Labels;
	/** The resolved configuration: where `ref` fields look for ids. */
	root: unknown;
	/** Images of the media library, offered next to picture URLs. */
	media?: readonly MediaOption[];
	/** Where new images are uploaded (admin URL), if the editor can offer it. */
	mediaUploadHref?: string;
}

export interface NodeEditorProps<N extends Node = Node> {
	node: N;
	/** The JSON as stored: `undefined` means "not written, the default applies". */
	value: unknown;
	/** The new value to store; `undefined` removes it again (reset to default). */
	onChange: (value: unknown) => void;
	/** Dotted path in the configuration (`entities.hero.speed`), also used for element ids. */
	path: string;
	ctx: EditorContext;
	/** Levels of nesting; the root is 0. */
	depth?: number;
	/** `false` for list items and record entries, which have no default to go back to. */
	resettable?: boolean;
}

/** A field component gets the editor itself to render its children (no import cycle). */
export interface FieldProps<N extends Node = Node> extends NodeEditorProps<N> {
	Child: ComponentType<NodeEditorProps>;
}
