// A tiny static file server for the e2e tests (no dependency): serves the repository root.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const port = Number(process.env.PORT ?? 4173);

createServer(async (request, response) => {
	const path = normalize(decodeURIComponent(new URL(request.url ?? '/', 'http://x').pathname));
	const file = join(root, path);
	if (!file.startsWith(root)) {
		response.writeHead(403).end();
		return;
	}
	try {
		const body = await readFile(file);
		response.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
		response.end(body);
	} catch {
		response.writeHead(404).end();
	}
}).listen(port, () => console.log(`http://localhost:${port}`));
