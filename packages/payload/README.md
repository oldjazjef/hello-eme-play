# @hello-eme/play-payload

Payload CMS 3 plugin for [`@hello-eme/play`](../play): adds the global `play` with the game's JSON
configuration and an admin editor generated from the schema (`PLAY_SCHEMA` in `@hello-eme/play-schema`).

## Install

```sh
npm install @hello-eme/play-payload
```

Peer dependencies: `payload`, `@payloadcms/ui`, `react`.

```ts
// payload.config.ts
import { playPlugin } from '@hello-eme/play-payload';

export default buildConfig({
	plugins: [playPlugin({ mediaCollection: 'media' })]
});
```

Then run `payload generate:importmap` once: the editor is a client component registered as
`@hello-eme/play-payload/client#PlayConfigField` (the same convention as other Payload plugins).

Websites read the global like any other: `GET /api/globals/play` gives `{ config }`, which goes
to `createPlay({ config })`.

## Options

| Option            | Default         | What                                                                   |
| ----------------- | --------------- | ---------------------------------------------------------------------- |
| `slug`            | `play`          | Slug of the global                                                     |
| `group`           | -               | Admin navigation group                                                 |
| `access.read`     | everyone        | Who reads (the website needs it, no secrets in it)                     |
| `access.update`   | logged-in users | Who changes it                                                         |
| `mediaCollection` | `media`         | Upload collection the picture picker lists                             |
| `previewUrl`      | -               | A page that loads the game with `data-preview`; shown next to the form |
| `supportUrl`      | -               | A "Buy me a coffee" page; the editor shows a link to it in its toolbar |
| `disabled`        | `false`         | Hides the global but keeps the database schema                         |

## The editor

The editor is [`@hello-eme/play-editor`](../editor), the same component that runs without a CMS; this plugin
wires it to the Payload form value, the media collection (pictures picked from it, dropped images uploaded to it)
and the admin language. It brings quick settings, presets, a balance check, the full form, a flow view, a guide,
undo and redo, and a raw JSON tab; see that package's README.

- **Only edits are stored.** A value is written once an editor changes it; every field has a reset
  button that removes it again, so defaults (and future default changes) keep applying.
- **Problems** (`configProblems`) are shown at their field. Saving is blocked only when the value is
  no JSON object: `resolveConfig` fixes the rest when the game loads.
- **Live preview**: set `previewUrl` to a page that loads the game with `data-preview="<admin origin>"`.
