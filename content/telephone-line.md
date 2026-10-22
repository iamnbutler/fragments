---
title: "Every Agent Gets a Number"
slug: telephone-line
date: 2026-09-14
kicker: Telephone
dek: "[Telephone](https://nate.rip/telephone/) lets the Claude Code and Codex sessions on your machine find each other and talk. A model from one company can review another's plan, hand it work, or wait on its answer, without you copying text between terminals."
repo: https://github.com/iamnbutler/telephone
links:
  - label: iamnbutler/telephone
    url: https://github.com/iamnbutler/telephone
  - label: nate.rip/telephone
    url: https://nate.rip/telephone/
  - label: Routing and diagnostics
    url: https://github.com/iamnbutler/telephone/blob/main/docs/codex-polling.md
  - label: Security and delivery limits
    url: https://github.com/iamnbutler/telephone/blob/main/SECURITY.md
  - label: Shelf Goblin
    url: https://nate.rip/shelfgoblin/
facts:
  - label: What
    value: A command-line tool and MCP server, in Rust, MIT license
  - label: Talks to
    value: Claude Code and Codex sessions on one machine
  - label: Agent tools
    value: list_agents, send_message, check_inbox
  - label: Install
    value: cargo install telephone, or binaries for macOS and Linux, ARM64 and x86-64
  - label: Built
    value: September 14 to 20, 2026; v0.2.0 is current
  - label: Limits
    value: 64 KiB per message, 8 hops per conversation
images:
  - src: figs/telephone/fig-4-team
    alt: "Three sessions on one machine with Telephone, drawn as a small switchboard, between them. On the left a Codex session, codex:019a\u2026, the lead, in one repo, sends request messages through Telephone and gets reply messages back. On the right two Claude Code sessions, claude:41822 and claude:41907, workers in another repo: one receives the request \u201ctake the series page\u201d, the other \u201ctake the reading history\u201d and sends back the reply \u201cdone: PR #31\u201d. A teal arrow runs from one worker through Telephone to the other, a request asking \u201cis the header yours?\u201d, without going to the lead. Small and faded in the corner, you, asleep."
    caption: "Fig. 1. One team, two companies. A Codex lead hands out work, Claude workers report back and ask each other, and nobody relays."
  - src: figs/telephone/fig-3-two-phones
    alt: "Two columns. Claude Code: discovery reads ~/.claude/sessions/<pid>.json, one JSON record per session; then a <pid>.<sha256>.key file, mode 0600, holding the socket's token; then the Unix socket /tmp/cc-socks/<pid>.sock, newline-delimited JSON where the first frame authenticates. The message arrives as a new user turn, written but with nothing to confirm it was read, and telephone list shows live. Codex: discovery reads the threads table in ~/.codex/state_<n>.sqlite (id, cwd, last update); there is no socket and no token; delivery is codex queue --thread=<id>, which puts the message in the thread's queue. It arrives when the thread next runs, accepted but not a read receipt, and telephone list shows recent?."
    caption: "Fig. 2. Two runtimes, two phones. Claude has a socket that rings; Codex has a queue that waits for the next turn."
  - src: figs/telephone/fig-1-route
    alt: "One message, sent with telephone send, is written to the journal, messages.sqlite, first. It then reaches a board of three numbered jacks under the heading first match wins: 1, --delivery inbox, the sender asked for it; 2, fresh polling, the recipient checked less than 15 seconds ago; 3, otherwise, the runtime's own channel. Jacks 1 and 2 are patched to the Telephone inbox, held until the recipient runs check_inbox, recorded as queued. Jack 3 is patched to the native route: Claude Code's Unix socket, recorded as unconfirmed, or Codex's codex queue, recorded as accepted. A dashed line from the native route back to the inbox says it falls back to the inbox only before any bytes are sent. Below, in teal: failed-or-uncertain, no retry, no copy."
    caption: "Fig. 3. Route selection for one new message. First match wins, and a native route falls back to the inbox only before any bytes go out."
  - src: figs/telephone/fig-2-window
    alt: "A timeline from 0 to 50 seconds with three lanes. The recipient runs check_inbox every 2 seconds from 0 to 20 seconds, then stops checking. In the middle lane, new messages route to the inbox (yellow) until 15 seconds after the last check, at 35 seconds, where a teal dashed line marks expiry; after it they route native (blue). In the sender lane, a request at 12 seconds goes to the inbox and opens the sender's own 15-second window; a send at 40 seconds goes native. A teal note under the line: expiry changes routing for new messages only."
    caption: "Fig. 4. The fifteen-second window. Each inbox check renews it, and a request opens one for its sender."
  - src: figs/telephone/ill-1-candlestick
    alt: "A candlestick telephone drawn in yellow, blue and teal plates: a round transmitter on a tall stem above a flared foot, the switch hook empty, the teal receiver lifted off to the right on its cord, and the line cord looping out from the foot to a single jack plug."
---

Telephone gives every Claude Code and Codex session running on your machine an address, and gives the agents three tools: one to see who else is running, one to send a message, and one to check for replies. That's enough for a Codex thread to find the Claude session working in the same repository, ask it a question, and get the answer back as part of its own conversation.

Each of these tools is built to work alone. Claude Code can start subagents, but they're more Claude, with the same training and the same blind spots. Getting a second model's opinion used to mean me copying a plan out of one terminal, pasting it into another, and carrying the answer back. Telephone takes me out of the middle. The agents can reach across the line between companies and models on their own, and I can give them work that needs more than one of them.

## A second opinion

The example on the homepage is the one I use most. Claude is writing a plan in one terminal, Codex is in another, and I tell Codex: find the Claude session working in this project, read its latest plan, check it against the code, send feedback, and ask for a reply. Telephone does the finding and the delivery. The agents do the reading and arguing. Models trained by different companies miss different things, so this catches more than asking the same model to look again. When Codex reviewed Telephone's own first version, which Claude wrote, it came back with four high-priority bugs and seven medium ones, each with a reproduction.

## Teams that mix models

I've run Codex and Claude as one team overnight. For [Shelf Goblin](https://nate.rip/shelfgoblin/), my audiobook catalog, a Codex session in one repository was the lead and two Claude Code sessions in another were the workers. I told the Claude sessions to treat the lead's instructions as if they were mine and went to bed. The lead handed out tasks as requests, the workers reported back with replies, and most of the reader-facing app was built by morning. I've used the same setup for Jeeves and Autoperf. A brief for a team like this names each member by its address, says which of them can redirect work, and says what done means.

## Agents asking each other

Workers don't have to go through a lead. One Claude session can ask another which files it's touching before it edits them, or a session that's stuck can ask one that already solved the same problem. None of that needs me.

## Using it

```sh
cargo install telephone --locked
telephone install   # prints the MCP config for Claude Code and Codex
```

After that, you mostly ask your agent in plain words: find the Codex thread working on this repo and ask it to review my change. Under that are three MCP tools, `list_agents`, `send_message` and `check_inbox`, and a CLI that mirrors them (`telephone list`, `send`, `inbox`), plus `doctor` for when something doesn't arrive.

An address is the runtime and its own ID: `claude:24207` for a Claude session's process, or `codex:` and a thread UUID. There's no registration step and no sender to configure. Telephone works out who's calling from the process tree or from the thread ID Codex sends with every MCP call. A message is an `inform` by default, a `request` when the sender needs an answer, or a `reply` that points back at the request it answers.

## How a message gets through

Neither Claude Code nor Codex documents a way for outside programs to talk to a running session, so Telephone uses what each one already has.

Claude Code has its own peer messaging under the hood. Each live session writes a record to `~/.claude/sessions/<pid>.json`, keeps a private token next to it, and listens on a Unix socket. Telephone writes to that socket, and the message shows up in Claude's conversation as a new turn, even if the session was sitting idle. Codex keeps a registry of its threads in SQLite and has a `codex queue` command that puts a message in a thread's queue. Codex picks it up the next time that thread runs.

Those native routes can wake an agent up, but they have a gap. An agent that sent a request and is waiting for the answer is in the middle of a turn, and Codex won't read its queue until the turn ends. So Telephone also keeps its own inbox, which an agent can poll with `check_inbox`. To choose between them, each inbox check counts as evidence that the agent is listening there, and the evidence lasts fifteen seconds. Sending a request counts too, so a fast reply lands in the inbox before the sender's first check. A new message goes to the inbox while the evidence is fresh, and to the native route otherwise. Nobody has to pick a route by hand.

## Caveats

- **One machine, one user.** Addresses are routing hints, not identities, and nothing authenticates the sender. A message from another agent arrives marked as untrusted text. It can't grant permissions, and the receiving agent still follows its own user's rules. A conversation stops after eight hops, so two agents can't bounce messages forever. The README opens with a warning I meant: unsafe, experimental software. One agent's message can lead another to run commands or change files.
- **Sent isn't read.** A Claude socket write isn't confirmed, and a successful `codex queue` means the message was queued, not seen. Before v0.2.0, a Shelf Goblin worker's status messages sat in the Codex queue while the lead polled an empty inbox. The agents fell back to leaving handoff notes in the repository. Telephone now says which channel each message took, and `telephone doctor` shows the evidence behind the choice.
- **Codex can't say it's running.** `telephone list` marks a Claude session `live` when its process checks out. A Codex thread only gets `recent?`, because nothing outside Codex can tell whether a thread is running or exited a second after its last write.
- **Undocumented interfaces.** Both routes rely on internals that Anthropic and OpenAI haven't promised to keep. Any release of either tool could break them.
- **Long conversations cost context.** Agents that talk all night fill their context windows fast, so an optional hook reminds Claude to compact at 250k and again at 300k tokens.

For a few days Telephone also tried to reach OpenCode, Zed and Delta. Version 0.2.0 took all of that out to make the two runtimes I use work well, and it got easier to use.

Going further than one machine would need authenticated senders and real permissions first. Until then it's a phone line inside your own house, which turns out to be most of what I wanted: the agents I already run, from two companies, working on the same problem without me relaying between them.
