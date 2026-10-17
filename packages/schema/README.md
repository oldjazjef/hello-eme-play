# @hello-eme/play-schema

The JSON configuration of [`@hello-eme/play`](../play) as **data**: `PLAY_SCHEMA` is a tree of nodes (number,
select, record, list, union, ref …) with defaults, bounds and labels. `resolveConfig`, `configProblems`,
the JSON Schema and the Payload form all read that tree, so a new setting is one line in `schema.ts`. No DOM.

```ts
import { configProblems, migrate, resolveConfig, PRESETS } from '@hello-eme/play-schema';

const problems = configProblems(json); // readable messages for editors
const config = resolveConfig(migrate(json)); // complete and corrected
const arcade = PRESETS.arcade;
```

`PRESETS` also holds ten complete example games (`game-*`) with pictures: SVGs inside the JSON, so they load and play
with nothing else. Their generator is `src/games/art.ts` (creatures, people, vehicles and icons as `data:` addresses).

`dist/play.schema.json` (export `@hello-eme/play-schema/play.schema.json`) is the JSON Schema for editor
autocompletion. A JSON without `version`, or from `@hello-eme/page-game`, is migrated by `migrate`.
