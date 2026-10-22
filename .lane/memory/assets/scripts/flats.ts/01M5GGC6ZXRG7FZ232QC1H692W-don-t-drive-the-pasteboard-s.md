---
id: 01M5GGC6ZXRG7FZ232QC1H692W
anchor: const settle
created: 2026-10-22T00:32:32Z
norm: '1'
sig: 99cc9c2bafd769f2
body_hash: 61720d08e33f37d6
raw_hash: 54d80e3f578078ee
lines: 190-215
---

Don't drive the pasteboard's scale from rAF: Chrome re-rasters the whole board at each new scale and at 2560x1440@2x frames go out blank (issue #1). The spring is sampled up front and played as a WAAPI transform; only --fade/--chrome step from script. rAF timestamps can precede performance.now(), so clamp elapsed at 0.
