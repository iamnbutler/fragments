---
id: 01M5GGC709RAAEG1SF8N8BQTR6
anchor: function figMotion
created: 2026-10-22T00:32:32Z
norm: '1'
---

A figure animates when media has '<name>-motion' (SMIL loop, same viewBox as the still). Loops must be decoded before the mask swaps or the plate renders blank; the SVG-as-mask ignores prefers-reduced-motion internally, so gating is done here and in drafts.css, and .flat clones are forced back to the still.
