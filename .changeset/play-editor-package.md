---
'@hello-eme/play-editor': minor
'@hello-eme/play-payload': minor
'@hello-eme/play-schema': minor
---

New package `@hello-eme/play-editor`: the configuration editor for any page, with no framework to set up (`PlayEditor.mount`, the `editor.js` of a release, or `import { mount }`), a built-in live preview, and a React component at `@hello-eme/play-editor/react`; `@hello-eme/play-payload` now wraps that component. New in the editor: quick settings and a simple mode, presets as cards that can be tried in the live preview, a balance check with a practice bot, problems shown at their field with a jump to it, a flow view of what triggers what, picture drag-and-drop with size and sheet detection, undo and redo, reset per tab, JSON download and load, and a searchable guide. The schema package generates the configuration reference (`buildReference`, `referenceMarkdown`; `docs/REFERENCE.md` and `docs/REFERENCE.de.md`).
