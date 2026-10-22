# _fragments

Nate Butler's site, printed as a riso zine: a static site built with
[bongo](https://bongo.build) and served by a Cloudflare Worker, with media in R2.

## Develop

Use Node 24.

```sh
npm ci
npm run dev          # bongo dev; media comes from the deployed worker
npm test             # unit tests
npm run check        # type-check libraries, scripts, tests and the worker
npm run test:build   # build, then check the output (tests/build-smoke.mjs)
npm run preview      # build and serve with wrangler, as deployed
```

`npm run dev` reads media from `MEDIA_ORIGIN`, which defaults to
https://fragments.iamnbutler.workers.dev.

## Layout

- `content/d/*.md`: features, with front matter for title, dek, figures and
  links; each is a page at `/d/<slug>/`.
- `content/e/*.md`: essays, each a page at `/e/<slug>/`.
- `content/index.hbs`, `content/styleguide.hbs`: the issue, and the house
  style with every spread design.
- `bongo.config.ts`: the Markdown loader for those pages, and the partials
  that render the issue and the styleguide.
- `layouts/html.hbs`: the document around every page: head, fonts, scripts.
- `src/render/`: the pages and spreads as HTML strings; `drafts.ts` holds
  each feature's art-directed design.
- `src/lib/zine.ts`: imposition, turning pieces into spreads and pages.
- `src/lib/issue.ts`: issue number, season and cover.
- `assets/`: client scripts (`scripts/entry/` are the per-page entries) and
  styles.
- `worker/index.ts`: serves `public/` and media from R2.

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
