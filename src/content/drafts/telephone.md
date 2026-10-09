---
title: Telephone
slug: telephone
date: 2026-09-14
dek: "A small Rust CLI and MCP server that lets [Codex](https://github.com/openai/codex) and [Claude Code](https://github.com/anthropics/claude-code) sessions on the same machine find each other, pass notes and wait for replies, and that's careful about what it can't promise."
kicker: Field Notes
draft: true
repo: https://github.com/iamnbutler/telephone
links:
  - label: Homepage
    url: https://nate.rip/telephone/
  - label: Source on GitHub
    url: https://github.com/iamnbutler/telephone
  - label: Releases
    url: https://github.com/iamnbutler/telephone/releases
  - label: Security and delivery limits
    url: https://github.com/iamnbutler/telephone/blob/main/SECURITY.md
  - label: Routing and diagnostics
    url: https://github.com/iamnbutler/telephone/blob/main/docs/codex-polling.md
facts:
  - label: Language
    value: Rust, MIT license
  - label: Runtimes
    value: Codex and Claude Code
  - label: Interfaces
    value: CLI, plus an MCP server with 3 tools
  - label: Releases
    value: 5, v0.1.0 to v0.2.0, Sept 14–21, 2026
  - label: Poll window
    value: 15 seconds, renewed by each inbox check
  - label: Hop limit
    value: 8 per conversation
  - label: Max message
    value: 64 KiB body
  - label: Platforms
    value: macOS and Linux, ARM64 and x86-64
pullquotes:
  - "Acceptance is not a read receipt."
  - "A peer can't grant authority. It's another agent with opinions, not a user."
  - "Being honest about what it doesn't know turned out to be most of the work."
  - "request a reply only when you need one, and do not acknowledge acknowledgments."
images:
  - src: /drafts/telephone/homepage.png
    alt: The Telephone homepage, with an ASCII-art payphone beside the title, an install section, and an ASCII plasma pattern drifting in the right margin.
    caption: The homepage at nate.rip/telephone. Payphone ASCII art by Joan Stark; palette by David Aerne.
  - src: /drafts/telephone/fig1-switchboard.svg
    alt: Patent-style line drawing labelled FIG. 1. A sending agent writes to a journal, then a three-jack route selector patches the message to the Telephone inbox, the Claude socket, or the Codex queue, with a dashed fallback trunk back to the inbox.
    caption: "FIG. 1. Route selection for one outgoing message. First match wins; native routes fall back to the inbox only before any bytes are sent."
  - src: /drafts/telephone/fig2-window.svg
    alt: Patent-style timeline labelled FIG. 2. Inbox checks every two seconds hold a hatched fifteen-second window open; a send inside it goes to the inbox, a send after expiry goes native.
    caption: "FIG. 2. The fifteen-second window. Expiry changes routing for new messages only."
  - src: /drafts/telephone/homepage-notes.png
    alt: The Notes section of the Telephone homepage, a bulleted list of delivery limits ending with "do not acknowledge acknowledgments."
    caption: The fine print, which is most of the product.
art: >-
  The metaphor is the manual telephone exchange: an operator, a jack field and patch cords, with every message going through a board that decides where to plug it in. Line art is a late-19th-century patent drawing of a switchboard or candlestick telephone (public domain, with FIG. numbers and reference numerals), redrawn in black. My FIG. 1 and FIG. 2 diagrams are made to sit next to it in the same style. Inks: fluorescent pink for patch cords and anything "live", blue for the Codex side, orange for the Claude side, black for line art, type and the fine print. Keep the hatched fifteen-second window in FIG. 2 as a pink halftone. Four spreads. (1) Opener: huge "TELEPHONE" headline in black over a full-bleed pink halftone of the patent switchboard, with the dek set as an operator's ticket. (2) "How a message finds its way": FIG. 1 enlarged across the gutter as a switchboard patch, with the cords overprinted in pink and the three jacks numbered like the route-selection rules, plus the facts box as a spec plate screwed to the board's corner. (3) "The radio log": the September 14 demo exchange set as a monospaced transmission log (timestamps left out, sender and receiver addresses in blue and orange, nonce "switchboard-914-r2" circled in pink), with FIG. 2 running along the bottom as a tape strip. (4) "Fine print": the homepage Notes screenshot as a torn clipping taped at an angle, the ASCII payphone as a small credited clipping, a big "Acceptance is not a read receipt." pullquote, and the remaining-work list as a carbon-copy work order.
---

Telephone is a command-line tool and MCP server for sending messages between coding agents on the same machine. Right now that means Codex and Claude Code. The README opens with a warning I meant: **unsafe, experimental software**. If one agent sends another a message, that can lead to commands being run or files being changed.

The use I had in mind is the example on the homepage. You've got Claude Code working on a plan in one terminal and Codex in another, and you tell Codex: find the Claude session working in this project, read its latest plan, check it against the code, send feedback, ask for a reply. Telephone handles discovery and delivery. The agents do the reading.

## Three tools

The interface is small on purpose. Over MCP there are three tools: `list_agents`, `send_message` and `check_inbox`. The CLI mirrors them (`telephone list`, `send`, `inbox`), adds `whoami` and `doctor`, and `telephone install` prints the config for both runtimes.

Addresses look like `runtime:local-id`, so `claude:24207` or `codex:` followed by a thread UUID. Messages come in kinds: `inform` by default, `request` when you need an answer, and `reply` with a `reply_to` ID. Every message is an envelope with an ID, a conversation, sender and recipient, a body capped at 64 KiB, a trust field that can only say `untrusted`, and a hop chain. After eight hops the conversation stops, and the error says to start a new one only with user direction.

## Two runtimes, two very different phones

Neither runtime documents a way for outsiders to talk to it, so I had to learn how each one works from what's on disk.

Claude Code turned out to be the easy one. It already has a peer-messaging layer. I found it by poking around, not in any docs. Each live session writes a JSON record to `~/.claude/sessions/<pid>.json`, there's a private `0600` token file next to it, and there's a Unix socket that takes newline-delimited JSON. The first frame authenticates and the rest are messages. Telephone speaks that directly, so a message turns up in Claude's transcript as a new user turn. Since none of it is documented, any Claude Code release could break it.

Codex has no socket. Discovery reads Codex's own thread registry, a SQLite table with each thread's ID, working directory, title and last update. Delivery goes through `codex queue --thread <id>`, which puts a message in a thread's queue, and Codex picks it up when the thread next runs. That's a real push channel, but all you learn is that the message was queued, not that anyone saw it.

That split shows up all over the tool. In `telephone list`, a Claude session gets the label `live`, meaning the process and its start time were verified. A Codex thread gets `recent?`, question mark included, because recent activity can't tell you whether a thread is still running or exited a second after its last write. I'd rather show the question mark than fake an answer.

## Fifteen seconds

The hardest problem was replies. Say Codex sends Claude a request and then polls for the answer. If Claude's reply goes to Codex's native queue, Codex won't see it until its current turn ends, and the turn won't end while it's waiting on the reply. So the polling agent sits there looking at an empty inbox while its answer waits in a different queue.

Version 0.2 sorts this out with evidence that runs out. Each inbox check advertises that the agent is polling for 15 seconds. Sending a request does the same for the sender, so a quick reply can land before its first poll. When Telephone sends a new message, it picks a route in order:

1. If the sender asked for the inbox explicitly, use the inbox.
2. If the recipient has fresh polling evidence, use the inbox.
3. Otherwise go native: Claude's socket, or Codex's queue.

A native route can fall back to the inbox, but only before any bytes have gone out. Once a native send may have started, Telephone won't retry it or copy it into the inbox. When the evidence expires, routing changes for new messages only. Nothing that was already sent gets moved or resent.

Acceptance is not a read receipt. A Claude socket write is unconfirmed. A Codex queue command that succeeds means accepted, not read. The inbox can't wake an idle agent. When you're not sure where something went, `telephone doctor <address>` shows the routing evidence and the last 20 journal entries to that recipient, without the message bodies.

## Trust, or the lack of it

Everything here assumes one machine and one OS user. Addresses and names are routing hints, not identities, and nothing authenticates them. All peer text arrives labelled as untrusted and quoted as data. That isn't a prompt-injection sandbox. The receiving agent still follows its own user's instructions and approval rules. A peer can't grant authority. It's another agent with opinions, not a user.

Identity gets the same treatment. Codex's MCP identity comes from the per-call `threadId` the host sends. Claude's comes from walking up the process tree to a verified session. A working directory, a display name or "the newest session" is never used to guess who you are. If identity is ambiguous, Telephone fails instead of picking one.

## The first call

On September 14, a Codex session sent a request to a Claude Code session named `telephone-demo`. It arrived through Claude's socket as a new turn. Claude checked its own identity with `list_agents` and replied with the request's ID. The reply went into Codex's queue and showed up as a new Codex turn once the original turn finished. The nonce was `switchboard-914-r2`. Claude's reply:

> Verified: I am claude:24207. Nonce: switchboard-914-r2. Two agents traded careful signals and finished together.

The demo also found two bugs. A sandboxed process probe was hiding live Claude sessions. And Claude's MCP process had inherited the Codex thread ID from whatever launched it, so its first reply was rejected as a self-send. Both are fixed.

## Narrowing the line

For a few days in mid-September, Telephone also tried to cover OpenCode, Zed and Delta through registered inboxes and HTTP bindings. In 0.2.0 I took all of that out. It's a breaking change with no migration layer, and Telephone is back to the two runtimes I could actually test against real sessions. The release suite ran Codex↔Claude, Codex↔Codex and Claude↔Claude exchanges on macOS ARM64. There's also an optional Claude hook that reminds the agent to compact at 250k and 300k context tokens, because long conversations between agents eat context fast.

There's real work left, and it's listed in the security doc: authenticated senders and per-agent authorization, confirmed receipts and safe retries, retention and rate limits. Until the first one exists, Telephone shouldn't be reachable from a network.

It's a small tool. Being honest about what it doesn't know turned out to be most of the work. My favorite line is still the last one in the agent instructions: request a reply only when you need one, and do not acknowledge acknowledgments.
