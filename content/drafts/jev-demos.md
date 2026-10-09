---
title: "Judgment on Every Keystroke"
slug: jev-demos
date: 2026-10-08
dek: "[jev-demos](https://github.com/iamnbutler/jev-demos) is eight small interfaces built on one idea: ask a model narrow questions fast enough to answer while you work, and let ordinary code do everything else."
draft: true
repo: https://github.com/iamnbutler/jev-demos
links:
  - label: iamnbutler/jev-demos
    url: https://github.com/iamnbutler/jev-demos
  - label: Introducing System One models and Jev
    url: https://typesafe.ai/blog/introducing-system-one-models-and-jev
  - label: Demo guide
    url: https://github.com/iamnbutler/jev-demos/blob/main/docs/DEMO-GUIDE.md
  - label: Validation notes
    url: https://github.com/iamnbutler/jev-demos/blob/main/docs/VALIDATION.md
facts:
  - label: Model
    value: Jev (jev-1.13.0), from TypeSafe
  - label: Demos
    value: Workflows, Semantic Search, Review lenses, Duplicates, Discussion, History, Context, Replay
  - label: Built with
    value: React, Vite and Bun
---

Most of what we build on language models asks them to write: a summary, a reply, a patch. [Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev) doesn't write. You hand it some state and a set of narrow questions, and it hands back a probability, a choice or a score. TypeSafe calls it a frontier-intelligence function call. In these demos most calls came back in under half a second.

That changes where a model can sit in an interface. If a judgment costs a few hundred milliseconds, you can make one for every hunk in a diff, every function in a codebase, every post in a thread. I built eight demos to find out what that feels like.

## The model answers, code decides

Every demo has the same split. Jev answers questions like "does this hunk weaken an assertion?" or "is this the same failure as that report?" Parsing, sorting, budgets, source links and policies are ordinary code.

That split is what keeps the results honest. A review mark sits on the exact changed lines because code mapped the hunk's answer onto them, not because a model guessed line numbers. Every demo can show the exact request and response behind what's on screen. Editing an input clears its judgments, and an old response can never overwrite a newer input.

## Search that ranks as it reads

Semantic Search asks one question of 2,414 functions from Hono, TanStack Query and Vite: does this catch an error and carry on? It sends 124 batches, four at a time, and the ranking moves each time a real batch comes back. The first results arrived in about 300 ms, and the whole corpus in under nine seconds. Stop it partway and the finished batches stay. A score that never came back stays unknown, not zero.

## Judgment as material

The other demos use the same pieces differently:

- **Review lenses** score each hunk and mark only the yes answers: expands permissions, swallows errors, weakens assertions.
- **Duplicate reports** compare the report you're typing against twelve others, 400 ms after you stop.
- **Context selection** keeps an agent thread under a token budget. Moving the budget needs no new model call.
- **Run replay** catches an agent claiming success that its own tool output doesn't support.

They're research demos over authored examples and pinned public source, and the probabilities are judgments, not measured accuracy. What I keep coming back to is how ordinary a judgment gets once it's this cheap. It's computed, shown, cleared when its input changes, and thrown away without regret.
