---
title: "fig-gen: Making Generative Art in Figma"
slug: fig-gen
date: 2021-11-06
---

## Generative Art with Figma & Automator

I spent the evening exploring the new Automator plugin for Figma from [Jordan Singer](https://twitter.com/jsngr). I thought a minimal generative series using pixels and mapping equations would be a fun way to try it out.

![Some select screens from my automation explorations](media:posts/fig-gen/1)

### Process

I started by pushing on nesting shapes – How does it look when you nest and rotate shapes continuously? I got some cool outcomes like below, but I realized that most of the gens would end up looking pretty similar, relying so heavily on rotation.

![](media:posts/fig-gen/2)

Exploring a different direction, I remembered playing with graphing calculators back in high school – Using trig functions like sin, cos, and tan, I got some exciting results right off the bat.

Once I found a few directions I liked, I realized that these gens would probably show best in some sort of frame, especially if I wanted to show a few together. I went with the simplest outline possible to keep everything monochrome and on theme.

In the end, I didn't use any nesting to create each gen. Frames 1px tall and 1~6px wide (randomized) are charted in 2D along the x-axis using the repeat's {{index}}.

The generative functions are mostly created using sin, cos, tan, a randomizer variable, and {{index}} combined in different ways.

My favorite thing so far about Automator is how quickly I was able to explore a ton of variations. I was able to create over 60 gens with some really wide variation in under 2 hours.

![](media:posts/fig-gen/3)

Here are some of my favorite gens:

![](media:posts/fig-gen/4)
![](media:posts/fig-gen/5)
![](media:posts/fig-gen/6)
![](media:posts/fig-gen/7)
![](media:posts/fig-gen/8)
![](media:posts/fig-gen/9)

I'm looking forward to exploring another generative series soon, following everything I learned with this one!

You can find some of the JSON import files I saved as I was exploring in the [fig-gen](https://github.com/iamnbutler/fig-gen) repo.

---

[Jordan Singer](https://twitter.com/jsngr)'s [Automator](https://automator.design/) plugin is currently in closed beta. I can't wait to see what everyone is able to create once they get their hands on this!
