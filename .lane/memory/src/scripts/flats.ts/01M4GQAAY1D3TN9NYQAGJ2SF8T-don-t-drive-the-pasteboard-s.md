---
id: 01M4GQAAY1D3TN9NYQAGJ2SF8T
anchor: const settle
created: 2026-10-09T16:18:09Z
norm: '1'
---

Don't drive the pasteboard's scale from rAF: Chrome re-rasters the whole board at each new scale and at 2560x1440@2x frames go out blank (issue #1). The spring is sampled up front and played as a WAAPI transform; only --fade/--chrome step from script. rAF timestamps can precede performance.now(), so clamp elapsed at 0.
