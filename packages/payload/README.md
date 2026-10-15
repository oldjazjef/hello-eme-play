# @hello-eme/play-payload

Payload CMS plugin for [`@hello-eme/play`](../play): adds the global `play` with the game's JSON
configuration (validated). The schema-driven form arrives with milestone M4.

```ts
import { playPlugin } from '@hello-eme/play-payload';

export default buildConfig({ plugins: [playPlugin()] });
```
