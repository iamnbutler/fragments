---
id: 01M5GGC6YTEG154TA8PPD6RNMV
anchor: function afterLoad
created: 2026-10-22T00:32:32Z
norm: '1'
---

The cover still is the LCP element. The cover press (WebGL) and flats load only after load + idle so they don't delay it; cover-press must clear the img srcset before swapping src, or the srcset keeps winning.
