---
title: "What does fast get us?"
slug: jev-demos
date: 2026-10-08
dek: "Notes from a few weeks of playing with Jev, a model that answers instead of writes, around three ideas: compression, tagging and ranking."
draft: true
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
  - src: drafts/jev-demos/fig-1-call
    alt: "Line drawing in four columns. A document labeled state and three question cards labeled yes or no (noul), which one (choice) and how far along (score) feed an oval labeled Jev, 70 to 500 ms. Three answers come out: a dot at 0.82 on a line from 0 to 1, a bar chart over fix, feat, docs and test with feat filled in, and a pointer at 2.8 on a scale from 0 to 4. A dashed rule separates a last column labeled code: sort, threshold, group, budget, show."
    caption: "Fig. 1. One call. State and questions go in; numbers come out, and code does the rest."
  - src: drafts/jev-demos/fig-2-modes
    alt: "Line drawing with three answer shapes on the left, labeled yes or no, choice and score, and three jobs on the right: ranking as stacked bars, tagging as a luggage tag reading feat, and compression as a funnel. Yes or no points to ranking and, labeled keep or drop, to compression. Choice points to tagging and, dashed and labeled pick one passage, to compression. Score points to ranking, labeled on a graded scale."
    caption: "Fig. 2. Which answer does which job."
  - src: drafts/jev-demos/fig-3-budget
    alt: "Line drawing of eight agent turns in their original order, each with two bars for relevant and essential. An arrow labeled sort leads to the same turns reordered by a single bar. A heavy dashed line labeled token budget cuts the list after four turns; the turns above are kept, the dashed ones below are archived."
    caption: "Fig. 3. Compression is ranking with a budget. Move the budget and the cut moves, with no new call."
  - src: drafts/jev-demos/fig-4-pairs
    alt: "A triangle with rank at the top, tag at bottom left and compress at bottom right. The tag–rank edge is labeled review lenses, the rank–compress edge context selection, and the tag–compress edge changelog. The centre reads Jev judges, code decides."
    caption: "Fig. 4. Pairs. Most of the interesting demos sit on an edge."
---

[Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev) doesn't write anything. You give it some state and a list of narrow questions, and it gives back numbers. TypeSafe puts its response time at 70–500 ms, and most of my calls came back in under half a second.

I wanted to know what that speed is good for. If a judgment costs about as much as a network request, where does it go? I spent a few weeks [playing around](https://github.com/iamnbutler/jev-demos), and the same three things kept turning up: compression, tagging and ranking.

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

Compression is choosing what to keep. The context demo asks two questions about each turn of an agent's thread: is it relevant, and would dropping it lose something? It blends the answers, ranks the turns, and keeps them until a token budget is full. Choice compresses too. For each bug report, the duplicates demo picks the one passage that best explains how it relates to yours.

## Pairs

The fun started when two of these met:

- Tag and rank: review lenses tag each hunk of a diff by concern, with a probability. A threshold folds the quiet ones away.
- Rank and compress: context selection ranks turns and then cuts at the budget. Moving the budget only moves the cut, so it doesn't need a new call.
- Tag and compress: for a changelog, Jev sorts the commits into categories, and a writing model gets the groups instead of the raw log.

None of this makes the model smarter. Fast just makes a judgment cheap enough to treat like any other value: compute it, show it, throw it away when its input changes, and ask again.
