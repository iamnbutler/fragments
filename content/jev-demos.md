---
title: "What does fast get us?"
slug: jev-demos
date: 2026-10-08
dek: "Notes from the first few days of playing with Jev, a model that answers instead of writes, around three ideas: compression, tagging and ranking."
repo: https://github.com/iamnbutler/jev-demos
links:
  - label: iamnbutler/jev-demos
    url: https://github.com/iamnbutler/jev-demos
  - label: Introducing System One models and Jev
    url: https://typesafe.ai/blog/introducing-system-one-models-and-jev
facts:
  - label: Model
    value: Jev, from TypeSafe
  - label: Played with
    value: Search, review, duplicates, discussions, history, agent context
images:
  - src: figs/jev-demos/fig-1-call
    alt: "Line drawing in four numbered parts. A document labeled state (a diff, a thread, a report) and three question cards (yes or no, noul; which one, choice; how far along, score) feed a double circle labeled Jev, 70–500 ms. Three real answers come out: a dot at 0.94 on a line from 0 to 1 (persisterGc, from Semantic Search); horizontal bars over six changelog categories with permissions at 0.96 and behavior at 0.04 (commit c21, “avoid duplicate work”); and a ring at 1.06 on a scale of none, some, most, all. Below a dashed rule, code: sort, threshold, group, budget, show."
    caption: "Fig. 1. One call. State and questions go in; numbers come out in 70–500 ms (TypeSafe’s figure), and code does the rest."
  - src: figs/jev-demos/fig-2-modes
    alt: "A grid with three answer shapes down the side (yes or no, choice, score) and three jobs across the top (ranking as stacked bars, tagging as a luggage tag, compression as a funnel). Filled, highlighted cells: yes or no ranks (a probability sorts, Semantic Search) and compresses (keep or drop, context selection); choice tags (the choice is the tag, discussion and history) and compresses (pick one passage, duplicates). Hollow cells: yes or no also tags (one yes or no per label, review lenses), and score could rank (graded, barely needed; no demo used it)."
    caption: "Fig. 2. Which answer does which job."
  - src: figs/jev-demos/fig-3-budget
    alt: "Left, the 18 turns of the context demo's agent thread in order, each with two bars for relevant and essential. An arrow labeled sort leads right, where the two protected turns (constraints, latest-user) sit in a band marked always kept; then seven turns ranked by priority (baseline-tests, delivery-source, header-fix, delivery-reread, design-note, wait-draft, retry-source) in a highlighted band; a heavy dashed line labeled token budget, 1,450; five archived turns below it (working-diff, repo-shape, header-tests, install, recent-status); and four struck-through low-signal turns that were never ranked. Notes: priority per turn is 0.65 × relevant + 0.35 × essential; move the budget and code reselects, no new call; one call, 36 questions, 189 ms."
    caption: "Fig. 3. Compression is ranking with a budget. Move the budget and code reselects, with no new call."
  - src: figs/jev-demos/fig-4-pairs
    alt: "A triangle with rank (stacked bars) at the top, tag (a luggage tag) at bottom left and compress (a funnel) at bottom right. Each highlighted edge names a demo: tag–rank, review lenses (each hunk scored by lens; a threshold folds the quiet ones); rank–compress, context selection (turns ranked by priority, cut at the token budget); tag–compress, changelog (commits grouped by category; a writing model gets the groups). The centre reads Jev judges, code decides."
    caption: "Fig. 4. Pairs. Most of the interesting demos sit on an edge."
  - src: figs/jev-demos/ill-1-stopwatch
    alt: "A pocket stopwatch on a fine chain, its second hand only a sliver past twelve."
---

[Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev) doesn't write anything. You give it some state and a list of narrow questions, and it gives back numbers. TypeSafe puts its response time at 70–500 ms, and most of my calls came back in under half a second.

I wanted to know what that speed is good for. If a judgment costs about as much as a network request, where does it go? I spent the first few days [playing around](https://github.com/iamnbutler/jev-demos), and the same three things kept turning up: compression, tagging and ranking.

## Three ways to ask

Jev takes three kinds of question:

- Yes or no, which the API calls noul, comes back as a probability that the answer is yes.
- Choice picks one of the options you name, with odds for each and a confidence.
- Score puts the answer on an ordered scale you write, like none, some, most, all. It returns a position between the ends.

Every answer is a number or a spread of numbers, never prose. That's the whole trick. The model makes the judgment, and plain code can sort, threshold, group and count it.

## Tagging

A choice is a tag. In one demo, every post in a long discussion gets a role: proposal, objection, decision, reversal. Then you can lift the decisions out of the thread and see which objections nobody answered. In another, every commit in a history gets a category from its actual diff, not its message. When Jev isn't confident, the commit lands in needs review instead of a guess.

## Ranking

A yes-or-no probability is a sort key. Semantic Search asks one question of each of 2,414 functions from Hono, TanStack Query and Vite: does this catch an error and carry on? The list reorders as each batch comes back. The first results showed up in about 300 ms, and the whole corpus in under nine seconds.

Score is the obvious ranking tool, and I barely needed it. A probability already sorts.

## Compression

Compression is choosing what to keep. The context demo asks two questions about each turn of an agent's thread: is it relevant, and would dropping it lose something? It blends the answers, always keeps the two turns it can't do without, drops the ones with little signal, and fills a token budget from the top of the ranking down, skipping any turn too big for the room left. Choice compresses too. For each bug report, the duplicates demo picks the one passage that best explains how it relates to yours.

## Pairs

The fun started when two of these met:

- Tag and rank: review lenses tag each hunk of a diff by concern, with a probability. A threshold folds the quiet ones away.
- Rank and compress: context selection ranks turns and then fills the budget from the top. A new budget only means choosing again from the same ranking, so it doesn't need a new call.
- Tag and compress: for a changelog, Jev sorts the commits into categories, and a writing model gets the groups instead of the raw log.

None of this makes the model smarter. Fast just makes a judgment cheap enough to treat like any other value: compute it, show it, throw it away when its input changes, and ask again.
