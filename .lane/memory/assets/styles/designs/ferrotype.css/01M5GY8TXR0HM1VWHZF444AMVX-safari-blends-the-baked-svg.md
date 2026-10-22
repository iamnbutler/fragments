---
id: 01M5GY8TXR0HM1VWHZF444AMVX
anchor: '@file'
created: 2026-10-22T04:35:22Z
norm: '1'
---

Safari blends the baked SVG's internal mix-blend-mode:multiply plates with whatever is behind the background image; on the black plate that turns the tintype nearly black. The opacity:0.999 + isolation group on .fe-tintype .inkfig-plates is the fix (isolation alone, will-change, translateZ and filter did not work).
