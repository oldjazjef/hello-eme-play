# hello-eme-play

Turns any website into a game, configured by **one JSON**: top-down or side-scroller, stats for the
figure, monsters and vehicles, items, upgrades and triggers. A Payload plugin edits that JSON in the
CMS.

> Status: skeleton. The roadmap is in [docs/PLAN.md](docs/PLAN.md); the current game mode still lives
> in [hello-eme](https://github.com/oldjazjef/hello-eme) as `@hello-eme/page-game` and moves here in M1.

| Package                                       | Purpose                                          |
| --------------------------------------------- | ------------------------------------------------ |
| [`@hello-eme/play`](packages/play)            | Browser runtime and drop-in script               |
| [`@hello-eme/play-core`](packages/core)       | Game logic without a DOM (entities, events, RNG) |
| [`@hello-eme/play-schema`](packages/schema)   | JSON types, validation, defaults, migrations     |
| [`@hello-eme/play-payload`](packages/payload) | Payload CMS plugin                               |

## Develop

```sh
npm install
npm run verify   # format check + lint + check + test + build
```

Node 22. Nx + npm workspaces. Commits follow Conventional Commits (commitlint, husky). Changes to a
published package need a changeset: `npm run changeset`.

## License

MIT
