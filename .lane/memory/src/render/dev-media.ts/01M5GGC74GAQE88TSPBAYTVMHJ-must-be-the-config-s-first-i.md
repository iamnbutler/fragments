---
id: 01M5GGC74GAQE88TSPBAYTVMHJ
anchor: '@file'
created: 2026-10-22T00:32:32Z
norm: '1'
sig: e3b0c44298fc1c14
body_hash: 10568f60aed40d8e
raw_hash: 24aec258b55ec56d
lines: 1-8
---

Must be the config's first import: covers.ts resolves media URLs at module load, so FRAGMENTS_MEDIA_ORIGIN has to be set before any lib module evaluates, or dev pages point /m/ at bongo's own server, which 404s.
