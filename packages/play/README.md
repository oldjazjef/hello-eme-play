# @hello-eme/play

Turns any website into a game, configured by one JSON. See the [roadmap](../../docs/PLAN.md).

```ts
import { createPlay } from '@hello-eme/play';

const play = createPlay({ config: await (await fetch('/play.json')).json() });
play.start();
```

Without a bundler:

```html
<script src="play.js" data-config-url="/play.json" defer></script>
```
