import type { Node } from '@hello-eme/play-schema';
import type { ComponentType } from 'react';
import { BooleanField } from './boolean.js';
import { KeysField } from './keys.js';
import { ListField } from './list.js';
import { NumberField } from './number.js';
import { ObjectField } from './object.js';
import { RangeField } from './range.js';
import { RecordField } from './record.js';
import { RefField } from './ref.js';
import { SelectField } from './select.js';
import { StringField } from './string.js';
import type { FieldProps } from './types.js';
import { UnionField } from './union.js';

type Registry = { [T in Node['type']]: ComponentType<FieldProps<Extract<Node, { type: T }>>> };

/**
 * One component per node type. A new node type in the schema is one entry here (the type checker
 * insists on it) plus its component.
 */
export const FIELDS: Registry = {
	number: NumberField,
	boolean: BooleanField,
	string: StringField,
	select: SelectField,
	range: RangeField,
	keys: KeysField,
	object: ObjectField,
	record: RecordField,
	list: ListField,
	union: UnionField,
	ref: RefField
};
