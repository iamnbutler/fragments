---
id: 01M5GGC6ZECEZJYZ0T8F27FHRF
anchor: '@file'
created: 2026-10-22T00:32:32Z
norm: '1'
---

Agentation's own toggle is Cmd/Ctrl+Shift+F; Ctrl+Shift+A (Control even on Mac) forwards to it, because Chrome reserves Cmd+Shift+A for tab search and pages never see it. A modal <dialog> makes the page inert, so the toolbar is re-rendered with portalContainer=<the modal>, which Agentation shows as a manual popover in the top layer.
