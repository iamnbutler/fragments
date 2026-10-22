---
id: 01M5GGC6Z4TVKD4S0ZQNWATJZ6
anchor: '@file'
created: 2026-10-22T00:32:32Z
norm: '1'
---

Agentation is PolyForm Shield (internal use) and needs React; layouts/html.hbs loads this script only when $site.dev (bongo dev), so production never bundles it, and the build smoke test checks that. Notes pin by element path including section#p-N, but text inside [data-flow] frames is re-poured per window size, so notes on paragraphs can drift; notes on figures/titles/spreads hold.
