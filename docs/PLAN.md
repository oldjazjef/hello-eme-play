# Plan: the play engine

`@hello-eme/play` turns any website into a game, configured by **one JSON**. This is the roadmap
from the current game mode of hello-eme to a standalone engine. Open decisions are at the end.

## Goal

- Runs on any page (DOM + canvas, no framework). The page is the playing field; its elements are
  obstacles, platforms and targets.
- **Everything is JSON**: figure, monsters, vehicles, items, upgrades, spawns, levels, triggers and the
  perspective. No game value is hard-coded.
- **Two perspectives**: top-down and side-scroller, set in the JSON and switchable at runtime by a trigger.
- **Payload plugin**: shows the JSON as a form in the CMS, with a sprite library and validation.
- Out of scope: multiplayer, 3D, a full level editor, server-side saves.

## Packages

| Package                    | Purpose                                                                    |
| -------------------------- | -------------------------------------------------------------------------- |
| `@hello-eme/play-schema`   | JSON types, `resolveConfig`, `configProblems`, migrations between versions |
| `@hello-eme/play-core`     | Game logic without a DOM: entities, stats, systems, triggers, seeded RNG   |
| `@hello-eme/play`          | Browser runtime: input, canvas renderer, page adapter, touch, drop-in      |
| `@hello-eme/play-payload`  | Payload plugin: form from the schema, sprite library, preview              |
| `@hello-eme/play-sim` (M7) | Headless simulation for balancing and regression tests                     |

## Architecture

A small entity-component-system. Everything on the field is an entity with components (position,
stats, sprite, AI, inventory); systems work on them each frame (input, AI, movement per perspective,
collision, combat, vehicles, items, spawns, triggers, score). Every action emits a typed event
(`enemy.killed`, `item.picked`, `level.up`); triggers, statistics and analytics only listen. The
renderer switches with the perspective, the world does not notice. Goal: same seed and same inputs give
the same round.

## JSON

One file with a `version`. Everything is optional. Top-level keys: `view`, `game`, `stats`, `sprites`, `entities`,
`moves`, `items`, `upgrades`, `spawns`, `itemSpawns`, `visits`, `triggers`, `levels`, `keys`, `hint`, `audio`,
`progress`, `texts`. All implemented; reference in [CONFIG.md](CONFIG.md).

```json
{
	"version": 1,
	"view": { "mode": "topdown" },
	"stats": { "hp": { "label": "Leben", "min": 0, "max": 999 } },
	"entities": {
		"blob": {
			"kind": "monster",
			"stats": { "hp": 20, "attack": 5, "speed": 70 },
			"behavior": "chase",
			"reward": { "points": 100 }
		}
	},
	"spawns": [
		{
			"entity": "blob",
			"every": { "min": 12, "max": 30 },
			"count": { "min": 1, "max": 3 },
			"max": 8
		}
	]
}
```

## Items, upgrades, triggers

Items and upgrades do nothing themselves; they fire **triggers**, a trigger runs **actions**.

- Events (`on`): `start`, `interval`, `kill`, `hurt`, `death`, `levelUp`, `pickup`, `upgrade`, `break`,
  `enterVehicle`, `exitVehicle`, `viewChange`.
- Conditions: `level`, `score`, `view`, `health`, `chance`, `kills`.
- Actions (`do`): `spawn`, `setView`, `points`, `heal`, `stat`, `dropItem`, `nextLevel`, `message`, `sound`,
  `win`, `lose`.

This is what was built; the first draft named them differently (`item.picked`, `modifyStat`, …). Triggers
run at most 8 levels deep so two triggers cannot call each other forever.

"x monsters spawn" is `spawn`; "switch from top-down to side-scroller" is `setView`. Custom actions
can be registered in code.

## Perspectives

`view.mode` swaps movement, gravity, camera and sprite orientation. Stats, entities, items and
triggers stay the same. Top-down: free movement, no gravity, sprites seen from above and rotated.
Side: left/right, jump, gravity, page elements as platforms, sprites mirrored. Switching at runtime
keeps position and stats; each sprite can have a `topdown` and a `side` picture.

## Payload plugin

The form is derived from the JSON schema, not hand-written, so a new schema field shows up without
plugin code. Sections for stats, entities, spawns, levels, items, upgrades, triggers and the
perspective; a "when ... then ..." trigger builder; sprite library (PNG/SVG upload, kind, facing,
size); live preview; errors at the field; raw JSON, import/export and presets stay available.

## What else is needed

Schema versions and migrations; a published JSON Schema for editor autocompletion; win/lose and level
flow; bosses and wave scripts; progress and high score; sound; sprite sheets and animations;
accessibility (pause, reduced motion, keyboard, screen-reader hints); performance (object pools,
sprite atlas, frame budget); security (actions are data, never code; image hosts via CSP); an
extension API; an analytics adapter instead of a fixed Umami; deterministic tests; i18n; docs and a
cookbook; license and asset rules.

## Roadmap

Status: all done on branch `feat/scaffold`.

1. **M0 Repo**: monorepo, CI, changesets, license. _Done._
2. **M1 Extraction**: the game mode of hello-eme lives in `core`/`play`; `migrate` reads the old JSON.
   _Done in this repo. Still open: switch hello-eme itself to the packages (needs published packages)._
3. **M2 Entities and stats**: entity definitions with stats, spawn rules, levels and scaling. _Done: the
   classic game is the default JSON._
4. **M3 Items, upgrades, triggers**: event bus, triggers, conditions, actions, upgrade shop. _Done._
5. **M4 Payload plugin v2**: schema-driven form, presets, key capture, sprite picker from media, raw JSON.
   _Done; not yet tried in a running Payload admin._
6. **M5 Side-scroller**: gravity, platforms from page elements, `setView` at runtime. _Done._
7. **M6 Polish**: sound, high score, bosses, goals, reduced motion, keyboard shop, docs, example. _Done.
   Sprite sheets with animations per state came afterwards. Not done: object pools, analytics adapter._
8. **M7 `play-sim`**: bots and the `play-sim` CLI. _Done._

## Decisions taken

- Name: `@hello-eme/play`, packages `play-schema`, `play-core`, `play-payload`, `play-sim`. License MIT.
- Physics in the side view: gravity and platforms from page elements (selector in `view.platforms`);
  the floor is the bottom of the viewport.
- Progress and high score live in the browser (`localStorage`), not in the CMS.
- The old game-mode JSON stays readable for good: `migrate` turns it into hero, blob and car.
