---
title: "Ace, on our own machines"
slug: ace2
date: 2026-10-07
dek: "A second pass at a collaborative coding environment: keep the process per channel, drop the cloud VM, and let the tailnet decide who's on the team."
kicker: Workshop
draft: true
repo: https://github.com/githubnext/ace2
links:
  - label: githubnext/ace2
    url: https://github.com/githubnext/ace2
  - label: Architecture
    url: https://github.com/githubnext/ace2/blob/main/docs/architecture.md
  - label: Terms
    url: https://github.com/githubnext/ace2/blob/main/docs/terms.md
  - label: Dogfooding meta issue
    url: https://github.com/githubnext/ace2/issues/5
  - label: pi (pi-durable)
    url: https://github.com/earendil-works/pi
  - label: githubnext/desktop-tools (companion piece)
    url: https://github.com/githubnext/desktop-tools
facts:
  - label: First commit
    value: 2 October 2026
  - label: Commits on main
    value: 215 by 8 October 2026
  - label: Stack
    value: Bun, TypeScript, React, Electrobun, pi-durable
  - label: Team membership
    value: Whoever is on the tailnet
  - label: Shared services
    value: Cloudflare Durable Objects, deployed by the team
  - label: Latest build
    value: Ace canary 0.0.21, pre-release, Apple silicon, macOS 15+
  - label: License
    value: MIT
pullquotes:
  - "Ace keeps the process and drops the infrastructure."
  - "A dormant channel is a closed SQLite file."
  - "The tailnet is the team."
  - "Every PR has a section called Built in Ace, and it's meant to be a little embarrassing."
images:
  - src: /drafts/ace2/fig-1-system.svg
    alt: "Patent-style line drawing of Ace's layout: a dashed tailnet boundary containing a host machine with a gateway, three channel worker boxes (one dashed as dormant) each over a SQLite cylinder, a lane fork glyph, a teammate's machine and a phone; outside it, a dashed cloud account box holding a directory and a hosted channel, with a link dialed out from the host."
    caption: "Fig. 1. Hosts, channels and the few services a team deploys itself. Everything inside the dashed line is the team."
  - src: /drafts/ace2/fig-2-tally.svg
    alt: "Tally marks counting commits per day on githubnext/ace2 from October 2 to October 8, 2026: 49, 6, 15, 106, 18, 20 and 1."
    caption: "Fig. 2. Commits on main by author date. 215 in all."
  - src: /drafts/ace2/icon-stable.png
    alt: "Ace's app icon: a stylized green letter A built from two slanted bars on a dark rounded square with a pixel-dither texture."
    caption: "The stable app icon, from apps/desktop/icons."
  - src: /drafts/ace2/icon-canary.png
    alt: "The same Ace icon with the letter A in mustard yellow, used for canary builds."
    caption: "Canary gets yellow. Twelve canary releases are on GitHub so far."
art: >-
  Visual metaphor: the house that is also the office. Ace moves the work back
  into the machines people already own, so treat each host as a building in a
  patent elevation. Line-art subject: a cutaway laptop drawn like a filing
  cabinet, each drawer a channel worker with a SQLite cylinder inside, one
  drawer drawn dashed and shut (dormant), with a Git worktree branching out of
  the back like plumbing. Inks: fluorescent pink and black for spread one,
  blue and black for the system diagram, with orange held back for the
  security warning only. Three spreads. Spread 1 is the opener: a huge
  "ACE" in pink knocked out of a halftoned photo-texture of the icon's dither
  pattern, the dek in black, and the canary icon tipped in like a stamp.
  Spread 2 is Fig. 1 at full bleed in blue, numbered parts with leader lines
  and a legend set like a patent sheet, with the "tailnet is the team" pull
  quote sitting inside the dashed boundary. Spread 3 is the ledger: the
  commit tally (Fig. 2) run down the gutter in black, a clipping-style box
  quoting a real "Built in Ace" PR section, and the README's security
  warning reprinted in orange as a torn-out notice, plus the "not yet built"
  list as a short manifest at the foot of the page.
---

Ace is a collaborative coding environment where people and agents work together in channels. This version lives at `githubnext/ace2`, and the name tells you most of the story: there was an Ace before it.

Old Ace ran one process per channel inside a cloud VM. The repo's architecture doc says it plainly: most of the pain was the VM and the cloud infrastructure, not the per-channel process. So the second pass makes one decision and follows it everywhere. Ace keeps the process and drops the infrastructure. Channels run on the team's own machines.

## The pieces

A few nouns do most of the work, and the repo is strict about them. There's a `terms.md` file whose first line says the definitions are binding for code, docs, issues and conversation, and anyone using a word differently gets corrected, including me. I like this more than I expected to. It's a design tool more than a docs tool. Arguments about behavior turn into arguments about one word, and those are shorter.

- A **host** is one machine running Ace. It owns and runs its channels.
- A **channel** is the durable thing in the sidebar. It holds one or more chats.
- A **lane** is a Git worktree for one unit of work. At most one chat writes to a lane at a time.
- The **team** is the people and machines on one tailnet.

Under the hood, each channel is one [pi-durable](https://github.com/earendil-works/pi) session. Messages, runs, tool calls and child chats are all pi's records, and there is a rule against adding a second store for any of them. If a worker crashes, pi resumes unfinished work from its last checkpoint. Tools that aren't safe to rerun report the interruption to the model instead of running again.

A local channel is one worker process over one SQLite file. A dormant channel is a closed SQLite file. No process, no cost, and you can have thousands of them. Open one and its worker starts. When nobody is attached and nothing is running, the worker retires.

## The tailnet is the team

This is the part I find most satisfying, mostly because of what it leaves out. Ace has no accounts, no invitations and no roles. The tailnet is the team. Tailscale already knows who is on the other end of every connection, so Ace asks it (`tailscale whois`) and uses that login as the author of the message. A person is the same participant on every host.

Each host runs a gateway. On loopback it serves its owner's app. On the tailnet it accepts peer hosts and the owner's other devices, so I can open my host's address on my phone and see my channels. Teammates use their own host, which proxies to mine. Settings never leave loopback.

The README opens with a security warning, and it's worth repeating here. Agents run with the privileges of whoever runs the host. They can run shell commands and touch files outside the project. Channels and lanes are not sandboxes. Sharing a channel means letting teammates run commands on your machine. There's a switch to turn off collaborator invocation per channel, but the honest framing is that you only share Ace with people you'd hand your laptop to.

## When the laptop sleeps

Running everything on laptops has one obvious problem. Laptops close. Ace handles that with two small services the team deploys to its own Cloudflare account. Ace itself won't run a hosted service.

The **directory** is a list of hosts and the channels each one has. Every host publishes its whole set when it changes and every 30 seconds, so a sleeping host's channels stay listed and show up as offline rather than vanishing.

A **hosted channel** runs the same channel package inside a Durable Object. A Durable Object has no shell or file system, so the channel's tools still run on a host. That host is the channel's workspace. It dials out to the object and serves file and shell calls from its own lanes. If the workspace drops, the channel stays up for chat, and its tools report themselves offline.

That only works because the core channel package isn't allowed to import anything from Node, Bun or Workers. Storage, models and execution get injected. Hosted channels end up as an adapter rather than a rewrite. You can also move an idle channel between a host and the hosting service. It travels as one checksummed snapshot, capped at 32 MiB.

## Built in Ace

The rule that shapes the project most is in `AGENTS.md`: everyone who works on Ace does all Ace development in Ace. If Ace ships a surface, like diffs or terminals, you use Ace's.

Every PR has a section called Built in Ace, and it's meant to be a little embarrassing. If you used anything outside Ace, you name it, say why, and link the issue for the gap. Reading back through them, you can watch the gaps close. The first native desktop PR says Codex made the source edits, because Ace couldn't edit files yet. By the end of the week, Ace channels were doing the implementation, builds, commits and the PRs themselves, with Codex mostly coordinating and reviewing from outside, because Ace can't host an external harness yet. That's issue #9. One PR records that a UI spot check got clicked through by a computer-use tool outside Ace, because the channel doing the work had no native desktop tools.

That gap became its own project. Ace needed to see and operate its own windows to test itself, and that work grew into a separate package, [desktop-tools](https://github.com/githubnext/desktop-tools). I wrote that one up on its own.

I'm the only committer on the repo. All 215 commits are under my name. Given the rule above, though, it's more accurate to say I set up and steered a lot of channels, and they did a lot of the typing. The commit tally (Fig. 2) is less a picture of my week than a picture of the method.

## Where it is

It's early. The desktop app ships as signed canary builds for Apple silicon, and the latest is 0.0.21. You can also run the host and open the app in a browser, or on a phone over the tailnet. The architecture doc keeps an honest "not yet built" list: lobbies for presence and notifications, attachments, and running Claude Code or Codex as harnesses inside a channel. Hosted channels can't message other channels yet.

What I'd point at, if you only read one file, is `docs/terms.md`. The architecture follows from those nouns. Hosts own channels. Channels are files. Lanes are worktrees. The team is the tailnet. Most of the rest is figuring out what happens when one of them goes away for a minute.
