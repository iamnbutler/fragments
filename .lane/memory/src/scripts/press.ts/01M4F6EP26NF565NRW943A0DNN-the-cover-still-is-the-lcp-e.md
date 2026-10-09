---
id: 01M4F6EP26NF565NRW943A0DNN
anchor: function afterLoad
created: 2026-10-09T02:04:11Z
norm: '1'
---

The cover still is the LCP element. The cover press (WebGL) and flats load only after load + idle so they don't delay it; cover-press must clear the img srcset before swapping src, or the srcset keeps winning.
