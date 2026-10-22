---
title: "Do Not Acknowledge Acknowledgments"
slug: telephone-line
date: 2026-09-14
kicker: Telephone
dek: "[Telephone](https://nate.rip/telephone/) lets Claude Code and Codex sessions on the same machine find each other, pass notes and wait for replies. Most of the work went into being honest about what it can't promise."
repo: https://github.com/iamnbutler/telephone
links:
  - label: iamnbutler/telephone
    url: https://github.com/iamnbutler/telephone
  - label: nate.rip/telephone
    url: https://nate.rip/telephone/
  - label: Security and delivery limits
    url: https://github.com/iamnbutler/telephone/blob/main/SECURITY.md
  - label: Routing and diagnostics
    url: https://github.com/iamnbutler/telephone/blob/main/docs/codex-polling.md
  - label: "Accepted, but never shown in the inbox (#42)"
    url: https://github.com/iamnbutler/telephone/issues/42
  - label: Telephone v0.2.0
    url: https://github.com/iamnbutler/telephone/releases/tag/v0.2.0
facts:
  - label: Built
    value: September 14 to 20, 2026
  - label: History
    value: 52 commits on main, 22 merged pull requests, 5 releases
  - label: Size
    value: About 7,200 lines of Rust, MIT license
  - label: Install
    value: cargo install telephone, or binaries for macOS and Linux, ARM64 and x86-64
  - label: Runtimes
    value: Codex and Claude Code, on one machine and one OS account
  - label: Limits
    value: 64 KiB per message, 8 hops per conversation, a 15-second polling window
images:
  - src: figs/telephone/fig-1-route
    alt: "One message, sent with telephone send, is written to the journal, messages.sqlite, first. It then reaches a board of three numbered jacks under the heading first match wins: 1, --delivery inbox, the sender asked for it; 2, fresh polling, the recipient checked less than 15 seconds ago; 3, otherwise, the runtime's own channel. Jacks 1 and 2 are patched to the Telephone inbox, held until the recipient runs check_inbox, recorded as queued. Jack 3 is patched to the native route: Claude Code's Unix socket, recorded as unconfirmed, or Codex's codex queue, recorded as accepted. A dashed line from the native route back to the inbox says it falls back to the inbox only before any bytes are sent. Below, in teal: failed-or-uncertain, no retry, no copy."
    caption: "Fig. 1. Route selection for one new message. First match wins, and a native route falls back to the inbox only before any bytes go out."
  - src: figs/telephone/fig-2-window
    alt: "A timeline from 0 to 50 seconds with three lanes. The recipient runs check_inbox every 2 seconds from 0 to 20 seconds, then stops checking. In the middle lane, new messages route to the inbox (yellow) until 15 seconds after the last check, at 35 seconds, where a teal dashed line marks expiry; after it they route native (blue). In the sender lane, a request at 12 seconds goes to the inbox and opens the sender's own 15-second window; a send at 40 seconds goes native. A teal note under the line: expiry changes routing for new messages only."
    caption: "Fig. 2. The fifteen-second window. Each inbox check renews it, and a request opens one for its sender."
  - src: figs/telephone/fig-3-two-phones
    alt: "Two columns. Claude Code: discovery reads ~/.claude/sessions/<pid>.json, one JSON record per session; then a <pid>.<sha256>.key file, mode 0600, holding the socket's token; then the Unix socket /tmp/cc-socks/<pid>.sock, newline-delimited JSON where the first frame authenticates. The message arrives as a new user turn, written but with nothing to confirm it was read, and telephone list shows live. Codex: discovery reads the threads table in ~/.codex/state_<n>.sqlite (id, cwd, last update); there is no socket and no token; delivery is codex queue --thread=<id>, which puts the message in the thread's queue. It arrives when the thread next runs, accepted but not a read receipt, and telephone list shows recent?."
    caption: "Fig. 3. Two runtimes, two phones. Claude has a socket that rings; Codex has a queue that waits for the next turn."
  - src: figs/telephone/fig-4-envelope
    alt: "A printed form headed ENVELOPE with one row per field: id, a new UUID for every message; conversation, a UUID that replies keep; reply_to, the message this answers, which a reply must have; from, claude:24207; to, codex:<thread id>; kind, with tick boxes for inform, request (ticked) and reply; body, 1 byte to 64 KiB; trust, a single ticked box, untrusted, the only option; hop_chain, eight boxes with three filled, eight hops at most, and a ninth is refused: start a new conversation only with user direction."
    caption: "Fig. 4. The envelope. The trust field has one possible value."
  - src: figs/telephone/ill-1-candlestick
    alt: "A candlestick telephone drawn in yellow, blue and teal plates: a round transmitter on a tall stem above a flared foot, the switch hook empty, the teal receiver lifted off to the right on its cord, and the line cord looping out from the foot to a single jack plug."
---

Telephone is a command-line tool and MCP server for sending messages between coding agents on the same machine. Right now that means Codex and Claude Code. The README opens with a warning I meant: **unsafe, experimental software**. If one agent sends another a message, that can lead to commands being run or files being changed.

It started on September 14 with a question about what an agent-agnostic communication layer between agents would look like. After one round of design I told the agent to stop: "just go build it and we'll try it out rather than going back and forth on a design." The first commit landed that morning, and the first release went out at lunch.

The use I had in mind is the example on the homepage. You've got Claude Code working on a plan in one terminal and Codex in another, and you tell Codex: find the Claude session working in this project, read its latest plan, check it against the code, send feedback, ask for a reply. Telephone handles discovery and delivery. The agents do the reading.

## Three tools

The interface is small on purpose. Over MCP there are three tools: `list_agents`, `send_message` and `check_inbox`. The CLI mirrors them (`telephone list`, `send`, `inbox`), adds `whoami` and `doctor`, and `telephone install` prints the config for both runtimes. It doesn't edit anyone's config files itself.

Addresses look like `runtime:local-id`, so `claude:24207` or `codex:` followed by a thread UUID. There's no registration step. Messages come in kinds: `inform` by default, `request` when you need an answer, and `reply` with a `reply_to` ID. Every message is an envelope with an ID, a conversation, sender and recipient, a body capped at 64 KiB, a trust field that can only say `untrusted`, and a hop chain. After eight hops the conversation stops, and the error says to start a new one only with user direction.

## Two runtimes, two very different phones

Neither runtime documents a way for outsiders to talk to it, so I had to learn how each one works from what's on disk.

Claude Code turned out to be the easy one. It already has a peer-messaging layer. I found it by poking around, not in any docs. Each live session writes a JSON record to `~/.claude/sessions/<pid>.json`, there's a private `0600` token file next to it, and there's a Unix socket that takes newline-delimited JSON. The first frame authenticates and the rest are messages. Telephone speaks that directly, so a message turns up in Claude's transcript as a new user turn. Since none of it is documented, any Claude Code release could break it.

Codex has no socket. Discovery reads Codex's own thread registry, a SQLite table with each thread's ID, working directory, nickname and last update. Delivery goes through `codex queue --thread <id>`, which puts a message in a thread's queue, and Codex picks it up when the thread next runs. That's a real push channel, but all you learn is that the message was queued, not that anyone saw it.

That split shows up all over the tool. In `telephone list`, a Claude session gets the label `live`, meaning the process and its start time were verified. A Codex thread gets `recent?`, question mark included, because recent activity can't tell you whether a thread is still running or exited a second after its last write.

I tried to do better and couldn't. Only the Codex process that loaded a thread knows its status, and a freshly started app-server answers `notLoaded` for every thread on the machine. The ChatGPT app's private socket frames messages with a four-byte length, so a request that opens with `{"id` reads as a length of 1,684,611,707 and gets hung up on. Even spoken correctly, it answers who owns a thread, not whether it's running. About 200 lines of liveness code came out in a commit titled "Remove Codex liveness enrichment that could never confirm anything." I'd rather show the question mark than fake an answer.

## The first call

That afternoon, a Codex session sent a request to a Claude Code session named `telephone-demo`. It arrived through Claude's socket as a new turn. Claude checked its own identity with `list_agents` and replied with the request's ID. The reply went into Codex's queue and showed up as a new Codex turn once the original turn finished. The nonce was `switchboard-914-r2`. Claude's reply:

> Verified: I am claude:24207. Nonce: switchboard-914-r2. Two agents traded careful signals and finished together.

The demo also found two bugs. A sandboxed process probe was hiding live Claude sessions. And Claude's MCP process had inherited the Codex thread ID from whatever launched it, so its first reply was rejected as a self-send. Both are fixed.

## A second opinion

Claude wrote the first version. Then I had a Codex session review it, and it came back with four high-priority bugs and seven medium ones, each with a reproduction. The suggested reply command dropped the sender's address in unquoted, so a test fixture could run a stray `printf`. Every send started a fresh hop chain, replies included, so the eight-hop guard could never trip. Two readers draining one inbox at the same time could hand out every message twice. And "delivered" only meant a socket write had happened.

My instructions for the fixes were to harden the Rust, be skeptical of `?`, avoid mocks, and "treat security as if we will enable messaging from other sources in the future." Inbox reads became SQLite transactions, marked read only after the response is written. A journal keeps each reply's ancestry, so hops add up across a conversation. And a native send that fails after it may have started is reported as uncertain and never retried.

## Trust, or the lack of it

Everything here assumes one machine and one OS user. Addresses and names are routing hints, not identities, and nothing authenticates them. All peer text arrives labelled as untrusted and quoted as a JSON string, so it can't fake a header or a second reply command. That isn't a prompt-injection sandbox, and a comment in the code says so. The receiving agent still follows its own user's instructions and approval rules. A peer can't grant authority. It's another agent with opinions, not a user.

Identity gets the same treatment. Codex's MCP identity comes from the per-call `threadId` the host sends. Claude's comes from walking up the process tree to a verified session. A working directory, a display name or "the newest session" is never used to guess who you are. If identity is ambiguous, Telephone fails instead of picking one.

## Accepted, not read

The hardest problem was replies, and I found it by using the thing. One night in September I left a three-agent team building Shelf Goblin, my audiobook catalog: a Codex session as lead and two Claude sessions taking tasks from it over Telephone. One Claude sent the lead four coordination messages over about 40 minutes. Each came back `Accepted by codex queue; not a read receipt`, which was true. The lead was polling its Telephone inbox, which was empty, and it answered through me:

> My inbox is still empty despite Nate saying you need me. If telephone delivery is broken, please put your coordination note at …HANDOFF.md (gitignored), and tell Nate it is there.

Nothing was broken. A Codex queue message can wait until the thread's current turn ends, and a lead that's polling for replies is in the middle of a turn. The agents worked around it by writing handoff files into the repo, and the next day the sending Claude wrote it up as issue #42, with the outcome of every message in a table.

## Fifteen seconds

Version 0.2 sorts this out with evidence that runs out. Each inbox check advertises that the agent is polling for 15 seconds. Sending a request does the same for the sender, so a quick reply can land before its first poll. Claude's evidence is tied to the session, not just the PID, so a new session can't inherit an old one's window. When Telephone sends a new message, it picks a route in order:

1. If the sender asked for the inbox explicitly, use the inbox.
2. If the recipient has fresh polling evidence, use the inbox.
3. Otherwise go native: Claude's socket, or Codex's queue.

A native route can fall back to the inbox, but only before any bytes have gone out. Once a native send may have started, Telephone won't retry it or copy it into the inbox. When the evidence expires, routing changes for new messages only. Nothing that was already sent gets moved or resent.

Acceptance is not a read receipt. A Claude socket write is unconfirmed. A Codex queue command that succeeds means accepted, not read. The inbox can't wake an idle agent. Send results now say which channel a message took, an empty Codex inbox mentions messages accepted by its native queue, and `telephone doctor <address>` shows the routing evidence and the last 20 journal entries to that recipient, without the message bodies.

## Narrowing the line

For a few days in mid-September, Telephone also tried to cover OpenCode, Zed and Delta through registered inboxes and HTTP bindings. Then I asked whether dropping everything but Codex and Claude Code would make it easier to use. It would. In 0.2.0, on September 20, I took all of that out. The agent started writing a migration path and I stopped it: "basically no one uses this yet." It's a breaking change with no compatibility layer, and the source got about 1,300 lines shorter.

Telephone is back to the two runtimes I could actually test against real sessions. The release suite ran Codex↔Claude, Codex↔Codex and Claude↔Claude exchanges with real models on macOS ARM64, including waiting out a real fifteen-second expiry. Long conversations between agents eat context fast. Two overnight Claude sessions had reached 415,632 and 505,465 tokens, so there's now an optional Claude hook that reminds the agent to compact at 250k and again at 300k.

There's real work left, and it's listed in the security doc: authenticated senders and per-agent authorization, confirmed receipts and safe retries, retention and rate limits. Until the first one exists, Telephone shouldn't be reachable from a network.

It's a small tool. Being honest about what it doesn't know turned out to be most of the work. My favorite line is still the last one in the agent instructions: request a reply only when you need one, and do not acknowledge acknowledgments.
