# Configuration

One JSON, every key optional. [REFERENCE.md](REFERENCE.md) lists every setting, event, action, condition and key (generated from the schema; also in the editor's Guide tab). Missing values get defaults, invalid ones are corrected
(`resolveConfig`), `configProblems` explains what would be corrected. Editors can use
`@hello-eme/play-schema/play.schema.json` for autocompletion. The settings below are the top-level keys;
the Payload form or the JSON Schema list every field with bounds.

| Key                   | What it holds                                                                            |
| --------------------- | ---------------------------------------------------------------------------------------- |
| `view`                | `mode` (`topdown` / `side`), gravity, jump speed, platform selector                      |
| `game`                | played entity, lives, page wrap, overrun speed, points per broken element                |
| `stats`               | stat ids (`hp`, `attack`, `defense`, `dex`, `speed`, `luck` …) with label, min, max      |
| `entities`            | figure, monsters, vehicles: `kind`, stats, `behavior`, `moves`, `reward`, `boss`, sprite |
|                       | bosses also `phases`: `below` (% health), `label`, `stats`, `do` actions                 |
| `moves`               | attacks: keys, power, reach, cooldown, push, `breaks`, where usable                      |
| `items`, `itemSpawns` | pickups and when they appear; `do` is a list of actions                                  |
| `upgrades`            | shop entries: cost, levels, stats added, optional actions                                |
| `spawns`              | which monster, how often (`every`), how many (`count`), `max`, level range, scaling      |
| `waves`               | timed scripts: level range, `after`, `steps` (`at`, `every`, `repeat`, `do` actions)     |
| `triggers`            | `on` event, `only`, `keys` (for `key`), `conditions`, `do` actions                       |
| `pages`               | `{ match, config }`: other settings for some pages (path pattern, partial JSON)          |
| `levels`              | label, view, goal (`score`, `kills`, `survive`, `boss`)                                  |
| `visits`              | a vehicle that drives in by itself                                                       |
| `keys`, `hint`        | keyboard bindings, hint timeout                                                          |
| `audio`, `progress`   | synth sounds by id, event → sound, high score storage                                    |
| `texts`               | UI texts (empty: the default of `locale`)                                                |

## Sprite sheets and animations

A picture in `sprites` can be a sheet: `columns` × `rows` frames, numbered row by row from 0. `size` is the
longer side of **one** frame. `animations` lists the frames per state (`idle`, `walk`, `jump`, `hurt`,
`punch`, `kick`, `bite`); they loop with `fps`. An empty state plays `idle`, and if that is empty too, frame 0.
Items use `idle`. With reduced motion the first frame of each state stays.

```json
{
	"sprites": {
		"hero": {
			"url": "/media/hero-sheet.png",
			"size": 64,
			"columns": 4,
			"rows": 2,
			"fps": 10,
			"animations": { "idle": [0], "walk": [1, 2, 3, 2], "punch": [4, 5], "jump": [6] }
		}
	},
	"entities": { "hero": { "sprite": "hero" } }
}
```

## Cookbook

Stronger monsters each level:

```json
{ "spawns": [{ "entity": "blob", "scalePerLevel": 20, "max": 10 }] }
```

A star item that switches to the side view for good:

```json
{
	"items": { "star": { "look": "star", "do": [{ "do": "setView", "mode": "side" }] } },
	"itemSpawns": [{ "item": "star", "max": 1 }]
}
```

Switch between top-down and side-scroller every half minute ([view-switch.json](examples/view-switch.json)):
two `interval` triggers with a `view` condition each. The second one uses another period (37 s), so both never
fire in the same moment and flip the view straight back.

Bind keys to actions ([key-bindings.json](examples/key-bindings.json)): press B to spawn a blob, V to switch the
view, H to heal 20 (once the score is 50). A `key` trigger lists `KeyboardEvent.code` values in `keys` (the
editor has a "Press a key" button) and only fires while a round is playing, not for held-down repeats and not
while the visitor types in a form field. The game's own keys keep working, so a trigger can also hook onto one
of them; `Escape` always leaves the game and can't be bound. Touch screens have no keyboard.

```json
{
	"triggers": [
		{
			"on": "key",
			"keys": ["KeyB"],
			"do": [{ "do": "spawn", "entity": "blob", "count": 1, "where": "near" }]
		}
	]
}
```

A swarm when the visitor reaches 1000 points, once:

```json
{
	"triggers": [
		{
			"on": "interval",
			"every": 1,
			"once": true,
			"conditions": [{ "if": "score", "min": 1000 }],
			"do": [{ "do": "spawn", "entity": "blob", "count": 5, "where": "edge" }]
		}
	]
}
```

A wave script: three blobs at 10 s, a swarm of 8 at 25 s, the boss at 40 s, in every level from 2 on. Steps run
the same `do` actions as triggers; `at` counts from the wave's start (`after` seconds into the level), and a step
with `"repeat": 2, "every": 5` runs three times, five seconds apart. Each level of the range starts the script anew.

```json
{
	"waves": [
		{
			"fromLevel": 2,
			"steps": [
				{ "at": 10, "do": [{ "do": "spawn", "entity": "blob", "count": 3, "where": "edge" }] },
				{ "at": 25, "do": [{ "do": "spawn", "entity": "blob", "count": 8, "where": "edge" }] },
				{ "at": 40, "do": [{ "do": "spawn", "entity": "king" }] }
			]
		}
	]
}
```

Boss phases: each phase starts once, when the boss' health falls below `below` percent (several at once when one
hit skips them, highest first). `stats` are added for good (`hp` heals too), `label` is shown as a message. Only
for monsters with `"boss": true`.

```json
{
	"entities": {
		"king": {
			"boss": true,
			"phases": [
				{ "below": 50, "label": "Enraged!", "stats": { "attack": 10, "speed": 30 } },
				{ "below": 25, "do": [{ "do": "spawn", "entity": "blob", "count": 4 }] }
			]
		}
	}
}
```

Other settings per page: `/blog` top-down, `/projects` a side-scroller with other monsters. `match` is a glob on
`location.pathname` (`*` = any characters; `/blog/*` also matches `/blog`; trailing slash, query and hash don't
count). **Every** matching entry is merged over the base, in the order listed, later ones win (so `*` first sets
what all pages share). Objects merge key by key, lists and values are replaced, then the result is resolved like
any JSON. A page's `config` can't contain `pages`. The game follows the visitor (`popstate`, Navigation API); call
`play.setPath("/projects")` for routers it can't see. A changed configuration starts a fresh round.

```json
{
	"view": { "mode": "topdown" },
	"pages": [
		{
			"match": "/projects",
			"config": {
				"view": { "mode": "side" },
				"entities": { "bat": { "kind": "monster", "stats": { "hp": 3 } } },
				"spawns": [{ "entity": "bat" }]
			}
		}
	]
}
```

Balance with `npx play-sim ./play.json --bot brawler --rounds 20`.
