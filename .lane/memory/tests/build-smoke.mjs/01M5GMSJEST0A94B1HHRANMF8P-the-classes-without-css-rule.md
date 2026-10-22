---
id: 01M5GMSJEST0A94B1HHRANMF8P
anchor: '@file'
created: 2026-10-22T01:49:44Z
norm: '1'
sig: e3b0c44298fc1c14
body_hash: f59c886f1d705f72
raw_hash: bf792361503e2809
vouched: 2026-10-22T04:35:14Z
lines: 1-59
supersedes: 01M4F6EP2F3PTVJCT749SDFAKF
---

The 'classes without CSS rules' check exists because a commit once deleted the desktop-tools spread CSS and the spreads shipped unstyled. Each piece's design keeps its rules in assets/styles/designs/<slug>.css, imported from site.css; extend the class-prefix list when a design adds a new prefix.
