---
title: "The Next Agent Already Knows"
slug: autoblog
date: 2026-10-17
kicker: autoblog
dek: "[autoblog](https://github.com/iamnbutler/autoblog) gives every coding agent I run one shared, private journal. What one agent works out, the next one is pointed at before it starts."
repo: https://github.com/iamnbutler/autoblog
links:
  - label: iamnbutler/autoblog
    url: https://github.com/iamnbutler/autoblog
  - label: The bar (prompts/bar.md)
    url: https://github.com/iamnbutler/autoblog/blob/main/prompts/bar.md
  - label: How it works
    url: https://github.com/iamnbutler/autoblog/blob/main/docs/how-it-works.md
  - label: Backfilling from your history
    url: https://github.com/iamnbutler/autoblog/blob/main/docs/backfill.md
  - label: lane
    url: https://lane.lukeed.com/usage/
facts:
  - label: Runs with
    value: Claude Code and Codex, through their hooks
  - label: Writes
    value: Notes, posts and a timeline, all titled by topic
  - label: Needs
    value: Bun, an authenticated gh, and the claude CLI
  - label: Where it lives
    value: A private GitHub repo, read as an Obsidian vault or a site behind Cloudflare Access
images:
  - src: figs/autoblog/fig-1-checkpoint
    alt: "One session's transcript runs into the Stop hook at the end of every turn; only the bytes after the last checkpoint are read, and once 40 tool calls have piled up the hook asks the agent that did the work to reflect, while under 40 it stops as usual. The agent can grep its own transcript, then skips, revises or writes: on this Mac from October 19 to 21 that was 49 skips, 28 revisions and 15 new entries. Revisions and writes go to the vault, which is synced to a private repo, linked and redeployed as the site; a dashed fallback sweep, every 20 minutes, covers transcripts no hook ever claimed."
    caption: "Fig. 1. The agent that did the work decides, and most checkpoints end in a skip."
  - src: figs/autoblog/fig-2-two-passes
    alt: "Two columns from the same 229 transcripts. The first pass: eight agents, one writer per slice of history, about ten minutes, 77 posts (90 with the test runs), titled after incidents such as 'Sixty PRs shipped overnight against a locked screen were sixty unverified PRs', struck through because all 91 entries were archived. The second pass: harvest (about 145 candidates), curate (52 in the plan, merged across projects, thin ones cut), write (18 posts, 35 notes), titled by topic such as 'Keeping long-running work alive when the screen locks'."
    caption: "Fig. 2. The same history, written twice: once as incidents, then as topics."
  - src: figs/autoblog/fig-3-recall
    alt: "The prompt 'set up testflight for this project' loses its common words (set, up, for, this); 'testflight' names one entry and 'project' names two, both rare, since a word is rare if it names at most 7 of 238 entries in their titles or tags. Ranked by title 5, tags 3, headings 2 and body half a use up to 4, each times the word's rarity, 'Shipping to TestFlight from the command line and CI' is the only entry above half the top score, so the agent is told it exists and to read it first, once per conversation. A post and a note also matched but fall below the line. A second prompt, 'update the tests and push, make the button blue', keeps tests (names 13 entries), button and blue (none), and reaches nothing."
    caption: "Fig. 3. Recall. One rare word, one note."
  - src: figs/autoblog/fig-4-timeline
    alt: "Fifteen rows, 2012 to 2026, each a year from January to December with a tick for every day that has a line in the timeline; taller ticks mean more lines, capped at 11. The log starts on 2012-02-01, is sparse through 2020 (2 to 31 days a year), fills in from 2021 (54, 56, 163, 111, 132 days) and is densest in 2026 (155 days), ending today, October 21."
    caption: "Fig. 4. The timeline goes back to 2012: 770 days with something worth a line."
  - src: figs/autoblog/ill-1-card
    alt: "A card-file drawer of index cards with one card lifted out above the others, its tab marked."
---

I forget most of what I build with agents. Not the projects, the know-how: how we signed that Mac app, why the Worker kept serving the old page, which flag the TV needed. Every session that works something out knows it completely, and none of the sessions after it can see it.

[autoblog](https://github.com/iamnbutler/autoblog) fixes that with a journal every agent shares. While [Claude Code](https://claude.com/product/claude-code) and [Codex](https://developers.openai.com/codex) work, they stop now and then and decide whether anything they learned belongs in it. Usually nothing does. When something does, it's written as a short page titled by topic, into a private repo. When I later start something the journal covers, the agent is told the page exists and reads it first.

## What it's for

It stops me solving things twice. I set up macOS signing and [TestFlight](https://developer.apple.com/testflight/) six or seven times in two months, for different apps, and each time the agent started from scratch and hit the same walls. Now "set up testflight for this project" brings up "Shipping to TestFlight from the command line and CI" before the agent does anything, and it starts from the way we do it, not from the internet.

It carries knowledge across projects, because a note isn't about one repository. "Shipping Mac app updates with Sparkle" draws on four apps. "Secrets and coding agents" draws on six. "Hosting a static site on a Cloudflare Worker" covers four, this site among them. Each project adds the pitfall it found to the same page, so the page gets better wherever the work happens.

I can ask any agent, in any project, "how did we do that again?", and it searches the journal. I can read it myself too: it's an [Obsidian](https://obsidian.md/) vault and a small private site, and every page on the site has a box for adding a note, which an agent folds into the page.

For "when did I do that?" there's the timeline, a work log across everything, a few lines a day per project, going back to 2012. It's for dates and sequence, and for remembering that a project existed at all.

## Using it

```bash
git clone https://github.com/iamnbutler/autoblog ~/code/autoblog
~/code/autoblog/bin/autoblog init --owner nate
```

`init` creates the private journal repo, clones it as a vault and installs hooks into Claude Code and Codex. After that it's automatic. A few phrases do the rest:

- **"Make a note of this"** or **/autoblog** writes something now, when I know it's worth keeping.
- **"Pause autoblog"** keeps a conversation out entirely: no checkpoints, no timeline, no backfill, even after it's resumed.
- **`autoblog backfill`** goes back through old Claude Code and Codex transcripts, your prompt history and any backups you point it at, so a new journal doesn't start empty. It writes a plan first, which you read and edit before anything is written.

## How it decides

The agent that did the work is the one that decides. A Stop hook counts tool calls, and every 40 it asks the agent to reflect before it stops. The prompt leads with the default, "Most checkpoints produce nothing", and points the agent at its own transcript so it can recover what compaction dropped. An outside reviewer reading a condensed transcript would miss most of a session that ran for days; the agent in it doesn't.

From there the agent skips, revises or writes, held to [a bar](https://github.com/iamnbutler/autoblog/blob/main/prompts/bar.md) that is most of the project:

- **Topics, not incidents.** An entry is titled by what someone would search for: "Keeping long-running work alive when the screen locks", not "Sixty PRs shipped overnight against a locked screen". The first backfill wrote 77 incident stories, accurate and useless (Fig. 2), and all of them were archived.
- **Notes are the common case.** They answer "what do I need to know about X?" and grow by pitfalls. Posts are rare: a project or a way of working, close to something I'd publish.
- **Revise almost never.** An entry changes when it's wrong, or when a note is missing a pitfall that belongs on that exact page. A post is never extended into a changelog of its project.
- **Skips say why.** "Routine feature work." "Already covered in the lane note." "Unverified against a live service yet; nothing settled worth journaling until it's smoke-tested."

Links between entries are a separate step. After every write, a model picks the phrases that name other entries, and code inserts the links, so nothing an agent wrote gets reworded. The timeline is written by a model too, from idle sessions: each day gets at most three lines per project, rewritten as a set so later work folds into earlier lines.

## How recall works

A second hook runs on every prompt I send. It ranks the journal against the prompt: a word in an entry's title or tags counts most, and a word that appears all over the journal counts for little. If a rare word names an entry clearly enough, the agent gets a line saying the entry exists and to read it before starting (Fig. 3). "Update the tests and push, make the button blue" reaches nothing, which is right. It takes about 80 ms, and an entry is mentioned at most once per conversation.

## Caveats

- **It's private by design.** The machinery is public; the journal never is. Publishing a note is a separate, deliberate act.
- **Revisions replace the whole page.** An agent working from a compacted context could drop good material while adding a line. Git keeps every version, but nobody would notice.
- **Near-duplicates.** An agent can decide its case is different enough and write "Notarizing in CI" next to the signing note.
- **Recall is lexical.** It matches words, not meaning, so it misses a page whose title uses different words, and it occasionally points at a page that only shares a rare word.
- **Old history has holes.** Claude Code deletes transcripts after 30 days by default, so a backfill often has only your side of the conversation. Old prompts are also where pasted secrets turn up; the backfill reports them for rotation and doesn't copy them.
- **Several machines can write at once.** Each commit fetches and merges first and timeline days merge by union, but a push that fails quietly can leave one machine far behind.
- **No figures.** Entries are text.

The point is that it happens without me. I don't decide what to keep; the agent that just did the work does, and the next agent starts where it left off.
