# Configuration reference

Every setting of the game, generated from the schema. All of them are optional: a setting you leave out
takes its default, and a value that is out of bounds is corrected when the game loads (`resolveConfig`).
The editor (`@hello-eme/play-editor`) shows the same settings as a form, with this guide next to it.

## Contents

- [Version](#version) (`version`)
- [Game enabled](#game-enabled) (`enabled`)
- [Language](#language) (`locale`)
- [View](#view) (`view`)
- [Rules](#rules) (`game`)
- [Stats](#stats) (`stats`)
- [Pictures](#pictures) (`sprites`)
- [Figures, monsters and vehicles](#figures-monsters-and-vehicles) (`entities`)
- [Moves](#moves) (`moves`)
- [Items](#items) (`items`)
- [Upgrades](#upgrades) (`upgrades`)
- [Monster spawns](#monster-spawns) (`spawns`)
- [Item spawns](#item-spawns) (`itemSpawns`)
- [Vehicle drives in](#vehicle-drives-in) (`visits`)
- [Triggers](#triggers) (`triggers`)
- [Levels](#levels) (`levels`)
- [Keys](#keys) (`keys`)
- [Instructions](#instructions) (`hint`)
- [Audio](#audio) (`audio`)
- [Progress](#progress) (`progress`)
- [Texts](#texts) (`texts`)
- [Events](#events)
- [Actions](#actions)
- [Conditions](#conditions)
- [Key codes and default keys](#key-codes-and-default-keys)

## Version

| Setting   | Type         | Default | Allowed | What it does |
| --------- | ------------ | ------- | ------- | ------------ |
| `version` | whole number | 1       | 1–1000  | Version      |

## Game enabled

| Setting   | Type   | Default | Allowed | What it does |
| --------- | ------ | ------- | ------- | ------------ |
| `enabled` | yes/no | true    |         | Game enabled |

## Language

| Setting  | Type   | Default | Allowed | What it does |
| -------- | ------ | ------- | ------- | ------------ |
| `locale` | choice | de      | de / en | Language     |

## View

| Setting                   | Type   | Default                                  | Allowed        | What it does              |
| ------------------------- | ------ | ---------------------------------------- | -------------- | ------------------------- |
| `view`                    | group  |                                          |                | View                      |
| `view.mode`               | choice | topdown                                  | topdown / side | View                      |
| `view.gravity`            | number | 1800                                     | 100–10000      | Gravity (px/s²)           |
| `view.jumpSpeed`          | number | 760                                      | 100–3000       | Jump speed (px/s)         |
| `view.platforms`          | group  |                                          |                | Platforms (side-scroller) |
| `view.platforms.selector` | text   | "h1, h2, h3, img, button, a, p, figure,… |                | Page elements to stand on |
| `view.platforms.minWidth` | number | 60                                       | 10–2000        | Minimum width (px)        |

## Rules

| Setting             | Type         | Default | Allowed    | What it does                          |
| ------------------- | ------------ | ------- | ---------- | ------------------------------------- |
| `game`              | group        |         |            | Rules                                 |
| `game.player`       | reference    | hero    | → entities | Played figure                         |
| `game.lives`        | whole number | 1       | 1–99       | Lives                                 |
| `game.wrap`         | yes/no       | true    |            | Continue at the other end of the page |
| `game.overrunSpeed` | number       | 140     | 0–5000     | Run over from (px/s)                  |
| `game.breakPoints`  | whole number | 10      | 0–1000000  | Points per broken element             |

## Stats

Which stats exist (health, attack …).

| Setting            | Type   | Default   | Allowed          | What it does                                 |
| ------------------ | ------ | --------- | ---------------- | -------------------------------------------- |
| `stats`            | map    | 8 entries | max 30           | Stats. Which stats exist (health, attack …). |
| `stats.<id>.label` | text   | (empty)   |                  | Name                                         |
| `stats.<id>.min`   | number | 0         | -1000000–1000000 | Lowest                                       |
| `stats.<id>.max`   | number | 9999      | -1000000–1000000 | Highest                                      |

## Pictures

| Setting                           | Type         | Default   | Allowed                  | What it does                                                                                       |
| --------------------------------- | ------------ | --------- | ------------------------ | -------------------------------------------------------------------------------------------------- |
| `sprites`                         | map          | 0 entries | max 100                  | Pictures                                                                                           |
| `sprites.<id>.url`                | text         | (empty)   |                          | URL (PNG, SVG, WebP …)                                                                             |
| `sprites.<id>.size`               | number       | 50        | 8–400                    | Longer side (px; of one frame for sheets)                                                          |
| `sprites.<id>.columns`            | whole number | 1         | 1–64                     | Sheet columns                                                                                      |
| `sprites.<id>.rows`               | whole number | 1         | 1–64                     | Sheet rows                                                                                         |
| `sprites.<id>.fps`                | number       | 8         | 1–60                     | Frames per second                                                                                  |
| `sprites.<id>.animations`         | group        |           |                          | Animations (frame numbers from 0, row by row). Empty: Idle; if that is empty too, the first frame. |
| `sprites.<id>.animations.idle`    | list         | 0 entries | max 64                   | Idle                                                                                               |
| `sprites.<id>.animations.idle[]`  | whole number | 0         | 0–4095                   | Frame no.                                                                                          |
| `sprites.<id>.animations.walk`    | list         | 0 entries | max 64                   | Walk                                                                                               |
| `sprites.<id>.animations.walk[]`  | whole number | 0         | 0–4095                   | Frame no.                                                                                          |
| `sprites.<id>.animations.jump`    | list         | 0 entries | max 64                   | Jump                                                                                               |
| `sprites.<id>.animations.jump[]`  | whole number | 0         | 0–4095                   | Frame no.                                                                                          |
| `sprites.<id>.animations.hurt`    | list         | 0 entries | max 64                   | Hurt                                                                                               |
| `sprites.<id>.animations.hurt[]`  | whole number | 0         | 0–4095                   | Frame no.                                                                                          |
| `sprites.<id>.animations.punch`   | list         | 0 entries | max 64                   | Punch                                                                                              |
| `sprites.<id>.animations.punch[]` | whole number | 0         | 0–4095                   | Frame no.                                                                                          |
| `sprites.<id>.animations.kick`    | list         | 0 entries | max 64                   | Kick                                                                                               |
| `sprites.<id>.animations.kick[]`  | whole number | 0         | 0–4095                   | Frame no.                                                                                          |
| `sprites.<id>.animations.bite`    | list         | 0 entries | max 64                   | Bite                                                                                               |
| `sprites.<id>.animations.bite[]`  | whole number | 0         | 0–4095                   | Frame no.                                                                                          |
| `sprites.<id>.facing`             | choice       | right     | right / down / left / up | Looks                                                                                              |

## Figures, monsters and vehicles

| Setting                               | Type         | Default   | Allowed                                | What it does                                                      |
| ------------------------------------- | ------------ | --------- | -------------------------------------- | ----------------------------------------------------------------- |
| `entities`                            | map          | 3 entries | max 100                                | Figures, monsters and vehicles                                    |
| `entities.<id>.kind`                  | choice       | monster   | figure / monster / vehicle             | Kind                                                              |
| `entities.<id>.label`                 | text         | (empty)   |                                        | Name                                                              |
| `entities.<id>.sprite`                | reference    | (none)    | → sprites (optional)                   | Picture                                                           |
| `entities.<id>.look`                  | choice       | enemy     | figure / enemy / car                   | Built-in look                                                     |
| `entities.<id>.size`                  | number       | 50        | 8–400                                  | Size (px)                                                         |
| `entities.<id>.stats`                 | map          | 0 entries | max 30                                 | Stats. Health, attack, defense, speed, dex, luck … (see “Stats”). |
| `entities.<id>.stats.<id>`            | number       | 0         | -1000000–1000000                       | Value                                                             |
| `entities.<id>.behavior`              | choice       | chase     | chase / wander / flee / stand / arrive | Behavior                                                          |
| `entities.<id>.moves`                 | list         | 0 entries | max 10                                 | Moves                                                             |
| `entities.<id>.moves[]`               | reference    | (none)    | → moves                                | Move                                                              |
| `entities.<id>.reward`                | group        |           |                                        | Reward                                                            |
| `entities.<id>.reward.points`         | whole number | 0         | 0–1000000                              | Points                                                            |
| `entities.<id>.reward.drops`          | list         | 0 entries | max 10                                 | Drops                                                             |
| `entities.<id>.reward.drops[].item`   | reference    | (none)    | → items                                | Item                                                              |
| `entities.<id>.reward.drops[].chance` | number       | 25        | 0–100                                  | Chance (%)                                                        |
| `entities.<id>.boss`                  | yes/no       | false     |                                        | Boss                                                              |

## Moves

| Setting               | Type      | Default   | Allowed                   | What it does          |
| --------------------- | --------- | --------- | ------------------------- | --------------------- |
| `moves`               | map       | 3 entries | max 50                    | Moves                 |
| `moves.<id>.label`    | text      | (empty)   |                           | Name                  |
| `moves.<id>.keys`     | keys      | (none)    |                           | Keys (figure only)    |
| `moves.<id>.power`    | number    | 1         | 0–100                     | Power (× attack)      |
| `moves.<id>.reach`    | number    | 30        | 4–400                     | Reach (px)            |
| `moves.<id>.cooldown` | number    | 0.3       | 0–60                      | Cooldown (seconds)    |
| `moves.<id>.seconds`  | number    | 0.22      | 0.05–5                    | Pose length (seconds) |
| `moves.<id>.push`     | number    | 260       | 0–5000                    | Knockback (px/s)      |
| `moves.<id>.breaks`   | yes/no    | true      |                           | Breaks page elements  |
| `moves.<id>.pose`     | choice    | punch     | punch / kick / bite       | Pose                  |
| `moves.<id>.sound`    | reference | (none)    | → audio.sounds (optional) | Sound                 |
| `moves.<id>.where`    | choice    | foot      | foot / vehicle / both     | Usable                |

## Items

| Setting               | Type           | Default   | Allowed                   | What it does                        |
| --------------------- | -------------- | --------- | ------------------------- | ----------------------------------- |
| `items`               | map            | 0 entries | max 100                   | Items                               |
| `items.<id>.label`    | text           | (empty)   |                           | Name                                |
| `items.<id>.sprite`   | reference      | (none)    | → sprites (optional)      | Picture                             |
| `items.<id>.look`     | choice         | star      | heart / star / gem / bolt | Built-in look                       |
| `items.<id>.size`     | number         | 30        | 8–200                     | Size (px)                           |
| `items.<id>.pickup`   | choice         | touch     | touch / use               | Pick up                             |
| `items.<id>.lifetime` | number         | 20        | 0–3600                    | Vanishes after (seconds, 0 = never) |
| `items.<id>.do`       | list           | 0 entries | max 20                    | Effect                              |
| `items.<id>.do[]`     | object by "do" |           |                           | Action                              |

## Upgrades

| Setting                    | Type           | Default   | Allowed        | What it does            |
| -------------------------- | -------------- | --------- | -------------- | ----------------------- |
| `upgrades`                 | map            | 0 entries | max 100        | Upgrades                |
| `upgrades.<id>.label`      | text           | (empty)   |                | Name                    |
| `upgrades.<id>.help`       | text           | (empty)   |                | Description             |
| `upgrades.<id>.cost`       | whole number   | 200       | 0–1000000      | Cost (points per level) |
| `upgrades.<id>.max`        | whole number   | 3         | 1–100          | Times it can be bought  |
| `upgrades.<id>.stats`      | map            | 0 entries | max 30         | Stats per level         |
| `upgrades.<id>.stats.<id>` | number         | 0         | -100000–100000 | Amount                  |
| `upgrades.<id>.vehicle`    | yes/no         | false     |                | Also for the vehicle    |
| `upgrades.<id>.minLevel`   | whole number   | 1         | 1–100          | From level              |
| `upgrades.<id>.do`         | list           | 0 entries | max 20         | Extra effect            |
| `upgrades.<id>.do[]`       | object by "do" |           |                | Action                  |

## Monster spawns

| Setting                  | Type         | Default   | Allowed    | What it does           |
| ------------------------ | ------------ | --------- | ---------- | ---------------------- |
| `spawns`                 | list         | 1 entries | max 50     | Monster spawns         |
| `spawns[].entity`        | reference    | (none)    | → entities | Monster                |
| `spawns[].every`         | range        | 12–30     | 0.5–3600   | Interval (seconds)     |
| `spawns[].count`         | range        | 1–3       | 1–50       | Per wave               |
| `spawns[].max`           | whole number | 8         | 1–200      | At most at once        |
| `spawns[].fromLevel`     | whole number | 1         | 1–100      | From level             |
| `spawns[].toLevel`       | whole number | 100       | 1–100      | Until level            |
| `spawns[].scalePerLevel` | number       | 0         | 0–500      | Stronger per level (%) |

## Item spawns

| Setting                  | Type         | Default   | Allowed  | What it does       |
| ------------------------ | ------------ | --------- | -------- | ------------------ |
| `itemSpawns`             | list         | 0 entries | max 50   | Item spawns        |
| `itemSpawns[].item`      | reference    | (none)    | → items  | Item               |
| `itemSpawns[].every`     | range        | 20–40     | 0.5–3600 | Interval (seconds) |
| `itemSpawns[].max`       | whole number | 2         | 1–100    | At most at once    |
| `itemSpawns[].fromLevel` | whole number | 1         | 1–100    | From level         |
| `itemSpawns[].toLevel`   | whole number | 100       | 1–100    | Until level        |

## Vehicle drives in

| Setting               | Type      | Default | Allowed    | What it does                                                                  |
| --------------------- | --------- | ------- | ---------- | ----------------------------------------------------------------------------- |
| `visits`              | group     |         |            | Vehicle drives in                                                             |
| `visits.enabled`      | yes/no    | true    |            | On                                                                            |
| `visits.vehicle`      | reference | car     | → entities | Vehicle                                                                       |
| `visits.delay`        | range     | 20–60   | 1–3600     | Visit after page load (seconds). Once per browser session while nobody plays. |
| `visits.whilePlaying` | yes/no    | true    |            | Also drives in while playing                                                  |
| `visits.playDelay`    | range     | 8–20    | 1–3600     | While playing after (seconds)                                                 |

## Triggers

| Setting                   | Type           | Default   | Allowed                                                                                                               | What it does                                         |
| ------------------------- | -------------- | --------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `triggers`                | list           | 0 entries | max 100                                                                                                               | Triggers                                             |
| `triggers[].on`           | choice         | kill      | start / interval / kill / hurt / death / levelUp / pickup / upgrade / break / enterVehicle / exitVehicle / viewChange | When                                                 |
| `triggers[].only`         | text           | (empty)   |                                                                                                                       | Only for (monster, item or upgrade). Empty: for all. |
| `triggers[].every`        | number         | 30        | 1–3600                                                                                                                | Seconds (“every x seconds” only)                     |
| `triggers[].once`         | yes/no         | false     |                                                                                                                       | Only once                                            |
| `triggers[].conditions`   | list           | 0 entries | max 10                                                                                                                | Only if                                              |
| `triggers[].conditions[]` | object by "if" |           |                                                                                                                       | Condition                                            |
| `triggers[].do`           | list           | 0 entries | max 20                                                                                                                | Then                                                 |
| `triggers[].do[]`         | object by "do" |           |                                                                                                                       | Action                                               |

## Levels

| Setting                | Type   | Default   | Allowed                               | What it does    |
| ---------------------- | ------ | --------- | ------------------------------------- | --------------- |
| `levels`               | list   | 0 entries | max 100                               | Levels          |
| `levels[].label`       | text   | (empty)   |                                       | Name            |
| `levels[].view`        | choice | (empty)   | (empty) / topdown / side              | View (at start) |
| `levels[].goal`        | group  |           |                                       | Goal            |
| `levels[].goal.type`   | choice | score     | none / score / kills / survive / boss | Goal            |
| `levels[].goal.amount` | number | 500       | 0–1000000                             | Amount          |

## Keys

| Setting      | Type  | Default                      | Allowed | What it does        |
| ------------ | ----- | ---------------------------- | ------- | ------------------- |
| `keys`       | group |                              |         | Keys                |
| `keys.left`  | keys  | ArrowLeft, KeyA              |         | Left                |
| `keys.right` | keys  | ArrowRight, KeyD             |         | Right               |
| `keys.up`    | keys  | ArrowUp, KeyW                |         | Up                  |
| `keys.down`  | keys  | ArrowDown, KeyS              |         | Down                |
| `keys.jump`  | keys  | KeyE                         |         | Jump and click      |
| `keys.drift` | keys  | Space, ShiftLeft, ShiftRight |         | Drift               |
| `keys.honk`  | keys  | Enter, KeyH                  |         | Honk                |
| `keys.use`   | keys  | KeyF                         |         | Get in/out, pick up |
| `keys.shop`  | keys  | KeyU                         |         | Open upgrades       |

## Instructions

| Setting          | Type   | Default | Allowed | What it does                          |
| ---------------- | ------ | ------- | ------- | ------------------------------------- |
| `hint`           | group  |         |         | Instructions                          |
| `hint.hideAfter` | number | 4       | 0–3600  | Folds away after (seconds, 0 = never) |

## Audio

| Setting                     | Type      | Default   | Allowed                             | What it does     |
| --------------------------- | --------- | --------- | ----------------------------------- | ---------------- |
| `audio`                     | group     |           |                                     | Audio            |
| `audio.enabled`             | yes/no    | false     |                                     | Sounds           |
| `audio.volume`              | number    | 0.5       | 0–1                                 | Volume           |
| `audio.sounds`              | map       | 0 entries | max 50                              | Sounds           |
| `audio.sounds.<id>.wave`    | choice    | square    | sine / square / sawtooth / triangle | Wave             |
| `audio.sounds.<id>.from`    | number    | 440       | 20–8000                             | Start (Hz)       |
| `audio.sounds.<id>.to`      | number    | 440       | 20–8000                             | End (Hz)         |
| `audio.sounds.<id>.seconds` | number    | 0.12      | 0.02–3                              | Length (seconds) |
| `audio.sounds.<id>.volume`  | number    | 0.5       | 0–1                                 | Volume           |
| `audio.events`              | map       | 0 entries | max 30                              | Sound for event  |
| `audio.events.<id>`         | reference | (none)    | → audio.sounds (optional)           | Sound            |

## Progress

| Setting         | Type   | Default          | Allowed | What it does                           |
| --------------- | ------ | ---------------- | ------- | -------------------------------------- |
| `progress`      | group  |                  |         | Progress                               |
| `progress.save` | yes/no | true             |         | Remember the best score in the browser |
| `progress.key`  | text   | "hello-eme-play" |         | Storage key                            |

## Texts

Leave empty for the default text.

| Setting                | Type  | Default | Allowed | What it does                                                                                                           |
| ---------------------- | ----- | ------- | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| `texts`                | group |         |         | Texts. Leave empty for the default text.                                                                               |
| `texts.toggle`         | text  | (empty) |         | Game mode                                                                                                              |
| `texts.keyboardHint`   | text  | (empty) |         | Arrow keys or WASD: walk · Space: punch · Q: kick · E: jump and click · Esc: exit                                      |
| `texts.touchHint`      | text  | (empty) |         | D-pad: walk · Jump: jump and click · Punch and Kick: hit enemies and things                                            |
| `texts.nearHint`       | text  | (empty) |         | F or “Get in”: get into the car                                                                                        |
| `texts.driveHint`      | text  | (empty) |         | Arrow keys or WASD: gas, brake and steer · Hold space or Shift: drift · Enter or H: honk and click · F or Esc: get out |
| `texts.touchDriveHint` | text  | (empty) |         | Drag the wheel: steer · Hold gas and brake · Hold Drift: drift · Honk: honk and click                                  |
| `texts.sideHint`       | text  | (empty) |         | Arrow keys or WASD: walk and jump · Space: punch · Q: kick · Esc: exit                                                 |
| `texts.visitNotice`    | text  | (empty) |         | A car pulled up.                                                                                                       |
| `texts.controls`       | text  | (empty) |         | Figure controls                                                                                                        |
| `texts.up`             | text  | (empty) |         | Up                                                                                                                     |
| `texts.down`           | text  | (empty) |         | Down                                                                                                                   |
| `texts.left`           | text  | (empty) |         | Left                                                                                                                   |
| `texts.right`          | text  | (empty) |         | Right                                                                                                                  |
| `texts.jump`           | text  | (empty) |         | Jump                                                                                                                   |
| `texts.punch`          | text  | (empty) |         | Punch                                                                                                                  |
| `texts.kick`           | text  | (empty) |         | Kick                                                                                                                   |
| `texts.drift`          | text  | (empty) |         | Drift                                                                                                                  |
| `texts.steering`       | text  | (empty) |         | Steering wheel                                                                                                         |
| `texts.gas`            | text  | (empty) |         | Gas                                                                                                                    |
| `texts.brake`          | text  | (empty) |         | Brake                                                                                                                  |
| `texts.honk`           | text  | (empty) |         | Honk                                                                                                                   |
| `texts.wrecked`        | text  | (empty) |         | Broken: {count}                                                                                                        |
| `texts.repair`         | text  | (empty) |         | Repair page                                                                                                            |
| `texts.hideHint`       | text  | (empty) |         | Hide hint                                                                                                              |
| `texts.showHint`       | text  | (empty) |         | Show hint                                                                                                              |
| `texts.getIn`          | text  | (empty) |         | Get in                                                                                                                 |
| `texts.getOut`         | text  | (empty) |         | Get out                                                                                                                |
| `texts.exit`           | text  | (empty) |         | Exit                                                                                                                   |
| `texts.dismiss`        | text  | (empty) |         | Send the car away                                                                                                      |
| `texts.score`          | text  | (empty) |         | Score: {score}                                                                                                         |
| `texts.level`          | text  | (empty) |         | Level {level}                                                                                                          |
| `texts.health`         | text  | (empty) |         | Health                                                                                                                 |
| `texts.gameOver`       | text  | (empty) |         | Game over! {score} points.                                                                                             |
| `texts.victory`        | text  | (empty) |         | You won! {score} points.                                                                                               |
| `texts.restart`        | text  | (empty) |         | Play again                                                                                                             |
| `texts.highScore`      | text  | (empty) |         | Best: {score}                                                                                                          |
| `texts.shop`           | text  | (empty) |         | Upgrades                                                                                                               |
| `texts.shopClose`      | text  | (empty) |         | Close upgrades                                                                                                         |
| `texts.buy`            | text  | (empty) |         | Buy                                                                                                                    |
| `texts.bought`         | text  | (empty) |         | Bought                                                                                                                 |
| `texts.cost`           | text  | (empty) |         | {points} points                                                                                                        |

## Events

A trigger runs when its `on` event happens.

| `on`           | What it does          |
| -------------- | --------------------- |
| `start`        | The game starts       |
| `interval`     | Every x seconds       |
| `kill`         | A monster is beaten   |
| `hurt`         | The figure is hurt    |
| `death`        | The figure dies       |
| `levelUp`      | A level starts        |
| `pickup`       | An item is picked up  |
| `upgrade`      | An upgrade is bought  |
| `break`        | A page element breaks |
| `enterVehicle` | The figure gets in    |
| `exitVehicle`  | The figure gets out   |
| `viewChange`   | The view switches     |

## Actions

What a trigger, an item or an upgrade does (`do`). Each action is an object with `"do": "<name>"`.

### `do: spawn` – Spawn monsters

| Setting  | Type         | Default | Allowed     | What it does |
| -------- | ------------ | ------- | ----------- | ------------ |
| `entity` | reference    | (none)  | → entities  | Who          |
| `count`  | whole number | 3       | 1–50        | Count        |
| `where`  | choice       | edge    | edge / near | Where        |

### `do: setView` – Switch view

| Setting | Type   | Default | Allowed        | What it does |
| ------- | ------ | ------- | -------------- | ------------ |
| `mode`  | choice | side    | topdown / side | View         |

### `do: points` – Give points

| Setting  | Type         | Default | Allowed          | What it does |
| -------- | ------------ | ------- | ---------------- | ------------ |
| `amount` | whole number | 100     | -1000000–1000000 | Points       |

### `do: heal` – Change health

| Setting  | Type   | Default | Allowed      | What it does               |
| -------- | ------ | ------- | ------------ | -------------------------- |
| `amount` | number | 25      | -10000–10000 | Amount (negative = damage) |

### `do: stat` – Change a stat

| Setting   | Type      | Default | Allowed                     | What it does          |
| --------- | --------- | ------- | --------------------------- | --------------------- |
| `stat`    | reference | (none)  | → stats                     | Stat                  |
| `amount`  | number    | 10      | -10000–10000                | Amount                |
| `target`  | choice    | figure  | figure / vehicle / monsters | For                   |
| `seconds` | number    | 10      | 0–3600                      | Seconds (0 = forever) |

### `do: dropItem` – Drop an item

| Setting | Type      | Default | Allowed | What it does |
| ------- | --------- | ------- | ------- | ------------ |
| `item`  | reference | (none)  | → items | Item         |

### `do: nextLevel` – Next level

—

### `do: message` – Show a message

| Setting | Type | Default | Allowed | What it does |
| ------- | ---- | ------- | ------- | ------------ |
| `text`  | text | (empty) |         | Text         |

### `do: sound` – Play a sound

| Setting | Type      | Default | Allowed        | What it does |
| ------- | --------- | ------- | -------------- | ------------ |
| `sound` | reference | (none)  | → audio.sounds | Sound        |

### `do: win` – Win the game

—

### `do: lose` – Lose the game

—

## Conditions

A trigger runs only if all of its `conditions` hold. Each is an object with `"if": "<name>"`.

### `if: level` – Level

| Setting | Type         | Default | Allowed | What it does |
| ------- | ------------ | ------- | ------- | ------------ |
| `min`   | whole number | 1       | 1–100   | From         |
| `max`   | whole number | 100     | 1–100   | Until        |

### `if: score` – Score

| Setting | Type         | Default | Allowed   | What it does |
| ------- | ------------ | ------- | --------- | ------------ |
| `min`   | whole number | 100     | 0–1000000 | At least     |

### `if: view` – View

| Setting | Type   | Default | Allowed        | What it does |
| ------- | ------ | ------- | -------------- | ------------ |
| `mode`  | choice | topdown | topdown / side | View         |

### `if: health` – Low health

| Setting | Type   | Default | Allowed | What it does |
| ------- | ------ | ------- | ------- | ------------ |
| `below` | number | 30      | 0–100   | Below (%)    |

### `if: chance` – Chance

| Setting   | Type   | Default | Allowed | What it does |
| --------- | ------ | ------- | ------- | ------------ |
| `percent` | number | 50      | 0–100   | Chance (%)   |

### `if: kills` – Monsters beaten

| Setting  | Type         | Default | Allowed               | What it does       |
| -------- | ------------ | ------- | --------------------- | ------------------ |
| `entity` | reference    | (none)  | → entities (optional) | Which (empty: all) |
| `min`    | whole number | 10      | 1–100000              | At least           |

## Key codes and default keys

Keys are `KeyboardEvent.code` values: they name the physical key, whatever the keyboard layout.
Common ones: `KeyA`–`KeyZ`, `Digit0`–`Digit9`, `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Space`,
`Enter`, `Tab`, `ShiftLeft`, `ShiftRight`, `ControlLeft`, `AltLeft`. `Escape` always leaves the game.
In the editor, "Press a key" records one. On touch screens the game shows on-screen controls instead.

| Does                | Setting            | Default keys                       |
| ------------------- | ------------------ | ---------------------------------- |
| Left                | `keys.left`        | `ArrowLeft`, `KeyA`                |
| Right               | `keys.right`       | `ArrowRight`, `KeyD`               |
| Up                  | `keys.up`          | `ArrowUp`, `KeyW`                  |
| Down                | `keys.down`        | `ArrowDown`, `KeyS`                |
| Jump and click      | `keys.jump`        | `KeyE`                             |
| Drift               | `keys.drift`       | `Space`, `ShiftLeft`, `ShiftRight` |
| Honk                | `keys.honk`        | `Enter`, `KeyH`                    |
| Get in/out, pick up | `keys.use`         | `KeyF`                             |
| Open upgrades       | `keys.shop`        | `KeyU`                             |
| Punch               | `moves.punch.keys` | `Space`                            |
| Kick                | `moves.kick.keys`  | `KeyQ`                             |
