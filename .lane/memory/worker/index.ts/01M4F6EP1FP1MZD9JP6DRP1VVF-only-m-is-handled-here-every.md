---
id: 01M4F6EP1FP1MZD9JP6DRP1VVF
anchor: '@file'
created: 2026-10-09T02:04:11Z
norm: '1'
---

Only /m/* is handled here; everything else is the static assets binding. Media responses go through caches.default because R2 reads aren't edge-cached on their own; Range (206) and If-None-Match (304) matter for the cover loops.
