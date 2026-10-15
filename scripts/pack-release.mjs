/**
 * Packs the published packages as tarballs for a GitHub release, so they can be installed without npm:
 * `npm install https://github.com/<owner>/<repo>/releases/download/v1.2.3/hello-eme-play-1.2.3.tgz`.
 *
 * The packages depend on each other, so inside the tarballs those dependencies point to the other
 * tarballs of the same release instead of to a registry.
 *
 *   node scripts/pack-release.mjs <version> <outDir> [baseUrl]
 *
 * `baseUrl` defaults to the release download URL of GITHUB_REPOSITORY (owner/repo).
 */
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const [version, outArg, baseArg] = process.argv.slice(2);
if (!version || !outArg) {
	console.error('Usage: node scripts/pack-release.mjs <version> <outDir> [baseUrl]');
	process.exit(1);
}

const repository = process.env.GITHUB_REPOSITORY ?? 'oldjazjef/hello-eme-play';
const base = (baseArg ?? `https://github.com/${repository}/releases/download/v${version}`).replace(
	/\/$/,
	''
);
const out = resolve(outArg);
mkdirSync(out, { recursive: true });

const root = resolve(import.meta.dirname, '..');
const folders = ['schema', 'core', 'play', 'payload', 'sim', 'editor'];
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const manifests = folders.map((folder) => readJson(join(root, 'packages', folder, 'package.json')));

/** `@hello-eme/play-core` becomes `hello-eme-play-core-1.2.3.tgz`, like `npm pack` names it. */
const tarball = (name) => `${name.replace(/^@/, '').replace('/', '-')}-${version}.tgz`;
const ours = new Map(manifests.map((manifest) => [manifest.name, tarball(manifest.name)]));

for (const [index, folder] of folders.entries()) {
	const manifest = structuredClone(manifests[index]);
	manifest.version = version;
	for (const field of ['dependencies', 'optionalDependencies']) {
		for (const name of Object.keys(manifest[field] ?? {})) {
			const file = ours.get(name);
			if (file) manifest[field][name] = `${base}/${file}`;
		}
	}
	// Only what is published goes into the tarball; scripts would run on the consumer's install.
	delete manifest.scripts;
	delete manifest.devDependencies;
	const staging = mkdtempSync(join(tmpdir(), `pack-${folder}-`));
	for (const entry of manifest.files ?? []) {
		cpSync(join(root, 'packages', folder, entry), join(staging, entry), { recursive: true });
	}
	writeFileSync(join(staging, 'package.json'), `${JSON.stringify(manifest, null, '\t')}\n`);
	execFileSync('npm', ['pack', '--pack-destination', out], { cwd: staging, stdio: 'inherit' });
}

// The drop-in scripts for plain websites: the game and its editor.
cpSync(join(root, 'packages/play/dist/play.iife.js'), join(out, 'play.js'));
cpSync(join(root, 'packages/editor/dist/editor.iife.js'), join(out, 'editor.js'));
console.log(`Packed ${folders.length} packages into ${out}`);
