---
title: "Computer Use For All"
slug: desktop-tools
date: 2026-10-08
dek: "[desktop-tools](https://github.com/githubnext/desktop-tools) gives agents eyes and hands on a Mac, and most of the work went into what an agent should believe after it acts."
draft: true
repo: https://github.com/githubnext/desktop-tools
links:
  - label: githubnext/desktop-tools
    url: https://github.com/githubnext/desktop-tools
  - label: Patch notes
    url: https://github.com/githubnext/desktop-tools/blob/main/native/patches/README.md
  - label: Ace's native desktop tools doc
    url: https://github.com/githubnext/ace2/blob/main/docs/desktop-tools.md
  - label: Native computer use in Ace (issue #8)
    url: https://github.com/githubnext/ace2/issues/8
  - label: Peekaboo
    url: https://github.com/openclaw/Peekaboo
  - label: githubnext/ace2
    url: https://github.com/githubnext/ace2
facts:
  - label: Built on
    value: Peekaboo 4.8.0 plus 15 ordered patches
  - label: Requires
    value: macOS 15 or later; Swift 6.2+ to build
  - label: Parts
    value: Swift runtime with a C ABI, signed client CLI, TypeScript client and protocol
  - label: License
    value: MIT
images:
  - src: drafts/desktop-tools/fig-1-boundary
    alt: "Patent-style line drawing: a host process spawns a signed client, which connects through a Unix socket drawn as a plug and receptacle to a signed embedding app. Inside the app is the native runtime library with a stacked-sheets patch glyph and three keys labeled Accessibility, Screen Recording and Event Synthesizing. An arrow runs down to a dashed box labeled any other app's window."
    caption: "Fig. 1. Who holds the permission. macOS grants it to the embedding app, so the runtime lives inside that app and everything else talks to it over a socket."
  - src: drafts/desktop-tools/fig-2-loop
    alt: "Three-step line drawing: an eye over a window labeled inspect, a ticket stub labeled snapshot_id, and a pointer labeled act once, which branches into three boxes: completed, refused, and a dashed box for unknown. All three paths return to inspect."
    caption: "Fig. 2. Observe, act once, observe again. The dashed box is the one that matters."
  - src: drafts/desktop-tools/fig-3-patch-stack
    alt: "Isometric line drawing of fifteen thin sheets stacked on a solid block labeled Peekaboo 4.8.0, pinned revision 4d43dc9, with the patch names listed in order from click to stale-click. A bracket marks lower sheets as already applied and upper dashed sheets as the missing suffix, with an arrow to a box reading verify, then compile."
    caption: "Fig. 3. The patch stack. The build applies only what's missing and refuses to compile if the source has drifted."
---

[Ace](https://github.com/githubnext/ace2) has a rule that all Ace development happens in Ace. That rule hits a wall as soon as the thing you're building is a desktop app. To check a native change, an agent has to look at real windows, click real buttons and work through real dialogs.

So Ace grew native desktop tools: inspect a window, click, type, drag, scroll, use menus and the clipboard, launch and quit apps. They now live in their own package, [desktop-tools](https://github.com/githubnext/desktop-tools).

Clicking is the easy part. The interesting parts are who's allowed to click, and what the agent should believe afterward.

## A plain library can't hold a permission

On macOS, Accessibility, Screen Recording and event synthesis are granted to an app. Not to a library, and not to whatever process happens to load one. So desktop-tools comes in three parts (Fig. 1):

1. A Swift runtime that a signed app embeds. The app holds the grants.
2. A signed client CLI that talks to the runtime over a Unix socket.
3. A TypeScript client, so a Node or Bun host can call `desktop({ op: "apps" })` and get back text written for a model, plus an image when there is one.

The two sides check each other. The runtime only accepts a client signed by the same team, and the client verifies the host.

## Every action uses up its observation

The part I'm proudest of is mostly restraint. The contract (Fig. 2):

1. **Inspect** one exact window. You get accessibility text and a screenshot, and it never steals focus.
2. The observation comes with a **snapshot** of that window and the controls it saw.
3. **Act once** against the snapshot. Every action uses up its observation, even one whose result is uncertain. Want to do something else? Inspect again.

Input goes to the target window in the background, and the physical pointer doesn't move. If the window moved or the control vanished, the action is refused before anything is sent. Every action reports one of three outcomes:

- **completed**: the operation returned. That's still not proof the app did what you wanted, so look.
- **refused**: nothing was sent.
- **unknown**: input may have landed, and nobody can say.

Unknown is a real answer, and the system is built so nobody pretends otherwise. A model's instinct is to retry. On a desktop, retrying a click you can't confirm is how you send the same message twice.

## Fifteen patches

Underneath is [Peekaboo](https://github.com/openclaw/Peekaboo) plus fifteen patches, applied in a fixed order (Fig. 3). Each one came out of something that broke while Ace was using it. Clicking a window that had moved used to come back as "maybe dispatched," the scariest possible answer. Now it's a clean refusal. When Peekaboo fixes something upstream, the matching patch gets deleted, not carried forward.

The desktop tools are careful about the one thing they own. They never act on a window they haven't just looked at, and they never claim more than they know.
