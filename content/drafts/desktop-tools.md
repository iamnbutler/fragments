---
title: "Computer Use For All"
slug: desktop-tools
date: 2026-10-08
dek: "[desktop-tools](https://github.com/githubnext/desktop-tools) gives agents eyes and hands on a Mac, and most of the work went into what an agent should believe after it acts."
draft: true
proof: false
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
  - label: Extracted
    value: 8 October 2026, from Ace
  - label: Built on
    value: Peekaboo 4.8.0 plus 15 ordered patches
  - label: Requires
    value: macOS 15 or later; Swift 6.2+ to build
  - label: Parts
    value: Swift runtime with a C ABI, signed client CLI, TypeScript client and protocol
  - label: Tools Ace exposes on top
    value: 24, from desktop_apps to desktop_key
  - label: Install
    value: From Git at a pinned commit; not on npm
  - label: License
    value: MIT
pullquotes:
  - "Clicking is the easy part."
  - "On macOS, Accessibility, Screen Recording and event synthesis are granted to an app."
  - "Unknown is a real answer, and the system is built so nobody pretends otherwise."
  - "Every dispatched action uses up its observation, including one whose result is uncertain."
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
art: >-
  Visual metaphor: a puppet whose strings run through a notary's office. The
  agent wants to move a window, and every pull passes a signature check on
  the way. Line-art subject: an exploded patent drawing of a hand on a
  one-button mouse, with numbered parts and a ticket stub (the snapshot)
  clipped to the wrist. Inks: fluorescent orange and blue on off-white, with
  black only for the patent line work and the three outcome words; pink
  stays out so this reads as a sibling to the Ace feature, not a continuation
  of it. Two spreads. Spread 1 opens on "DID THE CLICK LAND?" set huge in
  orange over a blue halftone of a macOS window, with Fig. 1 drawn as an
  annotated manual page, leader lines to each part, and the three permission
  keys printed as if they were hanging on a hook. Spread 2 is the numbered
  process: Fig. 2 runs across the top as a three-panel strip (1 inspect,
  2 snapshot, 3 act once), and the three outcomes get stamped like rubber
  stamps at the bottom, COMPLETED and REFUSED in blue, UNKNOWN in orange,
  set larger and slightly misregistered on purpose. Fig. 3, the patch stack,
  sits in the outer column as a tall narrow drawing, with the two war stories
  (the newline that pressed Return, the quit that didn't) as clipped
  marginal notes pointing at their sheets.
---

[Ace](https://github.com/githubnext/ace2) has a rule that all Ace development happens in Ace. That rule hits a wall as soon as the thing you're building is a desktop app. To check a native change, an agent has to look at real windows, click real buttons and work through real dialogs. Without that, someone gets out another tool, and the PR has to admit it.

So Ace grew native desktop tools: inspect a window, click a control, type, select text, send a shortcut, drag, scroll, read and write the clipboard, launch and quit apps, use menus. On October 8 I pulled the engine out into its own public package, `githubnext/desktop-tools`, and Ace now consumes it at a pinned commit.

Clicking is the easy part. The interesting parts are who's allowed to click, and what the agent should believe afterward.

## A plain library can't hold a permission

On macOS, Accessibility, Screen Recording and event synthesis are granted to an app. Not to a library, and not to whatever process happens to load one. So the package can't just be an npm module you import and call. It comes in three parts (Fig. 1):

1. A Swift runtime, built as a dylib, that a signed GUI app embeds and starts through a small C ABI. It serves a patched [Peekaboo](https://github.com/openclaw/Peekaboo) Bridge. The app holds the grants.
2. A signed client CLI that talks to that runtime over a Unix socket.
3. A TypeScript client and a protocol, so a Node or Bun host can call `desktop({ op: "apps" })` and get back text written for a model, plus an image when there is one.

The two sides check each other. The runtime only accepts a client signed by the same team with an exact identifier, and the client verifies the host's team. The embedding app signs both. That's also why the package isn't published to npm. You install it from Git at a pinned commit, and `dist/` is checked in so installing runs no build.

In Ace, the runtime lives inside the desktop app's UI process. That's why quitting Ace stops desktop tools even though the background helper keeps channels running.

## Every action uses up its observation

The part of this I'm proudest of is mostly restraint. The contract (Fig. 2) goes like this:

1. **Inspect** one exact process and window. You get accessibility text and a screenshot, and inspecting never activates the window or steals focus.
2. The observation comes with a **snapshot**, bound to that process generation, that window and the controls it saw.
3. **Act once** against the snapshot. Every dispatched action uses up its observation, including one whose result is uncertain. Want to do something else? Inspect again.

Clicks and keystrokes go to the target window in the background. The physical pointer doesn't move, and nothing falls back to global mouse or keyboard events. If the window moved, the app restarted or the control vanished, the action is refused before anything is sent.

Then every action reports one of three outcomes:

- **completed**: the native operation returned. That's still not proof the app did what you wanted, so look.
- **refused**: nothing was sent.
- **unknown**: input may have landed, or partly landed, and nobody can say.

Unknown is a real answer, and the system is built so nobody pretends otherwise. Ace's harness records the intent before it acts and never replays an interrupted action. If a channel restarts mid-click, the agent is told to inspect first and decide again. A model's instinct is to retry. On a desktop, retrying a click you can't confirm is how you send the same message twice.

## Fifteen patches

The runtime is Peekaboo 4.8.0 at a pinned revision plus fifteen patches, applied in a fixed order (Fig. 3). Each one came out of something that broke while Ace was using it, and the patch notes link the issue. A few favorites:

- Typing a newline into a web composer would press Return and send it. Unicode keyboard events are still keyboard events. Literal insertion now goes through a single temporary paste. The old clipboard is restored only when the edit is actually seen to land. If it can't be confirmed, the pasted text stays on the clipboard and other automated writes are blocked, rather than risk a delayed paste picking up the wrong thing.
- A normal quit can leave an app waiting on an unsaved-changes dialog. That used to look like an error. Now it's one dispatched operation, outcome unknown, unsafe to retry.
- Clicking a window that had moved since the snapshot was reported as "maybe dispatched," which is the scary answer. It's now a clean refusal, with a hint to refresh.

The build is strict about this stack. It checks Peekaboo's pinned revision, figures out which complete prefix of the patches the checkout already has, applies only the missing suffix, and fails if the source has drifted from every prefix. New patches go at the end. When Peekaboo upstream fixes something, the matching patch is supposed to be deleted, not carried forward.

## Where it is

It's brand new as a standalone repo, at version 0.1.0. CI checks that `dist/` matches the TypeScript source, that the modules import on Linux, and that the native build works on macOS. The extraction moved the Ace code over unchanged apart from neutral names. The patches are byte-identical.

What's not done: live capture and input checks against the standalone reference host. As of the tracking issue, they were blocked on a locked GUI session and on macOS grants that a person has to click through. That feels right. The last step of an agent-on-the-desktop project is a human approving a permission prompt.

In Ace, the tools sit behind a per-channel switch the owner controls, separate from whether teammates can invoke agents at all. It's worth saying what that switch isn't. It's not a sandbox. Agents still run as the host's user and the shell can do whatever that user can. The desktop tools are careful about the one thing they own. They never act on a window they haven't just looked at, and they never claim more than they know.
