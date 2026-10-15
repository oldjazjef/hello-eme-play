/**
 * Builds the demo site (site/ → site-dist/) for GitHub Pages: the pages, plus the two drop-in
 * scripts and the reference. Run after `npm run build`.
 */
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const out = join(root, 'site-dist');
const bundles = [
	['packages/editor/dist/editor.iife.js', 'editor.js'],
	['packages/play/dist/play.iife.js', 'play.js']
];
for (const [from] of bundles) {
	if (!existsSync(join(root, from))) {
		console.error(`${from} is missing: run "npm run build" first.`);
		process.exit(1);
	}
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(join(root, 'site'), out, { recursive: true });
for (const [from, to] of bundles) cpSync(join(root, from), join(out, to));
for (const name of ['REFERENCE.md', 'REFERENCE.de.md']) {
	cpSync(join(root, 'docs', name), join(out, name));
}
// Plain files, no Jekyll.
writeFileSync(join(out, '.nojekyll'), '');
console.log(`Demo site written to ${out}`);
