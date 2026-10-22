---
title: "Sixty Gens in Two Hours"
slug: fig-gen
date: 2021-11-06
kicker: fig-gen
dek: "[fig-gen](https://github.com/iamnbutler/fig-gen) is a small generative series I made in Figma with Automator, a plugin that builds designs from stacked actions. One-pixel frames, placed by the trig functions I last used on a graphing calculator in high school."
repo: https://github.com/iamnbutler/fig-gen
links:
  - label: iamnbutler/fig-gen
    url: https://github.com/iamnbutler/fig-gen
  - label: The six saved recipes (sin-tan-cos)
    url: https://github.com/iamnbutler/fig-gen/tree/main/sin-tan-cos
  - label: Jordan Singer, who made Automator
    url: https://twitter.com/jsngr
facts:
  - label: From the archive
    value: First published November 6, 2021, edited in 2026
  - label: Made with
    value: Figma and the Automator plugin, then in closed beta
  - label: Output
    value: About 60 gens in under two hours
  - label: Each gen
    value: A 128 × 512 black frame with a 1px white border, and 256 or 512 marks
  - label: Saved
    value: Six Automator JSON files, free to reuse
images:
  - src: figs/fig-gen/fig-1-one-gen
    alt: "Left, the saved gen3 recipe as a nested stack of Automator actions: Create frame 128 x 512, black; inside it Add stroke 1 px white, inside, and Repeat 256 times; inside the repeat, Set variable sin = Math.sin(2 * index), Set variable cos = Math.cos(index), and Create frame 1 x 1, white, x = index, y = cos * (index + sin) + 256, which is highlighted. An arrow leads to three tall frames showing the marks after 16, 64 and 256 passes: a wedge of dots opens rightward from the middle of the left edge. In the 64-pass frame the dot for index 63 is ringed and labelled x 63, y 318.4. Under the first frame an arrow along the bottom reads x = index; under the last, a bracket marks faint dots beyond the frame's right edge, labelled x 128 to 255 falls outside the frame."
    caption: "Fig. 1. The gen3 recipe and what it draws. Each pass places one mark: x is the index, y is a function of it. The dots are computed from the saved recipe."
  - src: figs/fig-gen/ill-1-graphing-calculator
    alt: "A school graphing calculator, tilted slightly, its screen showing a teal sine curve whose swing grows from left to right."
---

I spent an evening trying out Automator, a new Figma plugin from [Jordan Singer](https://twitter.com/jsngr). You build a design out of stacked actions (create a frame, repeat, set a variable) instead of drawing it. A minimal generative series, made from pixels and equations, seemed like a good way to find out what it could do.

![Twenty-six gens in two rows: tall black frames with thin white borders, each holding a different scatter of short white dashes. Some form chevrons and fans that open from one edge, some trace arcs, one collapses into a single horizontal line.](media:posts/fig-gen/1)

## Nesting and rotating

I started by nesting shapes. What happens when you nest a shape and rotate it, over and over? Some of the results were good, but they all started to look alike, because rotation was doing nearly all the work.

![A Figma window with the Automator panel open beside the canvas. The canvas shows a dense spiral of yellow rings and magenta strokes around a cyan starburst. The panel lists the actions: create group, create frame, set clips content, repeat 48 times, duplicate, set position, set rotation, repeat 12 times, create text, set position, repeat 12 times, create frame.](media:posts/fig-gen/2)

## Back to the graphing calculator

Then I remembered playing with graphing calculators in high school. Sin, cos and tan gave me interesting results right away.

Once I had a few directions I liked, I wanted them to sit together in a series, so each one needed a frame. I used the simplest outline I could, to keep everything monochrome and on theme.

## What one gen is

None of the final gens use nesting. Each one is a black frame, 128 by 512, with a one-pixel white border inside it. A Repeat action runs 256 or 512 times, and on each pass it places one white mark. A mark is a frame one pixel tall. Its x position comes from the repeat's `{{index}}`, so the marks march along the x-axis like a plotted graph. Its y position is a function of the index.

The functions are mostly sin, cos and tan, a random variable and `{{index}}`, combined in different ways. The simplest saved recipe, gen3, sets two variables and places a one-pixel dot:

```
sin = Math.sin(2 * index)
cos = Math.cos(index)
y   = cos * (index + sin) + 256
```

Multiplying by the index makes the swing grow as the index climbs, so the dots open out into a chevron. Later recipes give each mark a random width, from a fraction of a pixel up to 6, 8, 16 or 32 pixels, depending on the recipe. The width is the product of two random numbers, so most marks are short and a few run long. Some recipes give each mark a random opacity too.

## Sixty in two hours

My favourite thing about Automator was how fast it let me explore. I made about sixty gens, with a lot of variety between them, in under two hours.

![The whole session laid out in three rows of labeled frames, gen3, gen4, gen5 and gen6, about sixty in all. The gen3 row is chevrons; one in the middle is flooded with long white bars. The gen4 and gen5 rows drift from scattered dashes to single horizontal lines to arcs. The gen6 row is fans and sweeping curves.](media:posts/fig-gen/3)

## Favourites

![A single gen: a sparse dotted line climbing from the left edge into two broad arcs, with loose dashes trailing down the left side.](media:posts/fig-gen/5)

![A single gen: short horizontal dashes scattered thinly at the top, crowding into overlapping arcs at the bottom of the frame.](media:posts/fig-gen/6)

![A single gen: an almost empty frame, with a faint band of dashes just below the middle and three stray marks above it.](media:posts/fig-gen/7)

![A single gen: the top half empty, the bottom half filled with dashes and dotted arcs that start at a hard horizon across the middle.](media:posts/fig-gen/8)

![A single gen: dashes fanning out from a point on the left edge, like rays.](media:posts/fig-gen/9)

## The files

I saved some of the recipes as I went. Six of them are in the [fig-gen](https://github.com/iamnbutler/fig-gen) repo as Automator JSON, which you can load from Automator's settings with Import JSON. Do whatever you want with them.

Automator is gone now; [its site](https://web.archive.org/web/20211109172845/https://automator.design/) survives in the Wayback Machine. The recipes in the repo are a record of how each gen was built rather than something you can still run, and the images below are what they made.
