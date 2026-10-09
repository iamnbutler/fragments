---
id: 01M4F0H5GRJ9X7ZTA9DEGZMEWM
anchor: function paint
created: 2026-10-09T00:20:41Z
norm: '1'
---

Print colours come from PRINT_PALETTES and PAPERS in src/lib/spectrum.ts, passed as uniforms; change palettes there, not in the GLSL. Motif ids are indices into PRINT_MOTIFS, so keep that array's order in step with the u_motif branches.
