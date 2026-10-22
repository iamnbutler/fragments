---
id: 01M5GZ3XJ1EZN4DX59JBQ12TEJ
anchor: '@file'
created: 2026-10-22T04:50:09Z
norm: '1'
supersedes: 01M4F6EP1FP1MZD9JP6DRP1VVF
---

The Worker only runs when no static asset matches. It serves /m/* from R2 and passes the GitHub Pages project paths through (pages.ts); everything else goes to the assets binding. Media responses go through caches.default because R2 reads aren't edge-cached on their own; Range (206) and If-None-Match (304) matter for the cover loops.
