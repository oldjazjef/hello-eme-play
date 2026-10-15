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

One file with a `version`. Everything is optional. Top-level keys: `view`, `stats`, `entities`,
`spawns`, `levels`, `items`, `upgrades`, `triggers`, `input`, `ui`, `texts`, `sprites`, `audio`.
The skeleton implements `view`, `stats`, `entities` and `spawns` (see `packages/schema`).

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

- Ons: `item.picked`, `enemy.killed`, `points.reached`, `level.up`, `timer`, `vehicle.entered`,
  `element.broken`, `health.low`.
- Conditions: stat comparison, level, perspective, chance, times fired.
- Actions: `spawn`, `setView`, `modifyStat`, `grantItem`, `setConfig`, `message`, `sound`, `emit`, `end`.

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

1. **M0 Repo**: monorepo, CI, changesets, license. _Done: this skeleton._
2. **M1 Extraction**: move the game mode of hello-eme into `core`/`play`, behavior unchanged; migration
   from the old JSON. _Accept:_ hello-eme runs on the published packages, e2e green.
3. **M2 Entities and stats**: entity definitions with stats, spawn rules, levels and scaling.
   _Accept:_ today's game is built from JSON alone.
4. **M3 Items, upgrades, triggers**: event bus, triggers with conditions and actions, upgrade shop.
5. **M4 Payload plugin v2**: schema-driven form, trigger builder, sprite library, preview.
6. **M5 Side-scroller**: perspective module with platforms and gravity; `setView` at runtime.
7. **M6 Polish**: sound, progress, bosses, accessibility, performance budget, docs, examples.
8. **M7 `play-sim`**: headless balancing; can start in parallel from M3.

## Open decisions

- Project and npm organisation name: `@hello-eme/play` is set; the rest follows it.
- How much physics in the side-scroller (platforms from page elements to start).
- Progress and high score only in the browser, or also to the CMS?
- Keep the old game-mode JSON readable for good (migration) or allow it to break?
