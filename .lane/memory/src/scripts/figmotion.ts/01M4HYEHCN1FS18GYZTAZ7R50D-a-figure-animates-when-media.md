---
id: 01M4HYEHCN1FS18GYZTAZ7R50D
anchor: function figMotion
created: 2026-10-10T03:42:01Z
norm: '1'
sig: 0e8e0edad7f55874
body_hash: 7715407ba4a1fb23
raw_hash: 3d82ae958e5f82a7
lines: 19-38
---

A figure animates when media has '<name>-motion' (SMIL loop, same viewBox as the still). Loops must be decoded before the mask swaps or the plate renders blank; the SVG-as-mask ignores prefers-reduced-motion internally, so gating is done here and in drafts.css, and .flat clones are forced back to the still.
