# @hello-eme/play-schema

The JSON configuration of [`@hello-eme/play`](../play): types, defaults, validation and migrations. No DOM.

```ts
import { configProblems, migrate, resolveConfig } from '@hello-eme/play-schema';

const problems = configProblems(json); // readable messages for editors
const config = resolveConfig(migrate(json)); // complete and corrected
```
