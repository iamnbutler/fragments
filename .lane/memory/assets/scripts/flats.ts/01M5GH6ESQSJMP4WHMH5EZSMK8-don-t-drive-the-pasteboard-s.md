---
id: 01M5GH6ESQSJMP4WHMH5EZSMK8
anchor: const settle
created: 2026-10-22T00:46:52Z
norm: '1'
---

Don't drive the pasteboard's scale from rAF: Chrome re-rasters the whole board at each new scale and at 2560x1440@2x frames go out blank (issue #1). The spring is sampled up front and played as WAAPI transform+opacity on the board, and opacity on the backdrop. Don't step custom properties on .flats per frame either: it restyles and repaints every clone (14.6% dropped frames vs 3%). Labels fade in only at rest. rAF timestamps can precede performance.now(), so clamp elapsed at 0.
