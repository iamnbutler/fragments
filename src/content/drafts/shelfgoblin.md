---
title: Shelf Goblin
slug: shelfgoblin
date: 2026-09-19
dek: A small audiobook catalog for LitRPG and progression fantasy, which turned out to be mostly about writing down what you don't know.
kicker: Side Project
draft: true
repo: https://github.com/iamnbutler/shelfgoblin
links:
  - label: Open Shelf Goblin
    url: https://shelfgobl.in/
  - label: Catalog inspector
    url: https://shelfgobl.in/inspector/
  - label: Source on GitHub
    url: https://github.com/iamnbutler/shelfgoblin
  - label: LitRPG Chart (the April version)
    url: https://github.com/iamnbutler/litrpg-chart
facts:
  - label: What
    value: Audiobook catalog and series tracker for LitRPG and progression fantasy
  - label: Stack
    value: SvelteKit 2, Svelte 5, TypeScript, static build
  - label: Accounts
    value: Cloudflare Worker + D1, GitHub sign-in (optional)
  - label: Catalog
    value: 4,474 books in the October 8, 2026 public snapshot
  - label: Refresh
    value: Daily at 08:17 UTC, skipped 22:00–02:00 UTC
  - label: Lineage
    value: LitRPG Chart (April 2026) → LitRPG Hub → Shelf Goblin (September 2026)
  - label: Repos
    value: Public app + private catalog producer
  - label: Status
    value: Live at shelfgobl.in
pullquotes:
  - "Missing data stays missing. Unknown is a real answer."
  - "A finished story and a finished audiobook series are two different facts."
  - "The goblin is mostly a bookkeeper."
images:
  - src: /drafts/shelfgoblin/home.jpg
    alt: Shelf Goblin's home screen, a grid of audiobook covers for series like Dungeon Crawler Carl, Cradle and The Primal Hunter on a warm off-white background.
    caption: The front door is the shelf. No landing page, no hero, just covers, sorted by popularity.
  - src: /drafts/shelfgoblin/series.jpg
    alt: The Dungeon Crawler Carl series page, showing the cover, description, a follow button, a progress bar reading "Not started", and reader impressions split into impressions and critiques.
    caption: A series page. Note the small line under the progress bar, "This list may be incomplete."
  - src: /drafts/shelfgoblin/inspector.jpg
    alt: The catalog inspector, a dark table of core series with percentage scores for data completeness and evidence, and per-column statuses like Verified, Missing and Unknown.
    caption: The inspector scores the catalog's data, never the books.
  - src: /drafts/shelfgoblin/fig1-refresh.svg
    alt: Patent-style line drawing of the daily refresh. Sources flow into a database and enrichment step inside a dashed private boundary, through a padlocked checkpoint, out to a public JSON file, a checklist, a clock and finally a bookshelf.
    caption: Fig. 1. The daily refresh, from private sources to the public shelf.
art: >-
  The metaphor is a goblin's ledger: a hoarder who keeps meticulous books on
  books. Draw it as a patent filing for "Apparatus for the Keeping of Shelves"
  in black line art, with numbered reference callouts (10, 12, 14...) on a
  bookshelf, a padlock, a stopwatch and a stack of source sheets, based on
  Fig. 1. Ink pairing: fluorescent pink and black for the opener, with the
  real cover grid screenshot run as a coarse pink halftone so the covers
  become a wall of dots and only the titles stay legible in black; save blue
  for the "unknown" material and orange for the clock/window motifs. Three
  spreads. Spread 1, the opener: huge "SHELF GOBLIN" set across the gutter
  over the halftoned cover wall, the goblin emoji (🪎) blown up to a full-bleed
  stamp, dek and kicker in a corner. Spread 2, "Unknown is a real answer": a
  specimen sheet of the content verdicts (Present / Absent / Unknown, with a
  confidence bar) laid out like a paint-chip card, plus a fake library due-date
  card for the audio-coverage freshness rules (7 days / 180 days) with
  rubber-stamped dates; the series page screenshot as a clipping with the
  "This list may be incomplete" line circled in orange. Spread 3, the
  machinery: Fig. 1 as the full patent plate, the six-step refresh list set
  as a big numbered column in blue, the inspector screenshot halftoned in
  blue as a clipping, and a clock face in orange marking the 22:00–02:00 dead
  zone. Close with a small fake shelf label/spec card listing the facts.
---

I listen to a lot of LitRPG. If you don't know the genre: it's fantasy where the world runs on game mechanics, so there are levels and stat screens and the hero is usually stuck in a dungeon with a talking cat. The books come out fast, the series run long, and most people (me included) listen to them as audiobooks instead of reading them.

That combination is surprisingly hard to keep track of. Ebooks come out before the audiobook. Series get republished under new editions. Some of the "narrators" turn out to be synthetic voices. I wanted something like AniChart, a page that just tells me what's coming out, but for this little corner of Audible.

## Version one was a chart

In April I built [LitRPG Chart](https://github.com/iamnbutler/litrpg-chart), whose repo description is literally "anichart for litrpg/cultivation." It started as a page that fetched Audible search results, and within a day it was building static data at build time and rebuilding weekly. Over the next couple of days it gained a SQLite database, more sources (Hardcover for enrichment, Royal Road for discovery), a historical backfill, a filter for AI-narrated "Virtual Voice" books, and an author blocklist. A lot of that work was done by coding agents picking up individual issues, which is why the history from those days reads like a todo list being crossed off.

It worked, kind of. It also taught me the main lesson of the whole project. The blocklist approach was blunt: an author list for harem and erotic content, keyword patterns for subgenres. Each fix made something else wrong, and the data had no way to say "I'm not sure."

## Version two is a shelf

In September I came back to it, rebuilt it as "LitRPG Hub," and renamed it Shelf Goblin a day later, along with a domain I couldn't resist: shelfgobl.in.

It's a reading tool now, not a release chart. You land on a grid of covers. You can follow a series, mark books read, see what's up next, and find similar series. Your library lives in the browser, and if you sign in with GitHub it syncs across devices through a small Cloudflare Worker and a D1 database. You never have to sign in.

The house rules for the UI are short. No landing page, no hero, no slogans. Book covers supply the visual interest. Pipeline words stay out of anything a reader sees. That's partly taste and partly an admission that the covers are better art than anything I'd put there.

## Unknown is a real answer

The part I'm actually proud of is how the catalog handles not knowing things.

Every book carries a set of separate content judgments: sexualized marketing, explicit scenes, harem, AI narration, disclosed AI writing, and listing quality. Each one has a verdict, a confidence, a source, and a note. Plenty of them say "unknown," with a confidence of zero and the note "Not enough source information to assess." That's on purpose. Missing data stays missing. Unknown is a real answer.

The categories are kept apart because they get conflated constantly. A romance subplot isn't graphic sex. A cast with several women isn't a harem. An AI narrator says nothing about who wrote the book. And a model getting a vibe that the prose is generic is never treated as proof of anything. Filters hide things; they never delete records or your reading history.

Audio has the same problem in a different shape. A finished story and a finished audiobook series are two different facts. The app tracks audio coverage separately, with an expiry date. An active series' bibliography is trusted for seven days, and a reviewed, fully released one for up to 180. When that runs out, the app stops claiming it knows. That's why a series page can say "This list may be incomplete" even for Dungeon Crawler Carl.

## Two repos, one door

The app is public. The catalog is not. Scraping, the SQLite database, source evidence, model calls and backups all live in a private repo, `shelfgoblin-data`. The public repo only ever sees derived JSON snapshots: bibliographic facts, cover links, reviewed descriptions, classifications, and derived reader context. Builds and page loads never scrape anything or call a model.

The two sides share a small TypeScript package, the catalog contract, which holds the public types and the pure logic for identity, editions, series, audio coverage and recommendations. The producer installs it from a versioned, immutable release archive instead of reaching into a sibling checkout.

Every morning a GitHub Actions job runs the refresh:

1. At 08:17 UTC, restore and verify the private catalog snapshot.
2. Fetch and enrich a bounded batch of work, within a fixed time budget.
3. Save a private checkpoint. If that fails, nothing goes public.
4. Commit only the allowed public JSON to the public repo.
5. On a fresh runner with no private data or secrets, check out that exact commit and run type checks, tests and the build.
6. Deploy to Cloudflare, but only if it's still outside the 22:00–02:00 UTC window and `main` hasn't moved on.

Most of the README is about what happens when one of those steps goes wrong, which feels right. A deploy that arrives late gets deferred instead of forced. A newer commit on `main` stops the deploy instead of rolling the app back.

## The inspector

There's a second page, the [catalog inspector](https://shelfgobl.in/inspector/), for me rather than for readers. It lists the core series and scores how complete their data is and how good the evidence behind it is. It scores the data, never the books. As I write this it reports 82% average data completeness across 88 core series and 49% evidence quality, with a lot of "Missing" in the cover, metadata and reader-evidence columns. Much of the source data is still from the April snapshot. So: not done.

There are experimental quality scores and taste profiles in the private repo too, but they stay there until they're calibrated. I'd rather ship no ranking than a confident-looking wrong one.

## Where it's at

It's live, it refreshes daily, and I use it. The public snapshot has a few thousand books in it, some of which are clearly not LitRPG and are flagged as needing review. Similar-series matching works, but I'd call it a first pass.

What I keep coming back to is that the hard part was never the grid of covers. It was deciding what the system is allowed to claim. The goblin is mostly a bookkeeper.
