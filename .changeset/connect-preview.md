---
'@hello-eme/play': minor
---

New `connectPreview(play, adminOrigin, transform?)` for websites that bundle the game: it plays the configuration the CMS admin sends (live preview) and says "ready". `transform` adds what the site owns, such as texts and language. The drop-in build uses it for `data-preview`.
