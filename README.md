# _fragments

Nate Butler's site, printed as a riso zine: an Astro static site served by a
Cloudflare Worker, with media in R2.

## Develop

Use Node 22.

```sh
npm ci
npm run dev          # astro dev; /m/ media is proxied to the deployed worker
npm test             # unit tests
npm run check        # type-check libraries, scripts, tests and the worker
npm run test:build   # build, then check the output (tests/build-smoke.mjs)
npm run preview      # build and serve with wrangler, as deployed
```

`npm run dev` reads media from `MEDIA_ORIGIN`, which defaults to
https://fragments.iamnbutler.workers.dev.

## Layout

- `content/drafts/*.md`: pieces, with front matter for title, dek, figures
  and links. A piece prints as a PROOF until it sets `proof: false`.
- `src/pages/index.astro`: the issue (cover, bio, then each piece's spreads).
- `src/pages/d/[slug].astro`: a piece on its own page.
- `src/pages/styleguide.astro`: the house style and every spread design.
- `src/components/riso/`: spreads; `drafts/` holds each piece's art-directed design.
- `src/lib/zine.ts`: imposition, turning pieces into spreads and pages.
- `src/lib/issue.ts`: issue number, season and cover.
- `worker/index.ts`: serves `dist/` and media from R2.

## Media

There are no images, video or fonts in the repo. They live in the R2 bucket
`fragments-media` under content-hashed keys, listed in `src/media.json`, and
the worker serves them at `/m/<key>` with year-long immutable caching. Code
refers to media by name with `media('covers/062817')`; an unknown name fails
the build.

```sh
npm run media -- put <file> <name> [--width 1600] [--quality 78] [--crf 28] [--dry-run]
npm run media -- ls
```

`put` re-encodes images to WebP and video to H.264, uploads with wrangler,
and records the file in `src/media.json`; commit that change. Putting a name
again replaces its entry; the old object stays in the bucket. It needs
`magick`, `ffmpeg` and a logged-in wrangler.

## Deploy

Pushes to `main` deploy through `.github/workflows/deploy.yml`, after tests,
type checks and the build smoke checks. It needs two repository secrets:
`CLOUDFLARE_API_TOKEN` (a token from the "Edit Cloudflare Workers" template)
and `CLOUDFLARE_ACCOUNT_ID`. To deploy by hand, run `npm run deploy`.
