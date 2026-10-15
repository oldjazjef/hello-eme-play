# hello-eme-play

Turns any website into a game, configured by **one JSON**: top-down or side-scroller, stats for the
figure, monsters and vehicles, items, upgrades, triggers, levels and sounds. A Payload plugin edits that
JSON in the CMS.

> Status: all milestones M1 to M7 of [docs/PLAN.md](docs/PLAN.md) are implemented. Packages come as GitHub
> release tarballs; not yet done: publishing to npm and switching [hello-eme](https://github.com/oldjazjef/hello-eme) from `@hello-eme/page-game`.

| Package                                       | Purpose                                                              |
| --------------------------------------------- | -------------------------------------------------------------------- |
| [`@hello-eme/play`](packages/play)            | Browser runtime and drop-in script                                   |
| [`@hello-eme/play-core`](packages/core)       | Game logic without a DOM (entities, events, RNG)                     |
| [`@hello-eme/play-schema`](packages/schema)   | The JSON as data: defaults, validation, migrations, JSON Schema      |
| [`@hello-eme/play-payload`](packages/payload) | Payload CMS plugin that renders the schema as a form                 |
| [`@hello-eme/play-sim`](packages/sim)         | Headless bots for balancing (`play-sim`)                             |
| [`examples/static`](examples/static)          | A plain HTML page with the game and Playwright tests (not published) |

## Try it

```sh
npm install && npm run build
node examples/static/serve.mjs      # open the printed URL, press "Play"
npx play-sim preset:arcade --rounds 20 --bot brawler   # balance check without a browser
```

Presets (`PRESETS` in the schema package): `classic`, `arcade` (levels, items, upgrades, a boss),
`platformer` (side view) and `view-switch` (an item changes the view). The full JSON Schema for editor
autocompletion is published as `@hello-eme/play-schema/play.schema.json`. See [docs/CONFIG.md](docs/CONFIG.md).

## Install

From npm once published, or without npm from a GitHub release: [docs/INSTALL.md](docs/INSTALL.md).

## Develop

```sh
npm install
npm run verify   # format check + lint + check + test + build
npm run e2e      # Playwright against the example page (needs chromium)
```

Node 22. Nx + npm workspaces. Commits follow Conventional Commits (commitlint, husky). Changes to a
published package need a changeset: `npm run changeset`.

## License

MIT
