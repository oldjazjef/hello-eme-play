# @hello-eme/play-core

The game logic of [`@hello-eme/play`](../play) without a DOM: a world of bodies with stats, systems
(input, movement, AI, spawner, items, triggers, levels), a typed event bus and seeded randomness
(`mulberry32`). The world lives in page coordinates and talks to the page through a `Host`;
`createStaticHost` gives tests and simulations a fake page.

```ts
import { createWorld, createStaticHost } from '@hello-eme/play-core';

const world = createWorld({}, { host: createStaticHost(), seed: 1 });
world.start();
world.step(1 / 60);
```

Stats: damage = attack · power · 100 / (100 + defense); crit chance = luck / (luck + 200) and doubles damage;
evade chance = dex / (dex + 300); cooldowns shrink by `1 + dex / 100`.
