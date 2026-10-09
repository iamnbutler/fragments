---
id: 01M4F6EP17488DJACYCGWCGHEM
anchor: '@file'
created: 2026-10-09T02:04:11Z
norm: '1'
---

No media in the repo (Nate, Oct 2026): images, video and fonts live in R2 bucket fragments-media and are listed in src/media.json. Keys are content-hashed and served immutable for a year, so a changed file must get a new key via npm run media -- put, never be overwritten in place.
