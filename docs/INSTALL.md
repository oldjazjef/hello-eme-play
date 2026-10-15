# Install without npm

Every release (tag `vX.Y.Z`) has the packages as tarballs on its
[GitHub releases page](https://github.com/oldjazjef/hello-eme-play/releases). They depend on each other
through the same release, so one install command is enough. Replace `0.1.0` with the version you want.

```sh
BASE=https://github.com/oldjazjef/hello-eme-play/releases/download/v0.1.0

# The engine (also pulls in play-core and play-schema)
npm install $BASE/hello-eme-play-0.1.0.tgz

# The Payload plugin (also pulls in the editor)
npm install $BASE/hello-eme-play-payload-0.1.0.tgz

# The editor without Payload (React component; the script below needs no install)
npm install $BASE/hello-eme-play-editor-0.1.0.tgz
```

`package.json` then holds the release URL, so `npm install` and `npm ci` keep working and the version
stays pinned. To update, install the newer release URL. The repository is public, so no token is needed.

Without a bundler, load the script of the release:

```html
<script
	src="https://github.com/oldjazjef/hello-eme-play/releases/download/v0.1.0/play.js"
	data-config-url="/play.json"
	defer
></script>
```

The configuration editor has a script too, `editor.js` (React included), which puts `PlayEditor.mount` on the page.

(GitHub sends release files as downloads, so for a live site copy `play.js` and `editor.js` to your own host.)

Also attached: `hello-eme-play-schema` (types, validation, presets), `hello-eme-play-core` and
`hello-eme-play-sim` (`play-sim` bots).

## Make a release

On GitHub: **Actions → Release → Run workflow** on `main`. Pick `patch`, `minor` or `major` (or type an exact
version): the workflow creates the next tag `vX.Y.Z` itself, builds, packs with `scripts/pack-release.mjs` and
publishes the release. Pushing a tag by hand (`git tag v0.2.0 && git push origin v0.2.0`) works too.

## Why not GitHub Packages?

GitHub's npm registry only accepts packages whose scope is the name of the GitHub user or organisation
(`@oldjazjef/…`), and it needs a token even to read public packages. Release tarballs avoid both.
If you want the `@hello-eme` scope in a registry anyway, publish to npm (`npx changeset publish`).
