---
id: 01M4HYEHCN1FS18GYZTAZ7R50D
anchor: function figMotion
created: 2026-10-10T03:42:01Z
norm: '1'
---

A figure animates when media has '<name>-motion' (SMIL loop, same viewBox as the still). Loops must be decoded before the mask swaps or the plate renders blank; the SVG-as-mask ignores prefers-reduced-motion internally, so gating is done here and in drafts.css, and .flat clones are forced back to the still.
