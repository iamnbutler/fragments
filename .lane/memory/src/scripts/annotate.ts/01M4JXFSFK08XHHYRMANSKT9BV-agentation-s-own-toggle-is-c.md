---
id: 01M4JXFSFK08XHHYRMANSKT9BV
anchor: '@file'
created: 2026-10-10T12:44:28Z
norm: '1'
sig: e3b0c44298fc1c14
body_hash: c234b62e21900069
raw_hash: d519a72efdcd382f
lines: 1-33
supersedes: 01M4JXEHTF566FMEKENT2QBK7Y
---

Agentation's own toggle is Cmd/Ctrl+Shift+F; Ctrl+Shift+A (Control even on Mac) forwards to it, because Chrome reserves Cmd+Shift+A for tab search and pages never see it. A modal <dialog> makes the page inert, so the toolbar is re-rendered with portalContainer=<the modal>, which Agentation shows as a manual popover in the top layer.
