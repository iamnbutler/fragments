---
id: 01M5GY8KCQ1S8MNBZHJVH5S5Q3
anchor: .fe-tintype .inkfig-plates { isolation
created: 2026-10-22T04:35:14Z
norm: '1'
---

Safari blends the baked SVG's internal mix-blend-mode:multiply plates with whatever is behind the background image; on the black plate that turns the tintype nearly black. The opacity:0.999 + isolation group is the fix (isolation alone, will-change, translateZ and filter did not work).
