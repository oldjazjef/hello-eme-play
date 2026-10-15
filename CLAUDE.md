# hello-eme-play monorepo

Nx + npm workspaces. Node 22 (`.nvmrc`). Roadmap: `docs/PLAN.md`.

| Package                   | Path               | Notes                                                    |
| ------------------------- | ------------------ | -------------------------------------------------------- |
| `@hello-eme/play-schema`  | `packages/schema`  | JSON types, `resolveConfig`, `configProblems`, `migrate` |
| `@hello-eme/play-core`    | `packages/core`    | No DOM; world, events, seeded RNG                        |
| `@hello-eme/play`         | `packages/play`    | Browser runtime and drop-in `dist/play.js`               |
| `@hello-eme/play-payload` | `packages/payload` | Payload plugin                                           |

## Commands

`npm run verify` (before done), `npm run build|lint|check|test`, `npm run format`. Run tasks through Nx
(`npx nx run <project>:<target>`); `build` of a dependency runs first.

## Principles

- **KISS**, **SOLID**, type-safe end to end: `strict` + `noUncheckedIndexedAccess`, no `any`, no `!`
  (ESLint enforces it).
- **Everything is configurable by JSON** and the JSON is always validated: `resolveConfig` fixes nonsense,
  `configProblems` explains it. A new setting means: type + default + resolve + problems + test.
- `schema` and `core` never touch the DOM. Keep every package generic: no hello-eme specifics.
- Config changes that break old JSONs need a `SCHEMA_VERSION` bump and a step in `migrate.ts`.
- Bug fix means a failing test first.

## Git

Branches `feat/…`, `fix/…`, `chore/…`, `docs/…` off `main`; PRs into `main`. Conventional Commits with the
package as scope (`feat(core): …`). Hooks (husky) run lint-staged, commitlint and `nx affected`; don't
bypass them.
