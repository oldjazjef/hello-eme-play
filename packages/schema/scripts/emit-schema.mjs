// Writes the configuration as JSON Schema next to the build, for editors' autocompletion:
// { "$schema": "https://unpkg.com/@hello-eme/play-schema/dist/play.schema.json" }
import { writeFile } from 'node:fs/promises';
import { playJsonSchema } from '../dist/index.js';

await writeFile(
	new URL('../dist/play.schema.json', import.meta.url),
	`${JSON.stringify(playJsonSchema(), null, '\t')}\n`
);
