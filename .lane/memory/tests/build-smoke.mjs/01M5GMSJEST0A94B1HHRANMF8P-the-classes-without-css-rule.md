---
id: 01M5GMSJEST0A94B1HHRANMF8P
anchor: '@file'
created: 2026-10-22T01:49:44Z
norm: '1'
sig: e3b0c44298fc1c14
body_hash: 24a9ec9efc443d28
raw_hash: 8aa4973670db1220
vouched: 2026-10-22T19:38:40Z
lines: 1-59
supersedes: 01M4F6EP2F3PTVJCT749SDFAKF
---

The 'classes without CSS rules' check exists because a commit once deleted the desktop-tools spread CSS and the spreads shipped unstyled. Each piece's design keeps its rules in assets/styles/designs/<slug>.css, imported from site.css; extend the class-prefix list when a design adds a new prefix.
