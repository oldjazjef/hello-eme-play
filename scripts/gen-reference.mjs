/**
 * Writes the configuration reference (docs/REFERENCE.md, docs/REFERENCE.de.md) from the schema.
 * Run `npm run docs` after changing `packages/schema/src/schema.ts`; a test fails when they are stale.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { referenceMarkdown } from '@hello-eme/play-schema';

const docs = join(import.meta.dirname, '..', 'docs');
writeFileSync(join(docs, 'REFERENCE.md'), referenceMarkdown('en'));
writeFileSync(join(docs, 'REFERENCE.de.md'), referenceMarkdown('de'));
console.log('docs/REFERENCE.md and docs/REFERENCE.de.md written');
