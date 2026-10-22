---
title: "Computer Use For All"
slug: desktop-tools
date: 2026-10-21
kicker: Desktop Tools
dek: "[Desktop Tools](https://github.com/githubnext/desktop-tools) gives agents eyes and hands on a Mac. Most of the work went into what an agent should believe after it acts, and then its engine was rewritten in Swift in about fifteen hours."
repo: https://github.com/githubnext/desktop-tools
links:
  - label: githubnext/desktop-tools
    url: https://github.com/githubnext/desktop-tools
  - label: Docs
    url: https://githubnext.github.io/desktop-tools/
  - label: Release 0.17.0
    url: https://github.com/githubnext/desktop-tools/releases/tag/v0.17.0
  - label: "The Swift rewrite (#143)"
    url: https://github.com/githubnext/desktop-tools/issues/143
  - label: Swapping over to native2
    url: https://github.com/githubnext/desktop-tools/blob/main/native2/CUTOVER.md
  - label: Notes on the old Peekaboo changes
    url: https://github.com/githubnext/desktop-tools/blob/main/native/vendor/README.md
  - label: Ace's native desktop tools doc
    url: https://github.com/githubnext/ace/blob/main/docs/desktop-tools.md
  - label: Native computer use in Ace
    url: https://github.com/githubnext/desktop-tools/issues/11
  - label: Peekaboo
    url: https://github.com/openclaw/Peekaboo
  - label: githubnext/ace
    url: https://github.com/githubnext/ace
facts:
  - label: Built on
    value: Pure Swift app since 0.17.0, with no Peekaboo, no Node and no third-party dependencies
  - label: Requires
    value: macOS 15 or later; Swift 6.2+ to build
  - label: Parts
    value: Signed menu bar app holding the grants, an MCP server inside it, and an embeddable host with a C ABI
  - label: Tools
    value: "48"
  - label: Speed
    value: desktop_windows at 6 ms p50, down from 115 ms
  - label: License
    value: MIT
images:
  - src: figs/desktop-tools/fig-1-boundary
    alt: "Line drawing of the Desktop Tools app as a large box. An agent outside it, such as Claude Code or Codex, starts desktop-tools-mcp, which ships inside the app and holds one open connection through a plug and socket labeled desktop.sock. The line passes a double-circle gate tied to an alert card reading 'Allow claude-code to control this Mac?' with Don't Allow and Allow buttons, noted 'asked once per agent; refused until allowed'. It reaches the host, which accepts only its own signed client, checked by audit token, and holds three keys: Accessibility, Screen Recording and event synthesis. From the host an arrow labeled input and captures runs out of the app to a dashed box, any other app's window; a crossed dashed arrow from the host back to the alert reads no input to itself."
    caption: "Fig. 1. Who holds the permission. macOS grants it to the app, so the work happens inside the app. Agents reach it through one connection, and each agent is asked about once."
  - src: figs/desktop-tools/fig-2-loop
    alt: "Three steps in a row: 1 inspect, an eye over a window, noted accessibility text and a screenshot, never steals focus; 2 snapshot, a ticket labeled snapshot_id, noted the window and the controls it saw, single use; 3 act once, a pointer with an optional tag reading expect. The action branches into three boxes: completed (reached that window), a dashed unknown (may have landed) and refused (nothing was sent). An arrow from unknown to completed reads expected change seen. Lines from all three boxes join a rail labeled every outcome returns to inspect."
    caption: "Fig. 2. Observe, act once, observe again. The dashed box is the one that matters."
  - src: figs/desktop-tools/fig-3-stack-to-port
    alt: "Three stages left to right under the dates Oct 8, Oct 19 and Oct 20. First, a thin stack of fifteen sheets on a block labeled Peekaboo 4.8.0, pinned at 4d43dc9. Second, a tall stack of sixty-four sheets on the same block, held by a clamp labeled vendored, noted more than 15,000 lines of patches, never moved to a newer Peekaboo. Four sheets are highlighted and labeled secure-fill, stale-click, insert and click under the word ported, and dotted arrows run from them into the third stage: one plain, taller block labeled native2, about 19,000 lines of Swift, no dependencies."
    caption: "Fig. 3. Fifteen patches, then sixty-four, then none. The changes that mattered were carried into the rewrite as ports."
  - src: figs/desktop-tools/fig-4-handover
    alt: "Three rows. Before, 0.16.1 and earlier: agent, then node dist/mcp.js, often through npx, then a stack of desktop-client pills, a fresh signed client for every call, then a socket, then the Peekaboo Bridge inside Desktop Tools.app. After, 0.17: agent, then desktop-tools-mcp inside Desktop Tools.app, one connection kept open through a socket to the Swift host; beneath it, desktop_windows: 6 ms at the median, down from 115. An existing npx setup: at 0.17.0 or later an arrow runs up into desktop-tools-mcp labeled hands over; pinned earlier, it reaches desktop-client, now the new client, which answers with a slip reading CLIENT_OUTDATED that names the server to set up instead."
    caption: "Fig. 4. The handover. New setups talk to the server in the app, current npx setups are handed to it, and old pinned ones are told how to update."
  - src: figs/desktop-tools/ill-1-ticket
    alt: "A pointer clicks a ticket, which tears along its perforation; the stub drifts away to the left."
---

[Ace](https://github.com/githubnext/ace) has a rule that all Ace development happens in Ace. That rule hits a wall as soon as the thing you're building is a desktop app. To check a native change, an agent has to look at real windows, click real buttons and work through real dialogs.

So Ace grew native desktop tools: inspect a window, click, type, drag, scroll, use menus and the clipboard, launch and quit apps. They now live in their own project, [Desktop Tools](https://github.com/githubnext/desktop-tools), which is also a menu bar app any agent can use: Claude Code, Codex, or anything else that speaks MCP.

Clicking is the easy part. The interesting parts are who's allowed to click, and what the agent should believe afterward.

## A plain library can't hold a permission

On macOS, Accessibility, Screen Recording and event synthesis are granted to an app. Not to a library, and not to whatever process happens to load one. So the work happens inside a signed app, and everything else talks to it over a Unix socket (Fig. 1):

1. A host that holds the grants: the Desktop Tools app, or any signed app that embeds the host library, as Ace does.
2. An MCP server, `desktop-tools-mcp`, shipped inside the app. An agent starts it, and it keeps one connection open to the host.
3. For apps that embed the host, a signed client CLI and a TypeScript API, so a Node or Bun process can call `desktop({ op: "apps" })`.

The host checks who's on the other end. It only accepts a client signed by its own team with one exact identifier, and it checks the running process, not just its pid. Then the app asks once per agent: "Allow claude-code to control this Mac?" Until you say yes, every request from that agent is refused, screenshots included. Input aimed at Desktop Tools itself is always refused. That rule came from testing the prompt, when an agent could click Allow on it for itself.

## Every action uses up its observation

The part I'm proudest of is mostly restraint. The contract (Fig. 2):

1. **Inspect** one exact window. You get accessibility text and a screenshot, and it never steals focus.
2. The observation comes with a **snapshot** of that window and the controls it saw.
3. **Act once** against the snapshot. Every action that sends input uses up its observation, even one whose result is uncertain. Want to do something else? Inspect again.

Most input goes to the target window in the background, and the physical pointer doesn't move. The few tools that need the real pointer or keyboard, like hover or a Command-click, say so. If the window moved, the app restarted or the control vanished, the action is refused before anything is sent. Every action reports one of three outcomes:

- **completed**: the input reached that exact window. Some tools also read the change back. Otherwise it's still not proof the app did what you wanted, so look.
- **refused**: nothing was sent.
- **unknown**: input may have landed, and nobody can say.

Unknown is a real answer, and the system is built so nobody pretends otherwise. A model's instinct is to retry. On a desktop, retrying a click you can't confirm is how you send the same message twice. What an agent can do instead is say what it expects, such as a window appearing. If that change shows up, an unknown becomes completed.

## Sixty-four patches

Underneath the app, until October 20, was [Peekaboo](https://github.com/openclaw/Peekaboo) 4.8.0 plus patches applied in a fixed order (Fig. 3). Each one came out of something that broke while an agent was using it. Clicking a window that had moved used to come back as "maybe dispatched," the scariest possible answer. Now it's a clean refusal.

At the start of October there were fifteen. By October 19 there were 64, more than 15,000 lines of patch files, and we had never moved to a newer Peekaboo. It was a fork in all but name, so that night it became one, with every change applied in a copy inside the repo.

The same evening I asked how insane it would be to rewrite the whole thing from the ground up, without Peekaboo, maybe in Rust. I don't like TypeScript, and we had to have Swift anyway for the system APIs and the signed app, so it might as well be one language. Rust wouldn't make it noticeably faster. The time went to two places: the Node server started a fresh signed client for every call, and every Accessibility read is a round trip into the target app. "If rust isn't worth it, we skip," I said. "I can see it with how deeply we will be interfacing with macos in general." So: one Swift codebase, no Peekaboo, no Node. I filed the plan and closed it as not planned. An hour later I picked it back up: "start chewing through a pure swift spike and see how it goes."

## Same answers, faster

The rewrite, called native2, didn't get to change what a model sees. The 48 tools' schemas and instructions were frozen, and each tool was ported to give the same result, field for field: 583 recorded calls, then live runs against a small window that logs every mouse event. The Peekaboo code that mattered came along as ports, like clicking a background window without moving the pointer.

My bar was "as good or better than the original." The agent doing the port didn't merge the first time it thought it was done, because the Mac had been locked all night and nothing had run on a live screen. The two stacks could run side by side, so native2 went in next to the old one first.

`desktop_windows` went from 115 ms to 6 ms at the median, and inspecting a Ghostty window from 551 ms to 42. The app's binaries shrank from about 84 MB to about 6 MB. The few changes callers see are deliberate: launch and open stay in the background unless asked, so an agent opening an app doesn't take my keyboard, and a key refused because focus left the window now says refused, not unknown, since nothing was sent.

The hard part was everyone already set up for the old engine (Fig. 4). The MCP server now lives in the app, so agents don't need Node. An `npx` setup at 0.17.0 or later hands its connection to that server. One pinned to an older release reaches the new client, which answers `CLIENT_OUTDATED` and names the server to set up instead.

0.17.0 went out on October 20, about fifteen hours after the spike started, and 0.17.1 followed that afternoon. Ace still runs the old stack. Deleting Peekaboo waits until it moves.

The desktop tools are careful about the one thing they own. They never act on a window they haven't just looked at, and they never claim more than they know.
