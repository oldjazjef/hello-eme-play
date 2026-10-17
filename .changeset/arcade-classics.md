---
'@hello-eme/play-schema': minor
'@hello-eme/play-core': minor
'@hello-eme/play': minor
'@hello-eme/play-editor': minor
'@hello-eme/play-payload': minor
---

Arcade games. Steering: `game.control` (`ship` with inertia, `grid` cell by cell with tail and crash, `slide` for paddles), `game.arena: screen` (the window, the page stays put), `game.respawn`, `game.pit`, `game.stomp`, `view.airJumps`. Behaviors `drift`, `bounce`, `paddle`, `patrol` and `ghost`; `split`, `respawn`, `shape: bar`. Items can be `box`-shaped, `platform`s, `float`, break after `hp` bounces and be `required` for the new goal `clear`. Maps draw a level as text (`maps`, `levels[].map`). Boss `attacks` with warnings, `weakSpot` and `shieldedBy`. New events `lost`, `split`, `stomp`, `attack`; new actions `grow`, `toStart`, `checkpoint`, `launch`, `scare`; `spawn` can put a monster in front of the figure. Throwables can `auto`-fire while the key is held and look like a `bullet`. Eight new example games `retro-*`: Asteroids, Frogger, Snake, Pac-Man, Breakout, Pong, a platformer and boss fights.
