---
title: "A Lease on the Work"
slug: spool
date: 2026-01-26
kicker: Spool
dek: "[Spool](https://github.com/iamnbutler/spool) keeps a repository's tasks in the repository and lets several coding agents work from one board. Each takes its task on a lease, so no two hold the same one, and a task an agent forgets comes back on its own."
repo: https://github.com/iamnbutler/spool
links:
  - label: iamnbutler/spool
    url: https://github.com/iamnbutler/spool
  - label: The agent guide (skills/spool.md)
    url: https://github.com/iamnbutler/spool/blob/main/skills/spool.md
  - label: "Reforge Spool for shared agent task coordination (#120)"
    url: https://github.com/iamnbutler/spool/pull/120
  - label: Spool v2.0.0
    url: https://github.com/iamnbutler/spool/releases/tag/v2.0.0
  - label: Telephone
    url: https://nate.rip/telephone/
facts:
  - label: Install
    value: cargo install spool-cli, or binaries for macOS and Linux
  - label: Storage
    value: Event files in the repo. No server, no database
  - label: Claims
    value: Atomic across every worktree of a repository on one machine
  - label: Pairs with
    value: Telephone, for messages between agents
  - label: Status
    value: Version 2.0, open source, not in daily use
images:
  - src: figs/spool/fig-1-two-places
    alt: "A repository on one machine, drawn as a main checkout and two linked worktrees, each with its own .spool/events/ folder. Arrows from all three point down to one live board at .git/spool/, which holds events/ (tasks, notes, completions) and .local/events/ (claims and renewals, which never leave the board). An arrow labelled spool sync copies durable events from the board up into one worktree's .spool/events/, which you then commit. Across a dashed line, push and pull carry that folder to a clone on another machine, whose own .git/spool/ board starts with the history and then makes its own claims."
    caption: "Fig. 1. Two places. Every worktree shares one live board in .git/spool; Git carries only what spool sync exports, and claims stay on the machine."
  - src: figs/spool/fig-2-lease
    alt: "A timeline with three lanes: agent A, the task and agent B. Agent A runs next, which claims the task with token A, renews twice, then goes quiet. Fifteen minutes after the last renewal the lease runs out and the task is ready again. Agent B runs next and gets a new token, token B. Later agent A calls complete --token A; the call is crossed out with claim_conflict and exit 2."
    caption: "Fig. 2. A lease, not a lock. A worker that goes quiet loses the task, and its old token can't touch the new claim."
  - src: figs/spool/fig-3-append
    alt: "Two halves. On the left, January: two branches each add a line to the end of the same daily log, 2026-01-25.jsonl, and the merged file holds Git's conflict markers around the two lines; Git stops and both lines are kept by hand. On the right, September: each branch adds its own file, named by timestamp and SHA-256 hash (20260915T191011…-c9d4321d….jsonl and 20260915T191106…-1d8f9603….jsonl); merging adds both files to .spool/events/, and replay sorts every event by time."
    caption: "Fig. 3. Appending to one file conflicts. Adding new files doesn't."
  - src: figs/spool/fig-4-race
    alt: "Two panels. Top: sixteen agents, agent-0 to agent-15, each run claim against one task; one arrow reaches the task and the other fifteen stop short with a cross, getting claim_conflict and exit 2. Bottom: sixteen agents each run next against eight tasks; eight arrows each reach a different task and the other eight agents get null."
    caption: "Fig. 4. The test that defines 'works'. Sixteen processes claim one task and exactly one wins; sixteen calls to next share eight tasks, each handed out once."
  - src: figs/spool/ill-1-spool
    alt: "A wooden spool of thread. Its loose end runs off the spool and across the page, knotted at intervals, and ends in a small tag tied on with a loop of string."
---

Spool is a task tracker that lives in the repository it tracks. There's no server and no web app. Tasks, notes and completions are events, written as small JSON files under `.spool/` and committed with the code. A command line tool reads and writes them, and a terminal UI shows them.

It's built for several coding agents working on one repository at once. Each agent takes a task, keeps notes on it, and finishes it or hands it on, and none of them can take a task another one is holding.

## Why it's useful

**Agents can split up a project without stepping on each other.** The day after version 2 shipped, four sessions, two [Claude Code](https://claude.com/product/claude-code) and two [Codex](https://developers.openai.com/codex), built the first features of a personal assistant app from one board. They made 12 tasks in two streams and finished all 12, each claimed by exactly one agent. They talked over [Telephone](https://nate.rip/telephone/) and wrote what they'd decided into task notes. The coordinating agent's retrospective put it well: "Spool did not replace conversation, but it was a useful record of what that conversation had decided."

**Ownership is explicit.** At any moment you can ask which agent has a task and until when. The same retrospective: "Claims and leases made ownership explicit; descriptions recorded acceptance criteria and file boundaries; completion notes recorded actual checks."

**Forgetting is cheap.** Agents, like people, track tasks for a while and then forget to update them. In Spool a claim runs out if nobody renews it, and the task goes back in the queue for whoever's next.

**The history travels with the code.** Tasks sit next to the branches and commits they're about. Clone the repo and you have them. No SaaS product can take them away with a pricing change.

## Using it

```sh
cargo install spool-cli --locked
spool init
spool add 'Fix the thing' -p p0 -t bug
```

A person mostly plans: makes a stream for a project, adds tasks with good descriptions, and says which block which. [The agent guide](https://github.com/iamnbutler/spool/blob/main/skills/spool.md) asks for scope, acceptance criteria, file ownership and expected output in each description, because the description is what the next agent reads. Then the agents pull. A new agent starts with `spool prime`, which prints the whole loop in under forty lines:

```sh
export SPOOL_AGENT=parser-worker
spool next --json
spool renew <id> --token <token>
spool comment <id> 'Parser done; checking Unicode boundaries' --ref src/parser.rs
spool complete <id> --token <token> --note 'Implemented; parser tests pass'
spool sync
```

`spool-ui` is a terminal view of the same board: tasks by priority, each task's full history, streams, search, and which agent holds what and when its lease runs out.

## Claims are leases

Every agent session needs its own identity, set with `--agent`, `SPOOL_AGENT` or a Telephone address. Ordinary edits by a person can use the Git user, but claiming work can't. The first Spool claimed tasks for the Git user, and since every agent on my machine was me, a claim couldn't tell two of them apart.

`spool next` picks the highest-priority ready task and claims it in one step, so two agents can't pick the same task in the gap between choosing and claiming. When there's no work, it returns `null` and exits 0, because an empty queue isn't an error.

A claim is a lease (Fig. 2). It lasts 15 minutes by default, anywhere from a second to 24 hours on request, and the agent renews it while it works. If an agent crashes or wanders off, the lease runs out and the task is ready again.

Every claim comes with a fresh random token, and changing a claimed task needs both the token and the matching identity. If agent A stalls past its lease and agent B claims the task, A's late `complete` fails, even under the same name, because the new claim has a new token. Anyone can still add notes to a claimed task, and anyone can release an expired claim with a note saying what happened.

Everything is shaped for an agent reading the output. Every command takes `--json` and writes one JSON value. Errors are JSON on stderr with a stable code like `claim_conflict` or `lease_expired`, and exit code 2 means a conflict, a stale claim or a busy board, so an agent can tell "try again" from "something is broken."

The test that defines "works" starts sixteen real processes and has them claim one task at the same moment. Exactly one wins. Another runs `next` from sixteen processes against eight tasks: each task is handed out once, and eight agents get `null` (Fig. 4).

## One board per repository

Worktrees are how agents work side by side in one repository, so the board can't belong to a worktree. It lives in the repository's Git common directory, `.git/spool`, which every linked worktree shares (Fig. 1). Switching branches doesn't roll it back.

That gives Spool two places. The live board in `.git/spool` is where work happens. The `.spool/` folder in a checkout is what Git carries. `spool sync` copies durable events from the board into the checkout so they can be committed, and every command imports the events it finds in its checkout, so history that arrives by pull or merge joins the board. Sync never commits, pushes or merges.

Claims and renewals never leave the board. A clone starts with the task history, then makes its own claims.

## An event log, as files

Every change is an event: create, update, assign, comment, link, complete, reopen. Each says who did what, when, and on which branch. These two are from Spool's own board, trimmed:

```json
{"v":1,"op":"create","id":"mu31qv7e-dq90","ts":"2026-09-15T19:10:11.855819Z","by":"codex:spool-reforge","branch":"codex/agent-coordination","d":{"title":"Remove the standalone coordination design document","priority":"p2"}}
{"v":1,"op":"complete","id":"mu31qv7e-dq90","ts":"2026-09-15T19:11:06.062398Z","by":"codex:spool-reforge","branch":"codex/agent-coordination","d":{"resolution":"done","ref":"README.md"}}
```

A task's state is whatever you get by replaying its events. IDs are a base-36 timestamp plus four random characters, so two branches can create tasks without coordinating.

Each event is its own file, named by its timestamp and the SHA-256 hash of its contents. Two branches that add events add different files, so Git has nothing to merge (Fig. 3); the first Spool appended to one log per day, and Git stopped every merge where two branches had both added lines. A copied event is harmless, because it has the same name and bytes. A file whose name doesn't match its contents is treated as tampered with, and Spool refuses to read the board.

Writes go through one lock per board, an operating-system file lock that the kernel releases when a process dies, so a crash can't wedge the board. Under the lock, a write replays the events, checks the change against the result, and publishes it whole. Reads always replay too. Nothing trusts a cache, so nothing goes stale.

## Dependencies, and Telephone

Tasks can block each other. A task is ready when it's open, nobody holds a live claim on it, its prerequisites are complete, and any reservation on it matches the agent asking, so "ready" depends on who's asking. Cycles are refused when an edge is added. `assign` reserves future work for someone; `claim` says who's working on it now.

Spool keeps tasks and [Telephone](https://nate.rip/telephone-line/) carries messages, and neither runs the other. `spool handoff` records who a task is for, releases the current claim, and returns a message ready to send. The recipient still has to claim the task before working on it, because, as the agent guide puts it, "a message or assignment is not proof that work has started." If the message is lost, the assignment and the note are still on the board.

## Caveats

- **One machine.** Atomic claims cover one repository and its worktrees on one machine. Clones on other machines share history through Git, not claims, and the README says so in bold.
- **Everyone on 2.0.** Older binaries don't take the lock, so every agent on a board has to run version 2.
- **Agents still have to use it.** Spool doesn't make agents disciplined; it makes forgetting cheap. In the assistant-app run nobody used `handoff`, and the agents asked for leases of an hour or two rather than the default.
- **It's small.** It's a tracker, not a replacement for GitHub. What I'd want next is a local, lightweight GitHub, and that would need much more than Spool is. I'm not using it day to day.

It's open source, on [crates.io](https://crates.io/crates/spool-cli), and small enough to read in an afternoon. The idea at the center is the useful part: a task belongs to one agent at a time, for a while, and comes back when that agent goes quiet.
