# Konfigurations-Referenz

Alle Einstellungen des Spiels, aus dem Schema erzeugt. Alle sind optional: Was fehlt, bekommt den Standardwert,
und ein Wert ausserhalb der Grenzen wird beim Laden des Spiels korrigiert (`resolveConfig`).
Der Editor (`@hello-eme/play-editor`) zeigt dieselben Einstellungen als Formular, mit dieser Anleitung daneben.

## Inhalt

- [Version](#version) (`version`)
- [Spiel aktiv](#spiel-aktiv) (`enabled`)
- [Sprache](#sprache) (`locale`)
- [Ansicht](#ansicht) (`view`)
- [Spielregeln](#spielregeln) (`game`)
- [Werte](#werte) (`stats`)
- [Bilder](#bilder) (`sprites`)
- [Figuren, Monster und Fahrzeuge](#figuren-monster-und-fahrzeuge) (`entities`)
- [Angriffe](#angriffe) (`moves`)
- [Gegenstände](#gegenstände) (`items`)
- [Upgrades](#upgrades) (`upgrades`)
- [Monster erscheinen](#monster-erscheinen) (`spawns`)
- [Gegenstände erscheinen](#gegenstände-erscheinen) (`itemSpawns`)
- [Fahrzeug fährt vor](#fahrzeug-fährt-vor) (`visits`)
- [Auslöser](#auslöser) (`triggers`)
- [Level](#level) (`levels`)
- [Tasten](#tasten) (`keys`)
- [Anleitung](#anleitung) (`hint`)
- [Ton](#ton) (`audio`)
- [Fortschritt](#fortschritt) (`progress`)
- [Texte](#texte) (`texts`)
- [Ereignisse](#ereignisse)
- [Aktionen](#aktionen)
- [Bedingungen](#bedingungen)
- [Tastencodes und Standardtasten](#tastencodes-und-standardtasten)

## Version

| Einstellung | Typ          | Standard | Erlaubt | Wirkung |
| ----------- | ------------ | -------- | ------- | ------- |
| `version`   | whole number | 1        | 1–1000  | Version |

## Spiel aktiv

| Einstellung | Typ    | Standard | Erlaubt | Wirkung     |
| ----------- | ------ | -------- | ------- | ----------- |
| `enabled`   | yes/no | true     |         | Spiel aktiv |

## Sprache

| Einstellung | Typ    | Standard | Erlaubt | Wirkung |
| ----------- | ------ | -------- | ------- | ------- |
| `locale`    | choice | de       | de / en | Sprache |

## Ansicht

| Einstellung               | Typ    | Standard                                 | Erlaubt        | Wirkung                        |
| ------------------------- | ------ | ---------------------------------------- | -------------- | ------------------------------ |
| `view`                    | group  |                                          |                | Ansicht                        |
| `view.mode`               | choice | topdown                                  | topdown / side | Ansicht                        |
| `view.gravity`            | number | 1800                                     | 100–10000      | Schwerkraft (px/s²)            |
| `view.jumpSpeed`          | number | 760                                      | 100–3000       | Sprungkraft (px/s)             |
| `view.platforms`          | group  |                                          |                | Plattformen (Sidescroller)     |
| `view.platforms.selector` | text   | "h1, h2, h3, img, button, a, p, figure,… |                | Seitenelemente zum Draufstehen |
| `view.platforms.minWidth` | number | 60                                       | 10–2000        | Mindestbreite (px)             |

## Spielregeln

| Einstellung         | Typ          | Standard | Erlaubt    | Wirkung                                    |
| ------------------- | ------------ | -------- | ---------- | ------------------------------------------ |
| `game`              | group        |          |            | Spielregeln                                |
| `game.player`       | reference    | hero     | → entities | Gespielte Figur                            |
| `game.lives`        | whole number | 1        | 1–99       | Leben (Versuche)                           |
| `game.wrap`         | yes/no       | true     |            | Am Seitenende auf der anderen Seite weiter |
| `game.overrunSpeed` | number       | 140      | 0–5000     | Überfahren ab (px/s)                       |
| `game.breakPoints`  | whole number | 10       | 0–1000000  | Punkte pro zerbrochenes Element            |

## Werte

Welche Werte es gibt (Leben, Angriff …).

| Einstellung        | Typ    | Standard  | Erlaubt          | Wirkung                                         |
| ------------------ | ------ | --------- | ---------------- | ----------------------------------------------- |
| `stats`            | map    | 8 entries | max 30           | Werte. Welche Werte es gibt (Leben, Angriff …). |
| `stats.<id>.label` | text   | (empty)   |                  | Name                                            |
| `stats.<id>.min`   | number | 0         | -1000000–1000000 | Kleinster Wert                                  |
| `stats.<id>.max`   | number | 9999      | -1000000–1000000 | Grösster Wert                                   |

## Bilder

| Einstellung                       | Typ          | Standard  | Erlaubt                  | Wirkung                                                                                               |
| --------------------------------- | ------------ | --------- | ------------------------ | ----------------------------------------------------------------------------------------------------- |
| `sprites`                         | map          | 0 entries | max 100                  | Bilder                                                                                                |
| `sprites.<id>.url`                | text         | (empty)   |                          | Adresse (PNG, SVG, WebP …)                                                                            |
| `sprites.<id>.size`               | number       | 50        | 8–400                    | Länge der längeren Seite (px, bei Sheets eines Einzelbilds)                                           |
| `sprites.<id>.columns`            | whole number | 1         | 1–64                     | Spalten im Sheet                                                                                      |
| `sprites.<id>.rows`               | whole number | 1         | 1–64                     | Zeilen im Sheet                                                                                       |
| `sprites.<id>.fps`                | number       | 8         | 1–60                     | Bilder pro Sekunde                                                                                    |
| `sprites.<id>.animations`         | group        |           |                          | Animationen (Bildnummern ab 0, zeilenweise gezählt). Leer: Stehen, ist auch das leer, das erste Bild. |
| `sprites.<id>.animations.idle`    | list         | 0 entries | max 64                   | Stehen                                                                                                |
| `sprites.<id>.animations.idle[]`  | whole number | 0         | 0–4095                   | Bild Nr.                                                                                              |
| `sprites.<id>.animations.walk`    | list         | 0 entries | max 64                   | Laufen                                                                                                |
| `sprites.<id>.animations.walk[]`  | whole number | 0         | 0–4095                   | Bild Nr.                                                                                              |
| `sprites.<id>.animations.jump`    | list         | 0 entries | max 64                   | Springen                                                                                              |
| `sprites.<id>.animations.jump[]`  | whole number | 0         | 0–4095                   | Bild Nr.                                                                                              |
| `sprites.<id>.animations.hurt`    | list         | 0 entries | max 64                   | Getroffen                                                                                             |
| `sprites.<id>.animations.hurt[]`  | whole number | 0         | 0–4095                   | Bild Nr.                                                                                              |
| `sprites.<id>.animations.punch`   | list         | 0 entries | max 64                   | Schlag                                                                                                |
| `sprites.<id>.animations.punch[]` | whole number | 0         | 0–4095                   | Bild Nr.                                                                                              |
| `sprites.<id>.animations.kick`    | list         | 0 entries | max 64                   | Tritt                                                                                                 |
| `sprites.<id>.animations.kick[]`  | whole number | 0         | 0–4095                   | Bild Nr.                                                                                              |
| `sprites.<id>.animations.bite`    | list         | 0 entries | max 64                   | Biss                                                                                                  |
| `sprites.<id>.animations.bite[]`  | whole number | 0         | 0–4095                   | Bild Nr.                                                                                              |
| `sprites.<id>.facing`             | choice       | right     | right / down / left / up | Blickt nach                                                                                           |

## Figuren, Monster und Fahrzeuge

| Einstellung                           | Typ          | Standard  | Erlaubt                                | Wirkung                                                                        |
| ------------------------------------- | ------------ | --------- | -------------------------------------- | ------------------------------------------------------------------------------ |
| `entities`                            | map          | 3 entries | max 100                                | Figuren, Monster und Fahrzeuge                                                 |
| `entities.<id>.kind`                  | choice       | monster   | figure / monster / vehicle             | Art                                                                            |
| `entities.<id>.label`                 | text         | (empty)   |                                        | Name                                                                           |
| `entities.<id>.sprite`                | reference    | (none)    | → sprites (optional)                   | Bild                                                                           |
| `entities.<id>.look`                  | choice       | enemy     | figure / enemy / car                   | Eingebautes Aussehen                                                           |
| `entities.<id>.size`                  | number       | 50        | 8–400                                  | Grösse (px)                                                                    |
| `entities.<id>.stats`                 | map          | 0 entries | max 30                                 | Werte. Leben, Angriff, Verteidigung, Tempo, Geschick, Glück … (siehe „Werte“). |
| `entities.<id>.stats.<id>`            | number       | 0         | -1000000–1000000                       | Wert                                                                           |
| `entities.<id>.behavior`              | choice       | chase     | chase / wander / flee / stand / arrive | Verhalten                                                                      |
| `entities.<id>.moves`                 | list         | 0 entries | max 10                                 | Angriffe                                                                       |
| `entities.<id>.moves[]`               | reference    | (none)    | → moves                                | Angriff                                                                        |
| `entities.<id>.reward`                | group        |           |                                        | Belohnung                                                                      |
| `entities.<id>.reward.points`         | whole number | 0         | 0–1000000                              | Punkte                                                                         |
| `entities.<id>.reward.drops`          | list         | 0 entries | max 10                                 | Lässt fallen                                                                   |
| `entities.<id>.reward.drops[].item`   | reference    | (none)    | → items                                | Gegenstand                                                                     |
| `entities.<id>.reward.drops[].chance` | number       | 25        | 0–100                                  | Chance (%)                                                                     |
| `entities.<id>.boss`                  | yes/no       | false     |                                        | Boss                                                                           |

## Angriffe

| Einstellung           | Typ       | Standard  | Erlaubt                   | Wirkung                   |
| --------------------- | --------- | --------- | ------------------------- | ------------------------- |
| `moves`               | map       | 3 entries | max 50                    | Angriffe                  |
| `moves.<id>.label`    | text      | (empty)   |                           | Name                      |
| `moves.<id>.keys`     | keys      | (none)    |                           | Tasten (nur Figur)        |
| `moves.<id>.power`    | number    | 1         | 0–100                     | Stärke (mal Angriff)      |
| `moves.<id>.reach`    | number    | 30        | 4–400                     | Reichweite (px)           |
| `moves.<id>.cooldown` | number    | 0.3       | 0–60                      | Pause (Sekunden)          |
| `moves.<id>.seconds`  | number    | 0.22      | 0.05–5                    | Dauer der Pose (Sekunden) |
| `moves.<id>.push`     | number    | 260       | 0–5000                    | Rückstoss (px/s)          |
| `moves.<id>.breaks`   | yes/no    | true      |                           | Zerschlägt Seitenelemente |
| `moves.<id>.pose`     | choice    | punch     | punch / kick / bite       | Pose                      |
| `moves.<id>.sound`    | reference | (none)    | → audio.sounds (optional) | Ton                       |
| `moves.<id>.where`    | choice    | foot      | foot / vehicle / both     | Wo einsetzbar             |

## Gegenstände

| Einstellung           | Typ            | Standard  | Erlaubt                   | Wirkung                               |
| --------------------- | -------------- | --------- | ------------------------- | ------------------------------------- |
| `items`               | map            | 0 entries | max 100                   | Gegenstände                           |
| `items.<id>.label`    | text           | (empty)   |                           | Name                                  |
| `items.<id>.sprite`   | reference      | (none)    | → sprites (optional)      | Bild                                  |
| `items.<id>.look`     | choice         | star      | heart / star / gem / bolt | Eingebautes Aussehen                  |
| `items.<id>.size`     | number         | 30        | 8–200                     | Grösse (px)                           |
| `items.<id>.pickup`   | choice         | touch     | touch / use               | Einsammeln                            |
| `items.<id>.lifetime` | number         | 20        | 0–3600                    | Verschwindet nach (Sekunden, 0 = nie) |
| `items.<id>.do`       | list           | 0 entries | max 20                    | Wirkung                               |
| `items.<id>.do[]`     | object by "do" |           |                           | Aktion                                |

## Upgrades

| Einstellung                | Typ            | Standard  | Erlaubt        | Wirkung                    |
| -------------------------- | -------------- | --------- | -------------- | -------------------------- |
| `upgrades`                 | map            | 0 entries | max 100        | Upgrades                   |
| `upgrades.<id>.label`      | text           | (empty)   |                | Name                       |
| `upgrades.<id>.help`       | text           | (empty)   |                | Beschreibung               |
| `upgrades.<id>.cost`       | whole number   | 200       | 0–1000000      | Preis (Punkte pro Stufe)   |
| `upgrades.<id>.max`        | whole number   | 3         | 1–100          | Wie oft kaufbar            |
| `upgrades.<id>.stats`      | map            | 0 entries | max 30         | Werte pro Stufe            |
| `upgrades.<id>.stats.<id>` | number         | 0         | -100000–100000 | Menge                      |
| `upgrades.<id>.vehicle`    | yes/no         | false     |                | Gilt auch für das Fahrzeug |
| `upgrades.<id>.minLevel`   | whole number   | 1         | 1–100          | Ab Level                   |
| `upgrades.<id>.do`         | list           | 0 entries | max 20         | Zusätzliche Wirkung        |
| `upgrades.<id>.do[]`       | object by "do" |           |                | Aktion                     |

## Monster erscheinen

| Einstellung              | Typ          | Standard  | Erlaubt    | Wirkung                |
| ------------------------ | ------------ | --------- | ---------- | ---------------------- |
| `spawns`                 | list         | 1 entries | max 50     | Monster erscheinen     |
| `spawns[].entity`        | reference    | (none)    | → entities | Monster                |
| `spawns[].every`         | range        | 12–30     | 0.5–3600   | Abstand (Sekunden)     |
| `spawns[].count`         | range        | 1–3       | 1–50       | Anzahl pro Welle       |
| `spawns[].max`           | whole number | 8         | 1–200      | Höchstens gleichzeitig |
| `spawns[].fromLevel`     | whole number | 1         | 1–100      | Ab Level               |
| `spawns[].toLevel`       | whole number | 100       | 1–100      | Bis Level              |
| `spawns[].scalePerLevel` | number       | 0         | 0–500      | Stärker pro Level (%)  |

## Gegenstände erscheinen

| Einstellung              | Typ          | Standard  | Erlaubt  | Wirkung                |
| ------------------------ | ------------ | --------- | -------- | ---------------------- |
| `itemSpawns`             | list         | 0 entries | max 50   | Gegenstände erscheinen |
| `itemSpawns[].item`      | reference    | (none)    | → items  | Gegenstand             |
| `itemSpawns[].every`     | range        | 20–40     | 0.5–3600 | Abstand (Sekunden)     |
| `itemSpawns[].max`       | whole number | 2         | 1–100    | Höchstens gleichzeitig |
| `itemSpawns[].fromLevel` | whole number | 1         | 1–100    | Ab Level               |
| `itemSpawns[].toLevel`   | whole number | 100       | 1–100    | Bis Level              |

## Fahrzeug fährt vor

| Einstellung           | Typ       | Standard | Erlaubt    | Wirkung                                                                            |
| --------------------- | --------- | -------- | ---------- | ---------------------------------------------------------------------------------- |
| `visits`              | group     |          |            | Fahrzeug fährt vor                                                                 |
| `visits.enabled`      | yes/no    | true     |            | Ein                                                                                |
| `visits.vehicle`      | reference | car      | → entities | Fahrzeug                                                                           |
| `visits.delay`        | range     | 20–60    | 1–3600     | Besuch nach dem Laden (Sekunden). Einmal pro Browser-Sitzung, wenn niemand spielt. |
| `visits.whilePlaying` | yes/no    | true     |            | Fährt auch während des Spiels vor                                                  |
| `visits.playDelay`    | range     | 8–20     | 1–3600     | Während des Spiels nach (Sekunden)                                                 |

## Auslöser

| Einstellung               | Typ            | Standard  | Erlaubt                                                                                                               | Wirkung                                                     |
| ------------------------- | -------------- | --------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `triggers`                | list           | 0 entries | max 100                                                                                                               | Auslöser                                                    |
| `triggers[].on`           | choice         | kill      | start / interval / kill / hurt / death / levelUp / pickup / upgrade / break / enterVehicle / exitVehicle / viewChange | Wenn                                                        |
| `triggers[].only`         | text           | (empty)   |                                                                                                                       | Nur für (Monster, Gegenstand oder Upgrade). Leer: für alle. |
| `triggers[].every`        | number         | 30        | 1–3600                                                                                                                | Sekunden (nur „Alle x Sekunden“)                            |
| `triggers[].once`         | yes/no         | false     |                                                                                                                       | Nur einmal                                                  |
| `triggers[].conditions`   | list           | 0 entries | max 10                                                                                                                | Nur wenn                                                    |
| `triggers[].conditions[]` | object by "if" |           |                                                                                                                       | Bedingung                                                   |
| `triggers[].do`           | list           | 0 entries | max 20                                                                                                                | Dann                                                        |
| `triggers[].do[]`         | object by "do" |           |                                                                                                                       | Aktion                                                      |

## Level

| Einstellung            | Typ    | Standard  | Erlaubt                               | Wirkung              |
| ---------------------- | ------ | --------- | ------------------------------------- | -------------------- |
| `levels`               | list   | 0 entries | max 100                               | Level                |
| `levels[].label`       | text   | (empty)   |                                       | Name                 |
| `levels[].view`        | choice | (empty)   | (empty) / topdown / side              | Ansicht (beim Start) |
| `levels[].goal`        | group  |           |                                       | Ziel                 |
| `levels[].goal.type`   | choice | score     | none / score / kills / survive / boss | Ziel                 |
| `levels[].goal.amount` | number | 500       | 0–1000000                             | Menge                |

## Tasten

| Einstellung  | Typ   | Standard                     | Erlaubt | Wirkung                       |
| ------------ | ----- | ---------------------------- | ------- | ----------------------------- |
| `keys`       | group |                              |         | Tasten                        |
| `keys.left`  | keys  | ArrowLeft, KeyA              |         | Links                         |
| `keys.right` | keys  | ArrowRight, KeyD             |         | Rechts                        |
| `keys.up`    | keys  | ArrowUp, KeyW                |         | Hoch                          |
| `keys.down`  | keys  | ArrowDown, KeyS              |         | Runter                        |
| `keys.jump`  | keys  | KeyE                         |         | Springen und klicken          |
| `keys.drift` | keys  | Space, ShiftLeft, ShiftRight |         | Driften                       |
| `keys.honk`  | keys  | Enter, KeyH                  |         | Hupen                         |
| `keys.use`   | keys  | KeyF                         |         | Ein- und Aussteigen, Aufheben |
| `keys.shop`  | keys  | KeyU                         |         | Upgrades öffnen               |

## Anleitung

| Einstellung      | Typ    | Standard | Erlaubt | Wirkung                             |
| ---------------- | ------ | -------- | ------- | ----------------------------------- |
| `hint`           | group  |          |         | Anleitung                           |
| `hint.hideAfter` | number | 4        | 0–3600  | Klappt ein nach (Sekunden, 0 = nie) |

## Ton

| Einstellung                 | Typ       | Standard  | Erlaubt                             | Wirkung          |
| --------------------------- | --------- | --------- | ----------------------------------- | ---------------- |
| `audio`                     | group     |           |                                     | Ton              |
| `audio.enabled`             | yes/no    | false     |                                     | Töne             |
| `audio.volume`              | number    | 0.5       | 0–1                                 | Lautstärke       |
| `audio.sounds`              | map       | 0 entries | max 50                              | Töne             |
| `audio.sounds.<id>.wave`    | choice    | square    | sine / square / sawtooth / triangle | Klang            |
| `audio.sounds.<id>.from`    | number    | 440       | 20–8000                             | Start (Hz)       |
| `audio.sounds.<id>.to`      | number    | 440       | 20–8000                             | Ende (Hz)        |
| `audio.sounds.<id>.seconds` | number    | 0.12      | 0.02–3                              | Länge (Sekunden) |
| `audio.sounds.<id>.volume`  | number    | 0.5       | 0–1                                 | Lautstärke       |
| `audio.events`              | map       | 0 entries | max 30                              | Ton bei Ereignis |
| `audio.events.<id>`         | reference | (none)    | → audio.sounds (optional)           | Ton              |

## Fortschritt

| Einstellung     | Typ    | Standard         | Erlaubt | Wirkung                    |
| --------------- | ------ | ---------------- | ------- | -------------------------- |
| `progress`      | group  |                  |         | Fortschritt                |
| `progress.save` | yes/no | true             |         | Bestwert im Browser merken |
| `progress.key`  | text   | "hello-eme-play" |         | Speicherschlüssel          |

## Texte

Leer lassen für den Standardtext.

| Einstellung            | Typ   | Standard | Erlaubt | Wirkung                                                                                                                                         |
| ---------------------- | ----- | -------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `texts`                | group |          |         | Texte. Leer lassen für den Standardtext.                                                                                                        |
| `texts.toggle`         | text  | (empty)  |         | Spielmodus                                                                                                                                      |
| `texts.keyboardHint`   | text  | (empty)  |         | Pfeiltasten oder WASD: laufen · Leertaste: boxen · Q: kicken · E: springen und klicken · Esc: beenden                                           |
| `texts.touchHint`      | text  | (empty)  |         | Steuerkreuz: laufen · Springen: springen und klicken · Boxen und Kicken: Gegner und Elemente treffen                                            |
| `texts.nearHint`       | text  | (empty)  |         | F oder «Einsteigen»: ins Auto steigen                                                                                                           |
| `texts.driveHint`      | text  | (empty)  |         | Pfeiltasten oder WASD: Gas, Bremse und lenken · Leertaste oder Shift halten: driften · Enter oder H: hupen und klicken · F oder Esc: aussteigen |
| `texts.touchDriveHint` | text  | (empty)  |         | Lenkrad ziehen: lenken · Gas und Bremse halten · Drift halten: driften · Hupe: hupen und klicken                                                |
| `texts.sideHint`       | text  | (empty)  |         | Pfeiltasten oder WASD: laufen und springen · Leertaste: boxen · Q: kicken · Esc: beenden                                                        |
| `texts.visitNotice`    | text  | (empty)  |         | Ein Auto ist vorgefahren.                                                                                                                       |
| `texts.controls`       | text  | (empty)  |         | Steuerung der Figur                                                                                                                             |
| `texts.up`             | text  | (empty)  |         | Nach oben                                                                                                                                       |
| `texts.down`           | text  | (empty)  |         | Nach unten                                                                                                                                      |
| `texts.left`           | text  | (empty)  |         | Nach links                                                                                                                                      |
| `texts.right`          | text  | (empty)  |         | Nach rechts                                                                                                                                     |
| `texts.jump`           | text  | (empty)  |         | Springen                                                                                                                                        |
| `texts.punch`          | text  | (empty)  |         | Boxen                                                                                                                                           |
| `texts.kick`           | text  | (empty)  |         | Kicken                                                                                                                                          |
| `texts.drift`          | text  | (empty)  |         | Drift                                                                                                                                           |
| `texts.steering`       | text  | (empty)  |         | Lenkrad                                                                                                                                         |
| `texts.gas`            | text  | (empty)  |         | Gas                                                                                                                                             |
| `texts.brake`          | text  | (empty)  |         | Bremse                                                                                                                                          |
| `texts.honk`           | text  | (empty)  |         | Hupe                                                                                                                                            |
| `texts.wrecked`        | text  | (empty)  |         | Zerstört: {count}                                                                                                                               |
| `texts.repair`         | text  | (empty)  |         | Seite reparieren                                                                                                                                |
| `texts.hideHint`       | text  | (empty)  |         | Hinweis ausblenden                                                                                                                              |
| `texts.showHint`       | text  | (empty)  |         | Hinweis einblenden                                                                                                                              |
| `texts.getIn`          | text  | (empty)  |         | Einsteigen                                                                                                                                      |
| `texts.getOut`         | text  | (empty)  |         | Aussteigen                                                                                                                                      |
| `texts.exit`           | text  | (empty)  |         | Beenden                                                                                                                                         |
| `texts.dismiss`        | text  | (empty)  |         | Auto wegschicken                                                                                                                                |
| `texts.score`          | text  | (empty)  |         | Punkte: {score}                                                                                                                                 |
| `texts.level`          | text  | (empty)  |         | Level {level}                                                                                                                                   |
| `texts.health`         | text  | (empty)  |         | Leben                                                                                                                                           |
| `texts.gameOver`       | text  | (empty)  |         | Game over! {score} Punkte.                                                                                                                      |
| `texts.victory`        | text  | (empty)  |         | Gewonnen! {score} Punkte.                                                                                                                       |
| `texts.restart`        | text  | (empty)  |         | Nochmal                                                                                                                                         |
| `texts.highScore`      | text  | (empty)  |         | Bestwert: {score}                                                                                                                               |
| `texts.shop`           | text  | (empty)  |         | Upgrades                                                                                                                                        |
| `texts.shopClose`      | text  | (empty)  |         | Upgrades schliessen                                                                                                                             |
| `texts.buy`            | text  | (empty)  |         | Kaufen                                                                                                                                          |
| `texts.bought`         | text  | (empty)  |         | Gekauft                                                                                                                                         |
| `texts.cost`           | text  | (empty)  |         | {points} Punkte                                                                                                                                 |

## Ereignisse

Ein Auslöser läuft, wenn sein `on`-Ereignis eintritt.

| `on`           | Wirkung                          |
| -------------- | -------------------------------- |
| `start`        | Das Spiel startet                |
| `interval`     | Alle x Sekunden                  |
| `kill`         | Ein Monster besiegt wird         |
| `hurt`         | Die Figur getroffen wird         |
| `death`        | Die Figur stirbt                 |
| `levelUp`      | Ein Level beginnt                |
| `pickup`       | Ein Gegenstand eingesammelt wird |
| `upgrade`      | Ein Upgrade gekauft wird         |
| `break`        | Ein Seitenelement zerbricht      |
| `enterVehicle` | Die Figur einsteigt              |
| `exitVehicle`  | Die Figur aussteigt              |
| `viewChange`   | Die Ansicht wechselt             |

## Aktionen

Was ein Auslöser, ein Gegenstand oder ein Upgrade tut (`do`). Jede Aktion ist ein Objekt mit `"do": "<Name>"`.

### `do: spawn` – Monster erscheinen lassen

| Einstellung | Typ          | Standard | Erlaubt     | Wirkung |
| ----------- | ------------ | -------- | ----------- | ------- |
| `entity`    | reference    | (none)   | → entities  | Wer     |
| `count`     | whole number | 3        | 1–50        | Anzahl  |
| `where`     | choice       | edge     | edge / near | Wo      |

### `do: setView` – Ansicht wechseln

| Einstellung | Typ    | Standard | Erlaubt        | Wirkung |
| ----------- | ------ | -------- | -------------- | ------- |
| `mode`      | choice | side     | topdown / side | Ansicht |

### `do: points` – Punkte geben

| Einstellung | Typ          | Standard | Erlaubt          | Wirkung |
| ----------- | ------------ | -------- | ---------------- | ------- |
| `amount`    | whole number | 100      | -1000000–1000000 | Punkte  |

### `do: heal` – Leben ändern

| Einstellung | Typ    | Standard | Erlaubt      | Wirkung                 |
| ----------- | ------ | -------- | ------------ | ----------------------- |
| `amount`    | number | 25       | -10000–10000 | Menge (minus = Schaden) |

### `do: stat` – Wert verändern

| Einstellung | Typ       | Standard | Erlaubt                     | Wirkung                  |
| ----------- | --------- | -------- | --------------------------- | ------------------------ |
| `stat`      | reference | (none)   | → stats                     | Wert                     |
| `amount`    | number    | 10       | -10000–10000                | Menge                    |
| `target`    | choice    | figure   | figure / vehicle / monsters | Für                      |
| `seconds`   | number    | 10       | 0–3600                      | Sekunden (0 = für immer) |

### `do: dropItem` – Gegenstand fallen lassen

| Einstellung | Typ       | Standard | Erlaubt | Wirkung    |
| ----------- | --------- | -------- | ------- | ---------- |
| `item`      | reference | (none)   | → items | Gegenstand |

### `do: nextLevel` – Nächstes Level

—

### `do: message` – Meldung zeigen

| Einstellung | Typ  | Standard | Erlaubt | Wirkung |
| ----------- | ---- | -------- | ------- | ------- |
| `text`      | text | (empty)  |         | Text    |

### `do: sound` – Ton abspielen

| Einstellung | Typ       | Standard | Erlaubt        | Wirkung |
| ----------- | --------- | -------- | -------------- | ------- |
| `sound`     | reference | (none)   | → audio.sounds | Ton     |

### `do: win` – Spiel gewinnen

—

### `do: lose` – Spiel verlieren

—

## Bedingungen

Ein Auslöser läuft nur, wenn alle seine `conditions` gelten. Jede ist ein Objekt mit `"if": "<Name>"`.

### `if: level` – Level

| Einstellung | Typ          | Standard | Erlaubt | Wirkung |
| ----------- | ------------ | -------- | ------- | ------- |
| `min`       | whole number | 1        | 1–100   | Ab      |
| `max`       | whole number | 100      | 1–100   | Bis     |

### `if: score` – Punkte

| Einstellung | Typ          | Standard | Erlaubt   | Wirkung    |
| ----------- | ------------ | -------- | --------- | ---------- |
| `min`       | whole number | 100      | 0–1000000 | Mindestens |

### `if: view` – Ansicht

| Einstellung | Typ    | Standard | Erlaubt        | Wirkung |
| ----------- | ------ | -------- | -------------- | ------- |
| `mode`      | choice | topdown  | topdown / side | Ansicht |

### `if: health` – Wenig Leben

| Einstellung | Typ    | Standard | Erlaubt | Wirkung   |
| ----------- | ------ | -------- | ------- | --------- |
| `below`     | number | 30       | 0–100   | Unter (%) |

### `if: chance` – Zufall

| Einstellung | Typ    | Standard | Erlaubt | Wirkung    |
| ----------- | ------ | -------- | ------- | ---------- |
| `percent`   | number | 50       | 0–100   | Chance (%) |

### `if: kills` – Besiegte Monster

| Einstellung | Typ          | Standard | Erlaubt               | Wirkung             |
| ----------- | ------------ | -------- | --------------------- | ------------------- |
| `entity`    | reference    | (none)   | → entities (optional) | Welche (leer: alle) |
| `min`       | whole number | 10       | 1–100000              | Mindestens          |

## Tastencodes und Standardtasten

Tasten sind `KeyboardEvent.code`-Werte: Sie benennen die physische Taste, egal welches Tastaturlayout.
Häufige: `KeyA`–`KeyZ`, `Digit0`–`Digit9`, `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Space`,
`Enter`, `Tab`, `ShiftLeft`, `ShiftRight`, `ControlLeft`, `AltLeft`. `Escape` verlässt das Spiel immer.
Im Editor nimmt „Taste drücken“ eine Taste auf. Auf Touch-Geräten zeigt das Spiel stattdessen Bedienelemente.

| Funktion                      | Einstellung        | Standardtasten                     |
| ----------------------------- | ------------------ | ---------------------------------- |
| Links                         | `keys.left`        | `ArrowLeft`, `KeyA`                |
| Rechts                        | `keys.right`       | `ArrowRight`, `KeyD`               |
| Hoch                          | `keys.up`          | `ArrowUp`, `KeyW`                  |
| Runter                        | `keys.down`        | `ArrowDown`, `KeyS`                |
| Springen und klicken          | `keys.jump`        | `KeyE`                             |
| Driften                       | `keys.drift`       | `Space`, `ShiftLeft`, `ShiftRight` |
| Hupen                         | `keys.honk`        | `Enter`, `KeyH`                    |
| Ein- und Aussteigen, Aufheben | `keys.use`         | `KeyF`                             |
| Upgrades öffnen               | `keys.shop`        | `KeyU`                             |
| Punch                         | `moves.punch.keys` | `Space`                            |
| Kick                          | `moves.kick.keys`  | `KeyQ`                             |
