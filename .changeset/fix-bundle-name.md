---
'@hello-eme/play': patch
---

The drop-in bundle is now `dist/play.iife.js` (still exported as `@hello-eme/play/play.js`). It used to overwrite the compiled `dist/play.js`, so `import { createPlay } from '@hello-eme/play'` failed in bundlers.
