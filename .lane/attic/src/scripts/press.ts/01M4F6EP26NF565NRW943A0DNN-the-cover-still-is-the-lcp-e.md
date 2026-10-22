---
id: 01M4F6EP26NF565NRW943A0DNN
anchor: function afterLoad
created: 2026-10-09T02:04:11Z
norm: '1'
sig: 7fe5951fb413114c
body_hash: c7bb1184df595b96
raw_hash: 6f5e58ab735cefd7
lines: 102-106
---

The cover still is the LCP element. The cover press (WebGL) and flats load only after load + idle so they don't delay it; cover-press must clear the img srcset before swapping src, or the srcset keeps winning.
