# Configuration

One JSON, every key optional. Missing values get defaults, invalid ones are corrected
(`resolveConfig`), `configProblems` explains what would be corrected. Editors can use
`@hello-eme/play-schema/play.schema.json` for autocompletion. The settings below are the top-level keys;
the Payload form or the JSON Schema list every field with bounds.

| Key                   | What it holds                                                                            |
| --------------------- | ---------------------------------------------------------------------------------------- |
| `view`                | `mode` (`topdown` / `side`), gravity, jump speed, platform selector                      |
| `game`                | played entity, lives, page wrap, overrun speed, points per broken element                |
| `stats`               | stat ids (`hp`, `attack`, `defense`, `dex`, `speed`, `luck` …) with label, min, max      |
| `entities`            | figure, monsters, vehicles: `kind`, stats, `behavior`, `moves`, `reward`, `boss`, sprite |
| `moves`               | attacks: keys, power, reach, cooldown, push, `breaks`, where usable                      |
| `items`, `itemSpawns` | pickups and when they appear; `do` is a list of actions                                  |
| `upgrades`            | shop entries: cost, levels, stats added, optional actions                                |
| `spawns`              | which monster, how often (`every`), how many (`count`), `max`, level range, scaling      |
| `triggers`            | `on` event, `only`, `conditions`, `do` actions                                           |
| `levels`              | label, view, goal (`score`, `kills`, `survive`, `boss`)                                  |
| `visits`              | a vehicle that drives in by itself                                                       |
| `keys`, `hint`        | keyboard bindings, hint timeout                                                          |
| `audio`, `progress`   | synth sounds by id, event → sound, high score storage                                    |
| `texts`               | UI texts (empty: the default of `locale`)                                                |

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

Balance with `npx play-sim ./play.json --bot brawler --rounds 20`.
