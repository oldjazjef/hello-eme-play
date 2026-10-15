import type { ListNode } from '@hello-eme/play-schema';
import { describeTrigger } from '../sentence.js';
import { itemTitle, moveItem, newItem, pick, removeAt, replaceAt } from '../state.js';
import { Button, Section } from './controls.js';
import { styles } from './styles.js';
import type { FieldProps } from './types.js';

export function ListField({
	node,
	value,
	onChange,
	ctx,
	path,
	Child,
	depth = 0,
	resettable = true
}: FieldProps<ListNode>) {
	const items: unknown[] = Array.isArray(value) ? value : [];
	const own = pick(node.of.label, ctx.lang);
	return (
		<Section
			node={node}
			ctx={ctx}
			path={path}
			badge={String(items.length)}
			onReset={resettable && value !== undefined ? () => onChange(undefined) : undefined}
		>
			{items.map((item, index) => {
				// Triggers read as a sentence, so the collapsed list already tells what each one does.
				const title =
					path === 'triggers'
						? describeTrigger(node.of, item, ctx.root, ctx.lang) || `${own} ${index + 1}`
						: itemTitle(node.of, item, `${own} ${index + 1}`, ctx.lang);
				return (
					// Items have no identity of their own, so the position is the key.
					<Section
						key={index}
						node={node.of}
						ctx={ctx}
						path={`${path}.${index}`}
						title={`${index + 1}. ${title}`}
					>
						<div style={styles.toolbar}>
							<Button
								disabled={index === 0}
								onClick={() => onChange(moveItem(items, index, index - 1))}
								label={`${ctx.labels.moveUp}: ${title}`}
							>
								{ctx.labels.moveUp}
							</Button>
							<Button
								disabled={index === items.length - 1}
								onClick={() => onChange(moveItem(items, index, index + 1))}
								label={`${ctx.labels.moveDown}: ${title}`}
							>
								{ctx.labels.moveDown}
							</Button>
							<Button
								onClick={() => onChange(removeAt(items, index))}
								label={`${ctx.labels.remove}: ${title}`}
							>
								{ctx.labels.remove}
							</Button>
						</div>
						<Child
							node={node.of}
							value={item}
							path={`${path}.${index}`}
							ctx={ctx}
							depth={depth + 1}
							resettable={false}
							onChange={(next) => onChange(replaceAt(items, index, next ?? newItem(node.of)))}
						/>
					</Section>
				);
			})}
			<div style={styles.toolbar}>
				<Button
					primary
					disabled={items.length >= node.maxItems}
					onClick={() => onChange([...items, newItem(node.of)])}
					label={`${ctx.labels.add}: ${own}`}
				>
					{ctx.labels.add}
				</Button>
			</div>
		</Section>
	);
}
