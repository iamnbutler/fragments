---
title: "How Did We Do That Again?"
slug: autoblog
date: 2026-10-17
kicker: autoblog
dek: "[autoblog](https://github.com/iamnbutler/autoblog) has my coding agents keep a private journal while they work. Most of the time they decide to write nothing, and that's the part that took the longest to get right."
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
  - label: Built
    value: "October 17–19, 2026: built the first evening, from about 20:00 to midnight, and tuned over the next two days"
  - label: History
    value: 46 commits on main in three days
  - label: Size
    value: About 3,700 lines of TypeScript on Bun, plus six prompts
  - label: Hooks into
    value: Claude Code and Codex
  - label: Journal
    value: 47 posts, 189 notes, and a work log of 770 days going back to 2012
  - label: Where it lives
    value: A private GitHub repo, an Obsidian vault, and a Cloudflare Worker behind Access
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

I build a lot with agents now, and I've noticed I forget more of it than I used to. Not just details, whole projects. Something ships, I move on, and two weeks later I'm asking an agent to work out something we already worked out.

Signing and [TestFlight](https://developer.apple.com/testflight/) are the clearest case. I set up macOS signing and TestFlight six or seven times in two months, for different apps, and every time the agent started from scratch, hit the same walls, and found the same fixes. Each of those sessions knew everything it needed. None of them could see the others.

So on a Saturday evening in October I opened a fresh project and wrote this to Claude:

> basically a skill/tool where agents write up literally anything I'm doing that seems interesting, or some novel solution or just thing we do a lot. The intent isn't really for anyone directly to read it but just to have an effortless stream of consciousness across all agents/projects I'm working on that just gets dumped somewhere private. To remember all the shit I've been doing/have reference to go back to (how did we do x again?)

It needed two modes. An automatic one that's always on, tuned so agents don't "just write everything they ever do". And a manual one, for "/autoblog" or "write up an autoblog for this". The machinery would be public, and what it wrote would stay private.

## Borrowing from lane

The shape came from [lane](https://lane.lukeed.com/usage/), the tool I use to give every agent change its own worktree. At the end of a lane, before it merges, the agent reflects on what it did and keeps only the non-obvious constraints, never a summary of the change. That's the instinct I wanted: stop, look back, and usually decide there's nothing worth keeping.

The first version was up nine minutes after I asked. A background job waited for a session to go quiet for 20 minutes, then handed a condensed transcript to a separate headless Claude call, which decided whether to write and wrote the post in one go.

I asked what model did the writing, and the answer made the problem obvious. The reviewer saw a condensed transcript capped at about 120,000 characters, and for anything longer it kept the start and the end. I don't pay for tokens, so the model wasn't the issue. The context was:

> I'm not sure why we wouldn't have the agent running the conversation write it? that is kind of the point - WHAT makes something worth writing up might be tokens 1~8000 and tokens 5300000+. sometimes I have sessions running for days.

So the agent doing the work became the one that decides. [Claude Code](https://claude.com/product/claude-code) and [Codex](https://developers.openai.com/codex) both have a Stop hook that runs at the end of every turn. autoblog's hook counts tool calls since the session's last checkpoint, reading only the bytes appended to the transcript since then, so it's cheap even on a 40 MB transcript. After 40, it asks the agent to reflect before it stops. The prompt is short and leads with the default: "Most checkpoints produce nothing." It also gives the agent the path to its own transcript, so it can grep for whatever compaction dropped.

The outside reviewer is still there, but only for transcripts no hook ever claimed.

## The first backfill was bad

An empty journal doesn't tell you much, so about forty minutes in I asked for subagents to go back through my old Claude and Codex transcripts. Eight agents split 229 transcripts by project and wrote 77 posts in about ten minutes. With the posts from the test runs, the journal had 90 posts across 26 projects. Then I read them.

> hmm... I just... I don't think these are good lol

They weren't wrong, exactly. They were stories about incidents, titled after the incident: "Sixty PRs shipped overnight against a locked screen were sixty unverified PRs." That's a true thing that happened. It's not something I'll ever search for. What I wanted was the topic it belonged to: a note called "Keeping long-running work alive when the screen locks". A post about summing token usage became a note called "Counting tokens: pitfalls", to be added to as more turned up. The bar I pointed at was the posts on this site.

By then there were 91. We archived all of them and started over, "slower and more intentional". The journal got two kinds of entry, both titled by topic:

- **Notes** are short reference pages that answer "what do I need to know about X?" They're the common case.
- **Posts** are rare. Each is either a project or a way of working, something I could put here with light editing.

The second pass also changed how a backfill runs. Instead of one writer per slice of history, it goes in three steps: harvesters read the transcripts and propose topics, a curator merges the same topic across projects and cuts the thin ones, and only then do writers write. The harvest found about 145 candidates. The curated plan had 52. The journal came out at 18 posts and 35 notes, with "How we sign Mac apps while prototyping" drawing on five different projects.

That rule, topics not incidents, is now a table at the heart of [the bar](https://github.com/iamnbutler/autoblog/blob/main/prompts/bar.md), with my examples on one side and the incidents they came from on the other.

## Revise almost never

The next thing I pushed on was revising. The bar at that point told agents to revise a project post as the project changed, and that will absolutely go wrong. An agent would keep extending the same page until it said everything and was readable by no one.

Now an entry gets revised for two reasons only: something in it is wrong, or a note is missing one pitfall that belongs on that exact page. Posts are never extended. When we ship revision history in Next Cloud, that doesn't revise the Next Cloud post. It becomes a new note, a new post, both, or nothing. The fallback reviewer used to append to entries it couldn't even see, so that ability was removed.

The checkpoint prompt also used to list every note and project in the journal, so the agent could avoid duplicates and write links. That was wild, and it would only get worse as the journal grew. The list moved out of the prompt. An agent that thinks it has something runs `autoblog guide`, reads the bar, and searches the journal for its topic. Links became a separate job: after every write, a model picks the phrases that name another entry, and code inserts the links, so prose is never rewritten. Once a day it goes back over older entries and links them to newer ones.

## A log of what happened

Notes and posts are held to a bar. I also wanted something with no bar at all, or so I thought: a work log across everything I do. "{date} - {thing} - {notes}", several to a day, written by a fast model from the transcripts.

That became the timeline. The first backfill logged 2,003 lines across 628 sessions. Then I looked at a single day: 142 lines, 42 of them for one project. It read like a changelog. Lines were only ever added, so corrections sat next to what they corrected, and a long session that went idle five times got five batches.

Now each day holds at most three lines per project, often none. When a session goes idle, the model gets the lines already logged for that day and returns the whole set for each project it touched, so later work folds into earlier lines. Haiku wouldn't hold that bar. Given the stricter prompt, it still kept an app icon and an entitlements change, so the timeline is written by Sonnet. Compacting the old days took the timeline from about 6,800 lines to 1,877, and 412 days were left with nothing worth logging, so they're gone.

The timeline is also where "when did I do that?" gets answered. It goes back to 2012, because the other Mac backfilled from old git history and an archive of old work, with the agents keeping clear of personal files, while this one was busy with transcripts.

## Reading it back

The journal is an [Obsidian](https://obsidian.md/) vault in a private repo. [GitHub Pages](https://pages.github.com/) can build from a private repo, but the site it publishes is public, so the readable version is a small static site on a [Cloudflare Worker](https://workers.cloudflare.com/). It started behind a password. That meant a password prompt every time the browser forgot it, so it's behind [Cloudflare Access](https://www.cloudflare.com/zero-trust/products/access/) now, with a login that lasts 30 days.

I wanted to be able to add to a page from the site, so every page has an annotation box now. The first two notes were about `cl`, a color library plugin for VS Code that was my design challenge for joining [GitHub Next](https://githubnext.com/). An agent folded both into the project's description, in the page's own wording, and the page marks them "folded in". Normally the sweep does this once a page's newest annotation is ten minutes old, so a few in a row land together. Annotations are the one thing allowed to extend a post, because they come from me.

## Recall

Writing was half of it. Two days in, I asked for a note on signing and TestFlight, and the journal already covered most of it. Then I asked the obvious question: when I tell an agent to "set up testflight" in some project, will it check?

It wouldn't have, unless it thought to. Now a second hook runs on every prompt I send. It ranks the journal against the prompt, where a word in an entry's title or tags counts most and a word that's all over the journal counts least. If a rare word names an entry, the agent is told the entry exists and to read it before starting. "Set up testflight for this project" points at "Shipping to TestFlight from the command line and CI". "Update the tests and push, make the button blue" points at nothing. It takes about 80 ms, and each entry is mentioned at most once per conversation.

This is the point of the whole thing. The seventh time I set up TestFlight, the agent starts from the way we do it, not from the internet.

## Backfilling years

Once the journal had a shape, I went back further. Claude Code deletes transcripts after 30 days unless you change `cleanupPeriodDays`, and I never had, so most of the year existed only as my side of the conversation in prompt history. Backups added 370 sessions the first pass never saw. For February to May, the agents paired about 5,500 of my prompts with the git history of the repos they were about. After that came my own messages from [Zed](https://zed.dev/)'s Discord and my issues and pull requests on [Zed's GitHub](https://github.com/zed-industries/zed) from 2021 to 2025, which is where entries like "How we did design at Zed" came from.

Agents writing entries skipped about 95% of what they read. That seems right to me.

[Luke](https://github.com/lukeed), who wrote lane, wanted to try it, so the backfill became a command, `autoblog backfill`, with a plan you read and edit before anything is written. The plan is the cheap place to steer. It's also where you'd catch the first attempt's mistake, one entry per session, before it fills the journal with a diary. Old prompt history is also where secrets turn up: the first backfill found a few credentials pasted into old prompts, and the harvester reported them so they could be rotated without copying them anywhere.

## What it's like now

Most of the time I don't notice it. An agent finishes a stretch of work, says it found nothing for the journal, and stops. On this Mac, from October 19 to 21, checkpoints ended in 49 skips, 15 new entries and 28 revisions. The skips come with a reason: "routine feature work", "already covered in the lane note", "unverified against a live service yet; nothing settled worth journaling until it's smoke-tested". That last one is the kind of judgment I wanted.

When I want something kept, I ask. When I want a conversation kept out, I say "pause autoblog", and that session never goes in the journal, not in a checkpoint, the timeline or a backfill, even after I resume.

## Still open

Revisions are the thing to watch. A revise replaces the whole body, and an agent working from a compacted context could drop good material while adding a line. Git keeps every version, but nobody would notice. Near-duplicates are the other risk: an agent decides its case is different enough and writes "Notarizing in CI" next to the signing post.

Two machines write to the same vault, and that's mostly fine now. Each commit fetches and merges before it pushes, and timeline days merge by union. The first time it happened, both Macs were backfilling, one had 171 commits unpushed, the other had pushed 64, and the push had been failing silently.

The journal can't hold a figure yet. I thought about having writers draw diagrams when a note would be better for one, then let it go. And everything in it is private. It would be easy to pick a note or a post and publish it, but that isn't the point right now. The point is that it happens without me, and that the next agent can read it.
