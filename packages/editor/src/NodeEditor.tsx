import type { ComponentType } from 'react';
import { FIELDS } from './fields/registry.js';
import type { FieldProps, NodeEditorProps } from './fields/types.js';

export type { EditorContext, MediaOption, NodeEditorProps } from './fields/types.js';

/** Renders the form for one node of the schema, picking the component by the node's type. */
export function NodeEditor(props: NodeEditorProps) {
	// TypeScript can't tie `FIELDS[node.type]` to the matching node, but the registry's type does.
	const Field = FIELDS[props.node.type] as ComponentType<FieldProps>;
	return <Field {...props} Child={NodeEditor} />;
}
