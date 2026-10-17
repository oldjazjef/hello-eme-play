# @hello-eme/play-editor

The editor for the JSON configuration of [`@hello-eme/play`](../play). It is one React component with no CMS
inside, so it runs on any page and inside Payload ([`@hello-eme/play-payload`](../payload) is a thin wrapper
around it). The host only passes the JSON in and takes it out again.

## What is in it

- **Quick settings**: sliders and switches for what most people change (difficulty, speed, how many monsters).
  They write the same JSON as the full form.
- **Simple / Expert mode**: Simple shows quick settings and the guide; Expert shows every setting, flow and raw JSON.
- **Presets** as cards with a verdict, and **Try it** in the preview before you use one. The ten example games
  (`game-*`: Ememons, Bombastic, Road Rage …) and the eight arcade classics (`retro-*`: Asteroids, Frogger, Snake,
  Pac-Man, Breakout, Pong, a platformer, boss fights) are in there with their pictures.
- **Live preview**: the game running next to the form, playing every change (needs a preview page, see below).
- **Balance check**: a practice bot plays ten rounds in the editor ([`play-sim`](../sim)) and says easy / balanced / hard.
- **The full form**, generated from the schema: a new setting in `schema.ts` shows up here without editor code.
- **Problems at the field**: what `configProblems` found is shown under the field and on its section, and "Go to field" jumps there.
- **Flow**: what sets off what (triggers, item pickups, upgrades), where one leads on to another, loops, and
  triggers waiting for something that can't happen.
- **Pictures**: drop images onto the sprite library; sizes and sheets (a strip of square frames) are detected and
  warnings shown for tiny, huge or heavy files.
- **Guide**: every setting with type, default and bounds, plus events, actions, conditions and keys, searchable.
  The same content as [docs/REFERENCE.md](../../docs/REFERENCE.md).
- **Undo and redo** (also Ctrl/Cmd+Z), reset per tab, download, load and copy the JSON, raw JSON.

## On any page (no framework)

```html
<div id="editor"></div>
<script src="editor.js"></script>
<script>
	const editor = PlayEditor.mount(document.getElementById('editor'), {
		value: await (await fetch('/play.json')).json(), // or storageKey: 'my-draft'
		lang: 'en', // 'de' or 'en'; default: the browser's language
		onChange: (json) => save(json)
	});
	// editor.getValue(), editor.setValue(json), editor.destroy()
</script>
```

`editor.js` is attached to every release. It carries everything (React is inside, hidden; the game too, for the
preview), so there is nothing to install or set up. As a module: `import { mount } from '@hello-eme/play-editor'`.

Options: `value`, `onChange`, `lang`, `storageKey` (keeps a draft in `localStorage`), `defaultMode`
(`simple`/`expert`), `media`, `onUpload`, `previewUrl`, `previewHtml`, `preview: false`, `referenceUrl`,
`supportUrl`.

**Support link.** `supportUrl: 'https://buymeacoffee.com/<name>'` puts a "Buy me a coffee" (German: "Kaffee spendieren")
link into the toolbar. Only `http` and `https` addresses are shown; without the option there is no link. With Payload
set `supportUrl` in `playPlugin({ … })`.

**Live preview.** Out of the box the editor shows the game on a small sample page and restarts it on every
change. For the real thing give it a page of your own: `previewUrl: '/play-preview.html'`, a page that loads the
game with `data-preview="<origin of the editor page>"` (see the [play README](../play)); the editor shows it in an
iframe and sends it every change. `previewHtml` takes a complete HTML document instead.

**Pictures.** Without an `onUpload`, dropped pictures are embedded in the JSON as `data:` URLs. Pass
`onUpload(file) => url` to store them somewhere (Payload's media collection, S3 …).

`PlayEditor.mountGuide(element, { lang })` mounts only the guide, for a reference page.

A demo with the guide, the editor and the live preview is built from [site/](../../site) (GitHub Pages);
[examples/editor](../../examples/editor) is the smallest page.

## In React

```tsx
import { PlayEditor } from '@hello-eme/play-editor/react';

<PlayEditor value={json} onChange={setJson} lang="en" previewUrl="/play-preview.html" />;
```

Same options as above (`value` and `onChange` are required). It needs `react` >= 19 and, unlike the vanilla build,
uses your React and has no built-in preview unless you pass `previewHtml` (`previewDocument(playSource, origin)`
builds one from the game's script). The pieces (`NodeEditor`, `GuideView`, `runBalance`, `analyzeFlow`,
`applyQuick`, `guessSprite`) are exported for hosts that want their own layout.

[`@hello-eme/play-payload`](../payload) is this component wired to Payload.

## Theming

Everything uses CSS custom properties `--pe-*` set on the editor's root (`--pe-bg`, `--pe-text`, `--pe-border`,
`--pe-accent`, `--pe-radius` …, see `src/theme.ts`). Inside Payload they take the admin theme's values; elsewhere
they follow the visitor's light or dark scheme. Set any of them on a parent element to re-theme.

## How it is built

`NodeEditor` picks a component from `FIELDS` (`src/fields/registry.ts`) by the node's `type`; components get
`value` (as stored, `undefined` = default), `onChange` (`undefined` = remove), the dotted `path` and the `ctx`.
Everything that is not a component is a pure function with a test: `history.ts` (undo), `quick.ts`,
`balance.ts`, `flow.ts`, `problems.ts`, `sprites.ts`, `state.ts`.
