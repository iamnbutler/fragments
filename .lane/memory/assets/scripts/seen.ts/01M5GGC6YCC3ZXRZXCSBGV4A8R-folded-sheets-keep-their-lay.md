---
id: 01M5GGC6YCC3ZXRZXCSBGV4A8R
anchor: function seen
created: 2026-10-22T00:32:32Z
norm: '1'
sig: 31dde061b5ea56eb
body_hash: 8c4a135f0b452926
raw_hash: f4dc1c14e9bd01ad
lines: 195-267
---

Folded sheets keep their layout (height:0 + visibility:hidden, not display:none) so copyfit pours text correctly and Flats clones stay right. SHIP=false keeps it dev/?fold-only (dev is data-dev on <html>, set by layouts/html.hbs) and asks on every load; flip SHIP to launch. fr_seen packs one bit per spread per piece key, so reordering a piece's spreads invalidates its marks.
