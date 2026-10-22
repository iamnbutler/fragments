---
id: 01M4F6EP17488DJACYCGWCGHEM
anchor: '@file'
created: 2026-10-09T02:04:11Z
norm: '1'
sig: e3b0c44298fc1c14
body_hash: 3ed879b759f6442e
raw_hash: 98151254f444e37a
vouched: 2026-10-22T00:32:32Z
lines: 1-28
---

No media in the repo (Nate, Oct 2026): images, video and fonts live in R2 bucket fragments-media and are listed in src/media.json. Keys are content-hashed and served immutable for a year, so a changed file must get a new key via npm run media -- put, never be overwritten in place.
