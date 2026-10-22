---
id: 01M5GGC6YCC3ZXRZXCSBGV4A8R
anchor: function seen
created: 2026-10-22T00:32:32Z
norm: '1'
---

Folded sheets keep their layout (height:0 + visibility:hidden, not display:none) so copyfit pours text correctly and Flats clones stay right. SHIP=false keeps it dev/?fold-only (dev is data-dev on <html>, set by layouts/html.hbs) and asks on every load; flip SHIP to launch. fr_seen packs one bit per spread per piece key, so reordering a piece's spreads invalidates its marks.
