---
'@hello-eme/play-schema': minor
'@hello-eme/play-core': minor
'@hello-eme/play': minor
---

Wave scripts (`waves`: timed steps that run the usual actions, per level range), boss phases (`phases` on a boss entity: stat changes, message and actions below a health percentage) and per-page configuration (`pages`: `{ match, config }` merged over the base for the pages whose path matches). The game follows `popstate` and the Navigation API and starts a fresh round when the settings change; `play.setPath(path)` is for routers the browser can't see. Existing JSONs keep working.
