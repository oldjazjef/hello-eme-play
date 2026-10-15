# @hello-eme/play

Turns any website into a game, configured by one JSON ([reference](../../docs/CONFIG.md)).

```ts
import { createPlay } from '@hello-eme/play';

const play = createPlay({ config: await (await fetch('/play.json')).json() });
play.start();
```

Without a bundler (`dist/play.iife.js`, also attached to releases as `play.js`):

```html
<script src="play.js" data-config-url="/play.json" defer></script>
```

`window.Play` is the controller (`start`, `stop`, `toggle`, `visit`, `configure`, `destroy`). A button with
`data-play-toggle` starts and stops the game. Page elements that carry `data-play-ui` are ignored by the
game. Old `@hello-eme/page-game` JSONs are migrated automatically.

Text, pictures and sounds of a changed config apply at once, everything else on the next round. The
high score and bought upgrades are stored in `localStorage` (`progress.save`). Styles are CSS classes
prefixed `play-` and custom properties `--play-*`. With `prefers-reduced-motion` the game does not shake.

The canvas carries `data-*` attributes (score, health, view, level, …) that tests can read.
