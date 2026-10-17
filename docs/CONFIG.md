# Configuration

One JSON, every key optional. [REFERENCE.md](REFERENCE.md) lists every setting, event, action, condition and key (generated from the schema; also in the editor's Guide tab). Missing values get defaults, invalid ones are corrected
(`resolveConfig`), `configProblems` explains what would be corrected. Editors can use
`@hello-eme/play-schema/play.schema.json` for autocompletion. The settings below are the top-level keys;
the Payload form or the JSON Schema list every field with bounds.

| Key                   | What it holds                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| `view`                | `mode` (`topdown` / `side`), gravity, jump speed, platform selector                              |
| `game`                | played entity, lives, page wrap, overrun speed, points per broken element                        |
| `stats`               | stat ids (`hp`, `attack`, `defense`, `dex`, `speed`, `luck` …) with label, min, max              |
| `entities`            | figure, monsters, vehicles: `kind`, stats, `behavior`, `moves`, `reward`, `boss`, sprite         |
|                       | bosses also `phases`: `below` (% health), `label`, `stats`, `do` actions                         |
|                       | vehicles also `drive` (handling), `ram` (damage to monsters), `absorbs` (takes the hits)         |
| `moves`               | attacks: keys, power, reach, cooldown, push, `breaks`, where usable                              |
| `items`, `itemSpawns` | pickups and when they appear; `do` is a list of actions                                          |
| `throwables`          | bombs, rocks, mines, balls (`catch`): keys, speed, fuse, radius, power, ammo, where usable       |
| `hideouts`            | tall grass, bushes, a pond, rocks where monsters (`hideIn`) hide until you walk through          |
| `upgrades`            | shop entries: cost, levels, stats added, optional actions                                        |
| `spawns`              | which monster, how often (`every`), how many (`count`), `max`, level range, scaling              |
| `waves`               | timed scripts: level range, `after`, `steps` (`at`, `every`, `repeat`, `do` actions)             |
| `triggers`            | `on` event, `only`, `keys` (for `key`), `conditions`, `do` actions                               |
| `pages`               | `{ match, config }`: other settings for some pages (path pattern, partial JSON)                  |
| `levels`              | label, view, goal (`score`, `kills`, `survive`, `boss`)                                          |
| `visits`              | a vehicle that drives in by itself                                                               |
| `keys`, `hint`        | keyboard bindings (`keys.hint`: show/hide the instructions), hint timeout, `hint.pauseWhileOpen` |
| `audio`, `progress`   | synth sounds by id, event → sound, high score storage                                            |
| `texts`               | UI texts (empty: the default of `locale`)                                                        |

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

## The instructions panel

It is open at the start and folds away after `hint.hideAfter` seconds. The visitor can hide and show it with its
button or the key `keys.hint` (default `I`; `hint.pauseWhileOpen` makes the game wait while it is open). Once the
visitor has shown or hidden it themselves it **stays as they left it**: it no longer folds away by itself and does
not pop up again. (Next to a vehicle it reminds once, if nobody touched it.) The panel has no exit button: leave the
game with Esc or the page's own game button.

## Throwables and vehicles

A **throwable** is something the figure throws or drops that then goes off: a bomb, a rock, a mine. It is
defined in `throwables` and used with its `keys` (touch screens get a button with the ammo left).

- `speed` is the launch speed in px/s; `0` drops it on the spot. From above it slows down and flies about
  `speed ÷ 3` px, in the side view it flies in an arc and falls. A vehicle's own speed comes on top, and
  `direction: "back"` drops it out of the rear (mines from a car).
- `fuse` is the time until it goes off. `0` means no fuse: it goes off when it touches a monster, lands or
  comes to rest. A dropped mine (`speed: 0`, `fuse: 0`) only goes off for a monster. With a fuse and in the side
  view it bounces (`bounce`).
- `power` multiplies the figure's `attack` (defense softens it), `radius` is the blast, `push` the knockback,
  `breaks` lets the blast crack page elements, `hurtsFigure` makes it dangerous for the thrower too.
- `ammo` is the starting supply, `maxAmmo` the most the figure carries, `unlimited` never runs out. Items,
  triggers and upgrades refill it with the action `{ "do": "ammo", "throwable": "bomb", "amount": 3 }`.
- `where` says whether it works on foot, in a vehicle or both.

```json
{
	"throwables": {
		"bomb": { "label": "Bomb", "keys": ["KeyG"], "ammo": 5, "fuse": 2, "radius": 110, "power": 5 },
		"mine": {
			"keys": ["KeyM"],
			"look": "mine",
			"where": "vehicle",
			"direction": "back",
			"speed": 0,
			"fuse": 0
		}
	},
	"items": {
		"bombs": { "look": "bolt", "do": [{ "do": "ammo", "throwable": "bomb", "amount": 3 }] }
	},
	"itemSpawns": [{ "item": "bombs", "max": 2 }]
}
```

## Objects: items with properties

An item with `"pickup": "none"` can't be picked up: it stays on the page as an **object**, and its properties act on
whatever touches it (the figure, its vehicle, monsters, the team):

- `solid`: blocks the way. Figures, monsters and vehicles walk up to it and no further (wall, tree, crate,
  barricade). In the side view only the sides block.
- `hides`: whatever stands in it is covered: monsters inside are invisible, the figure inside is drawn faint, and
  monsters farther than 90 px no longer see it, so chasers wander instead (bush, tent, curtain).
- `damage` and `damageWho`: health lost per second by touching it (`figure` = the figure or its vehicle and its team,
  `monsters`, or `all`). A negative number heals (a spring), a positive one hurts (spikes, lava, barbed wire). A
  vehicle that `absorbs` takes it instead of the figure.
- `look`: `wall`, `spikes`, `bush` and `puddle` are built-in pictures for objects; `sprite` is better.
- `itemSpawns[].initial`: that many lie spread over the whole page from the start of the level (never on the figure).

```json
{
	"items": {
		"tree": { "pickup": "none", "lifetime": 0, "look": "bush", "size": 70, "solid": true },
		"thorns": {
			"pickup": "none",
			"lifetime": 0,
			"look": "spikes",
			"size": 50,
			"damage": 6,
			"damageWho": "all"
		},
		"spring": { "pickup": "none", "lifetime": 0, "look": "puddle", "size": 74, "damage": -12 }
	},
	"itemSpawns": [
		{ "item": "tree", "initial": 14 },
		{ "item": "thorns", "initial": 5 },
		{ "item": "spring", "initial": 2 }
	]
}
```

An object can also **do something when the figure touches it**: its `do` actions run (not more often than `every`
seconds), the world sends the event `touch`, and triggers can listen (`only` = the item id). A door that switches
the view, a trap that spawns monsters, a shrine that heals the team.

Objects (and every item) take a `sprite` like anything else: assign a picture from the library, with the frames of
`idle` playing. Hideouts take a `sprite` as well (several of it are spread over the patch instead of the built-in
grass, bushes, pond or rocks).

All ten example games lay objects out this way.

## Triggers: events, conditions, actions

Everything above can be hooked into triggers (`on`, `only`, `conditions`, `do`; the editor's Triggers tab and Flow view
know them all):

| Event              | `only`         | When                                        |
| ------------------ | -------------- | ------------------------------------------- |
| `throw`, `explode` | throwable id   | something was thrown or dropped / went off  |
| `breed`            | parent entity  | a monster had young                         |
| `wreck`            | vehicle entity | a vehicle was destroyed                     |
| `catch`, `escape`  | monster entity | a ball caught a monster / it broke free     |
| `encounter`        | monster entity | a hidden monster jumped out                 |
| `evolve`           | monster entity | a monster got a level or evolved            |
| `faint`, `summon`  | monster entity | a team member fainted / was called          |
| `touch`            | item id        | the figure touched an object with an effect |

| Condition | Holds when                                                       |
| --------- | ---------------------------------------------------------------- |
| `ammo`    | the figure has at least `min` of a throwable                     |
| `team`    | the team has at least `min` members                              |
| `riding`  | the figure sits in a vehicle (`entity`: in that kind of vehicle) |

| Action      | Does                                                                                                        |
| ----------- | ----------------------------------------------------------------------------------------------------------- |
| `ammo`      | gives (or takes) throwables                                                                                 |
| `recruit`   | adds a monster to the team                                                                                  |
| `healParty` | heals the team by a percent (100 also revives)                                                              |
| `callTeam`  | sends out the next team member                                                                              |
| `hazard`    | sets off a throwable as a trap (at the figure, near it or at the edge); it hurts the figure, never monsters |

```json
{
	"triggers": [
		{ "on": "touch", "only": "shrine", "do": [{ "do": "healParty", "amount": 100 }] },
		{
			"on": "key",
			"keys": ["KeyT"],
			"conditions": [{ "if": "ammo", "throwable": "bomb", "min": 1 }],
			"do": [{ "do": "hazard", "throwable": "bomb", "where": "near" }]
		},
		{ "on": "wreck", "do": [{ "do": "message", "text": "Schrott!" }] }
	]
}
```

## Catching monsters, a team, hideouts (Ememons)

You can play a Pokémon-style game with this:

- **Balls**: a throwable with `catch` (1–100) hurts nothing, it tries to catch the monster it touches. The chance
  is `catch × catchRate ÷ 100 × (1 − 0.6 × health share)`: weak monsters are easy, and an entity with
  `catchRate: 0` (a boss) can't be caught at all. `game.partySize` limits the team. Item, trigger and upgrade
  actions fill balls up (`ammo`).
- **The team**: a caught monster joins the team. `keys.party` (R) sends out the next healthy member (and calls
  the one that is out back); it follows the figure, fights the nearest monster and is fought back, so monsters near
  it attack it instead of the figure. At 0 health it faints and goes back into the team (event `faint`). The
  action `healParty` heals everyone by a percent (100 also revives); `recruit` adds a monster to the team
  (a starter or a pet). Team members level up by beating monsters (`evolve.kills`) and can evolve into another
  entity (`evolve.into`); the HUD lists the team.
- **Hideouts**: `hideouts` are patches scattered over the page (`look`: tall grass, bush, pond, rocks; `count`,
  `radius`). An entity with `hideIn` spawns hidden inside one of that kind: invisible, out of the fight, not
  hit by blasts. While the figure walks through the patch it jumps out with the hideout's `encounter` chance per
  second (event `encounter`). The patches sway when something moves in them or hides there.
- **Trigger events** `catch`, `escape` (the monster broke free), `encounter`, `evolve` and `faint`, with `only` =
  the entity, for messages, points or sounds (`audio.events`).
- **Pictures**: a sprite with `"rotate": false` stays upright and only mirrors (people and creatures seen from the
  front).

```json
{
	"game": { "partySize": 6 },
	"hideouts": {
		"grass": { "look": "grass", "count": 22, "radius": { "min": 70, "max": 130 }, "encounter": 55 }
	},
	"throwables": {
		"ball": { "keys": ["KeyG"], "catch": 40, "speed": 560, "fuse": 0, "radius": 0, "ammo": 8 }
	},
	"entities": {
		"rattly": {
			"kind": "monster",
			"hideIn": "grass",
			"catchRate": 90,
			"evolve": { "kills": 3, "maxLevel": 1, "into": "ratking" }
		}
	},
	"triggers": [{ "on": "catch", "do": [{ "do": "points", "amount": 100 }] }]
}
```

### Ten example games

The presets `game-*` are complete games with pictures (made as small SVGs inside the JSON, nothing to download),
loadable in the editor with "Try it" and playable right away:

| Preset           | What                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| `game-ememons`   | Pokémon-style: wild Ememons hide in grass, bushes, pond and rocks; catch, team, evolve, gym boss  |
| `game-bombastic` | Bomberman-style: drop, throw and mega bombs, robots that throw back, the Bomber King              |
| `game-roadrage`  | five vehicles (banger, race car, moped, truck, tank) with different handling; run-overs and mines |
| `game-zombies`   | spores breed and evolve into zombies, brutes and tyrants; fire bottles, three nights              |
| `game-slimes`    | slimes breed and grow; salt bombs; the Slime King                                                 |
| `game-pagio`     | side-scroller: platforms, coins, fireballs that bounce, koopas, the dragon king                   |
| `game-dungeon`   | RPG: sword and shield bash, a wolf pup (team) that evolves, shop, four floors and a dragon        |
| `game-laststand` | wave defense: scripted waves, mines, grenades, throwing monsters, the Overlord                    |
| `game-safari`    | catching without fighting: critters hide and flee, nets, rare ones are worth more                 |
| `game-derby`     | vehicle battle: four vehicles that take hits and get wrecked, bombs forward, mines backward       |

**Monsters throw too**: list what a monster throws in its entity's `throws` (`throwable`, `range`: throws when the
figure is closer than that, `cooldown`). It aims at the figure (or its vehicle) and the throwable lands on it when
it can fly that far. A monster's blast hurts the figure (using the monster's `attack`) and never other monsters;
it needs no ammo, and `where`, `ammo` and `keys` don't apply. The first throw comes two seconds after it appears.

```json
{
	"entities": {
		"bomber": {
			"kind": "monster",
			"behavior": "wander",
			"throws": [{ "throwable": "bomb", "range": 420, "cooldown": 5 }]
		}
	}
}
```

**Monsters that breed and evolve** (the [swarm preset](../packages/schema/src/presets.ts)):

- `breed`: `every` (seconds between litters, `max: 0` never), `count` (young per litter), `max` (no litter while
  this many of the young's kind are alive, so the page isn't overrun) and `into` (what the young are; empty:
  the same kind). The young appear next to the parent. Never more than 250 bodies exist at once.
- `evolve`: a new level every `every` seconds alive and/or after `hits` hits on the figure, up to `maxLevel`.
  Each level adds `stats` (`hp` heals by the same amount) and `size` px. At the top level it can turn into
  another entity (`into`, at full health, starting again at level 0).

```json
{
	"entities": {
		"blob": {
			"breed": { "every": { "min": 12, "max": 20 }, "max": 12 },
			"evolve": {
				"every": 25,
				"maxLevel": 3,
				"stats": { "hp": 1, "attack": 2 },
				"size": 6,
				"into": "brute"
			}
		}
	}
}
```

The world sends `breed` and `evolve` events (e.g. `audio.events`).

**Vehicles** are entities of `kind: "vehicle"`; any number of kinds can exist side by side, spawned by a `spawns`
rule, a `spawn` action or `visits`. What makes them different:

- `stats`: `speed`, `accel`, `handling` (steering), `hp`, `attack`, `defense`.
- `drive`: how it feels, seen from above: `reverse` top speed, `brake`, `roll` (rolling out), `grip` and
  `slideGrip` (a low grip slides), `maxDrift`, `handbrakeTurn`, `handbrakeDrag`. The defaults are the car's.
- `ram`: `power` multiplies the damage to monsters it runs into (which also grows with its speed), `minSpeed`
  is the speed it starts to hurt from (`0`: `game.overrunSpeed`).
- `absorbs`: while the figure sits inside, monsters hurt the vehicle instead (its `hp`, `defense`, `dex`). At 0
  health it is wrecked, goes off like a bomb (a flash) and the figure gets out.
- `size` and `sprite` change how it looks; the built-in picture is the car.

A fast, light bike and a slow, tough truck: [arsenal preset](../packages/schema/src/presets.ts).

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
