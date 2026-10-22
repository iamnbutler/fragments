---
title: "Design Docs, Version Two"
slug: design-docs-v2
date: 2022-05-28
kicker: Design Docs
dek: "[Design Docs](https://github.com/iamnbutler/design-docs) is a free, public-domain guide for designers trying to get their first job in tech. Version two moved the words out of the code so other people could write them too."
repo: https://github.com/iamnbutler/design-docs
links:
  - label: iamnbutler/design-docs
    url: https://github.com/iamnbutler/design-docs
  - label: Design Docs V2.0 release
    url: https://github.com/iamnbutler/design-docs/releases/tag/v2.0.0
  - label: CONTRIBUTING.md
    url: https://github.com/iamnbutler/design-docs/blob/v2.0.0/CONTRIBUTING.md
  - label: The TODO list
    url: https://github.com/iamnbutler/design-docs/tree/v2.0.0#todo
facts:
  - label: From the archive
    value: First published May 28, 2022, edited in 2026
  - label: For
    value: Early-career designers looking for their first job in tech
  - label: License
    value: CC0-1.0, public domain
  - label: Contents
    value: Seven sections, about 4,000 words
  - label: Version one
    value: Nuxt 3, built October 31 to November 4, 2021
  - label: Version two
    value: Next.js, Tailwind and MDX, rebuilt May 20 to 28, 2022
images:
  - src: figs/design-docs-v2/fig-1-words-in-files
    alt: "Two columns divided by a dashed rule. Left, version one (Nuxt, November 2021): a pages folder of eight Vue files, and portfolio.vue opened to show the paragraph 'Don't over-invest in your website… Try spending no more than a week on your first portfolio' wrapped in template, article, h2 and p tags; a contributor reaches it by a dashed arrow labelled 'edits a component', and a note says the words live in each page's markup. Right, version two (Next.js and MDX, May 2022): a content folder of seven MDX files, and portfolio.mdx opened to show the same words with only a Markdown heading mark; a contributor reaches it by a solid arrow labelled 'edits a text file', and an arrow leads from the file to one template, pages/posts/[slug].jsx, which renders all seven."
    caption: "Fig. 1. The same paragraph in both versions. In version one it sat inside a Vue component; in version two it is a text file that one template renders."
  - src: figs/design-docs-v2/ill-1-branching-road
    alt: "A wide landscape: a road comes toward the viewer and forks into three branches that run off to low hills under a pale sun, with a blank signpost at the fork, a few trees, and a dotted footpath in teal that leaves the road and wanders off across the field on its own."
  - src: figs/design-docs-v2/ill-2-many-hands
    alt: "A cup holding a brush, a fountain pen, a pencil and a ballpoint, with one more pencil, drawn in teal, just being dropped in."
---

Design Docs is a guide for early-career designers. It's meant to give them a roadmap: how to improve their craft, put a portfolio together, and get their first job in the industry, or the job they're chasing.

Version two is out. It's a new site built in [Next.js](https://nextjs.org), the content has been through another pass, and you can [read it here](https://design-docs.vercel.app).

## What's in it

There's no single right way into this industry, and the guide says so on its first page. It lays out some common paths and roles and how they fit together, and it says plainly that you don't have to follow anyone's path, including this one.

The sections run in order: build a foundation, discover the roles, have work to show, have a portfolio, talk about your work, and further reading. Most of the advice is the kind I wish I'd had early. Don't over-invest in your website: spend about a week on a first portfolio, and only build something elaborate once you have at least three strong projects. Don't use placeholder content in your designs. Show, don't tell. A long write-up doesn't make a better project.

Everything is [CC0](https://creativecommons.org/publicdomain/zero/1.0/), which means public domain. Anyone can use any of it for anything, including copying it word for word into something commercial. I think education belongs in the public domain without strings attached.

## Why rebuild it

The first version went up in November 2021, built in [Nuxt](https://nuxt.com) in about five days. Every section was a [Vue](https://vuejs.org) page, with the words written straight into the markup. That was fine while I was the only one writing it, and it got in the way of anyone else.

In version two the words live in seven [MDX](https://mdxjs.com) files in a `content` folder, and one template renders them. If you want to fix a paragraph you edit a text file, not a component. Most of the work since has gone into making the project easy to contribute to: a short `CONTRIBUTING.md`, a [TODO list](https://github.com/iamnbutler/design-docs/tree/v2.0.0#todo) in the README, and tasks broken down over the next few versions so there's always something clear to pick up.

## Who I want writing it

I don't want this to stay one designer's opinions. I'd like it to show work from a wide range of designers and to bring in people from many backgrounds to review it and add to it over time. One of the short-term items on the TODO list is to rewrite the content from a more neutral point of view, with opinions kept in clearly attributed blocks, so the guide can hold more than one voice.

## How to help

Everything is open for contributions. Send a pull request, open an issue, or [start a discussion](https://github.com/iamnbutler/design-docs/discussions) on GitHub. If you'd rather not use GitHub, `CONTRIBUTING.md` has an email address, and content, links, reviews and feedback are all welcome that way too.

I'd like Design Docs to become a resource students and new designers can use wherever they are.

