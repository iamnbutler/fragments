---
title: "A Lease on the Work"
slug: spool
date: 2026-01-26
kicker: Spool
dek: "[Spool](https://github.com/iamnbutler/spool) keeps a repository's tasks in the repository, as a log of events. I built it in January, stopped using it, and in September had Codex rebuild it in an afternoon around one question: which agent has this task right now?"
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
  - label: Built
    value: January 13 to February 14, 2026, then rebuilt on September 15
  - label: History
    value: 146 commits on main, 43 merged pull requests, 9 releases
  - label: Size
    value: About 7,500 lines of Rust in three crates, and 276 tests
  - label: Install
    value: cargo install spool-cli, or binaries for macOS and Linux
  - label: Storage
    value: Event files in the repo. No server, no database
  - label: Pairs with
    value: Telephone, for messages between agents
---

Spool is a task tracker that lives in the repository it tracks. There's no server and no web app. Tasks, notes and completions are events, written as small JSON files under `.spool/` and committed with the code. A command line tool reads and writes them, and a terminal UI shows them.

It was built for coding agents. Several agents can work from one board: each takes a task, keeps notes on it, and finishes it or hands it on, and none of them can take a task another one is holding.

That last part is new. The first Spool, in January, was a tracker that agents could use. In September I rebuilt it so that several agents could use it at once, and most of what's interesting is the gap between the two.

```sh
cargo install spool-cli --locked
spool init
spool add 'Fix the thing' -p p0 -t bug
```

## Tasks in the repo

Tasks should live where the code lives. When project tracking is a SaaS product, you're one acquisition or pricing change away from losing your history. Worse, the tracking is cut off from the work: tasks sit in a web app while the context is in the repo, the branches and the commits. In Spool the history travels with the code. Clone the repo and you have it.

Spool came out of exploring agentic orchestration. In January I spent about two weeks running several projects through Gas Town, a multi-agent setup where a coordinating agent files work for a pool of workers. Its issues are [Beads](https://beads.dev), another tracker for agents. Tools like that exist, but I wanted something more opinionated and more mine: build it, use it every day, see what works.

The spec that started it, on January 13, was called Fabric. It asked for a tracker that was git-native, conflict-resistant, auditable, and "agent-scale," handling 50 to 200 tasks a day from automated agents. Fittingly, the first day's code was written by Gas Town's worker agents, from epics in Beads. The commit authors are named eventsmith and rustsmith. Three days later Fabric was renamed Spool, and it reached 1.0 on January 24.

## An event log

Every change is an event appended to a log: create, update, assign, comment, link, complete, reopen. These two are from Spool's own board, trimmed:

```json
{"v":1,"op":"create","id":"mu31qv7e-dq90","ts":"2026-09-15T19:10:11.855819Z","by":"codex:spool-reforge","branch":"codex/agent-coordination","d":{"title":"Remove the standalone coordination design document","priority":"p2"}}
{"v":1,"op":"complete","id":"mu31qv7e-dq90","ts":"2026-09-15T19:11:06.062398Z","by":"codex:spool-reforge","branch":"codex/agent-coordination","d":{"resolution":"done","ref":"README.md"}}
```

Each event says who did what, when, and on which branch. The current state of every task is whatever you get by replaying the events in order. Task IDs are a base-36 timestamp plus four random characters, so two branches can create tasks without coordinating.

The idea held up. The event envelope from the January 13 spec is the one Spool reads today; the schema's first version is frozen, and the rebuild only added new operations.

## What I had wrong

The January version of this post said conflicts would be rare, because two people appending to the same daily log just meant keeping both sets of lines. That's true of the events. It isn't true of Git. Two branches that each add a line to the end of the same file have made two edits in the same place, and Git stops the merge with conflict markers. Resolving it by hand was easy, but it wasn't automatic.

When I came back to Spool, the agent I asked to audit it found more:

- `spool claim` didn't claim anything. It assigned the task to the Git user, unconditionally. Every agent on my machine was me, so a claim couldn't tell two agents apart, and nothing stopped a second one claiming the same task. On the board for Luna, my design tool, all 226 January events are by `@iamnbutler`.
- The code had a concurrency module, but ordinary writes didn't use it.
- Reads could trust a cached snapshot, `.state.json`, long after the events had changed. The fix in January's README was a post-merge hook that ran `spool rebuild`.
- Each Git worktree found its own `.spool` folder, so agents in two worktrees had two boards and couldn't see each other's work.

None of that bit hard while I was the only one using it, one agent at a time. It would all have bitten the moment several agents shared a board, which was the point.

## Dropped, then picked up

The January post ended on two open questions. Agents wouldn't use the tracker consistently: they'd track tasks for a while, then forget to update status, create duplicates, or ignore the backlog. And the hooks that kept caches fresh were local and fragile, fine for one person but not for a team.

Then I stopped using it. The last feature work landed on February 14, with live reload in the TUI. Through early March an automated repo assistant kept adding tests and updating dependencies, and after that the repository sat for six months.

On September 14 I started [Telephone](https://nate.rip/telephone/), a small tool for passing messages between Claude Code and Codex sessions on one machine. The next afternoon I gave Codex this prompt:

> so, we sort of explored spool for a while then dropped it.
>
> I recently built https://nate.rip/telephone/ and thought, "I wonder if we can pair spool and telephone to make an effiecient system for agents to collaborate together"
>
> why don't you investigate the current state of spool and pull out a branch and go take a chainsaw to it, reforging it into a really solid tool for agents to use for task management.

That was at 13:57. It tracked its own work in Spool as it went, in a stream called `agent-coordination`. The pull request added 3,794 lines and removed 2,133. It merged at 15:15, and version 2.0.0 was published at 15:38.

## One board per repository

The first decision was where the board lives. Worktrees are how agents get to work side by side in one repository, so the board couldn't belong to a worktree. It lives in the repository's Git common directory, `.git/spool`, which every linked worktree shares, including ones made before `spool init`. Switching branches doesn't roll it back.

That splits Spool into two places. The live board in `.git/spool` is where work happens. The `.spool/` folder in a checkout is what Git carries. `spool sync` copies durable events from the board into the checkout so they can be committed, including events recorded in other worktrees. Each command also imports whatever events it finds in its checkout, so history that arrives by pull or merge joins the board. Sync never commits, pushes or merges.

Some events never leave the board. Claims and renewals are written to `.git/spool/.local/events` and are never exported. A clone starts with the task history, then makes its own claims. So the boundary is one machine. The README says it in bold: independent clones or machines do not share atomic claims. Git is how history moves between machines, not how agents on different machines avoid each other.

## Claims are leases

Version 2 changed what a claim is.

Every agent session needs its own identity, set with `--agent`, `SPOOL_AGENT` or a Telephone address. The Git user is still fine for ordinary edits by a person, but claiming work requires an explicit identity.

`spool next` picks the highest-priority ready task and claims it in one step. Picking and claiming as two commands would leave a gap where two agents pick the same task. When there's no work, `next` returns `null` and exits 0, because an empty queue isn't an error.

A claim is a lease. It lasts 15 minutes by default, anywhere from a second to 24 hours on request, and the agent renews it while it works. If an agent crashes or wanders off, the lease runs out and the task goes back in the queue. That's the answer to January's agents that forgot to update status: a forgotten task now comes back on its own.

Every claim comes with a fresh random token, and changing a claimed task needs both the token and the matching identity. That fences off stale workers. If agent A stalls past its lease and agent B claims the task, A's late `complete` fails, even if A is using the same name, because the new claim has a new token. Anyone can still add notes to a claimed task. And an expired claim can be released by anyone, without a token, with a note saying what happened, which matters for a task whose prerequisites keep it from being claimed again.

Everything is shaped for an agent reading the output. Every command takes `--json` and writes one JSON value. Errors are JSON on stderr with a stable code like `claim_conflict` or `lease_expired`. Exit code 2 means a conflict, a stale claim or a busy board, so an agent can tell "try again" from "something is broken."

The test that matters most starts sixteen real processes and has them all claim one task at the same moment. Exactly one wins. Another runs `next` from sixteen processes against a board of eight tasks: each task is handed out once, and eight agents get `null`.

## Events as files

The storage changed underneath.

Each new event is its own file now, named by its timestamp and the SHA-256 hash of its contents. Two branches that each add events add different files, so Git has nothing to merge. Copying an event twice is harmless, because the second copy has the same name and the same bytes. A file whose name doesn't match its contents is treated as tampered with, and Spool refuses to read the board. The old daily logs and monthly archives are still read, and never rewritten.

Writes go through one lock per board, an operating-system file lock that the kernel releases when a process dies, so a crash can't wedge the board. Under the lock, a write replays the current events, checks the change against the result, and publishes it whole: written to a temporary file, synced, then moved into place without overwriting anything. If another agent got there first, the check runs against its result. If a timestamp would tie with the last event, it's nudged a nanosecond later, so the order of events always matches the order of writes.

Reads always replay the events. No read trusts a cache, so there's nothing to go stale and no hook to keep fresh. January's question about hooks didn't get a better hook. It went away.

## Streams and dependencies

Streams group tasks into a project or an epic. The agent guide asks for scope, acceptance criteria, file ownership and expected output in each task's description, because the description is what the next agent reads.

Tasks can block each other. A task is ready when it's open, nobody holds a live claim on it, its prerequisites are complete, and any reservation on it matches the agent asking. "Ready" depends on who's asking. A missing prerequisite blocks too. Spool checks for cycles when an edge is added, under the same lock, so two agents adding opposite edges at once can't make one. Completing a prerequisite makes its dependents ready; it never completes them.

There's a difference between `assign` and `claim`. Assigning reserves future work for someone. Claiming says who's working on it now.

## Spool and Telephone

Spool keeps tasks. Telephone carries messages. Neither runs the other.

`spool handoff` records who the task is for, a note and a reference together, releases the current claim, and returns a message ready to send with Telephone. Spool never sends it. The recipient still has to claim the task before working on it, because, as the agent guide puts it, "a message or assignment is not proof that work has started." If a message is late or lost, the assignment and the note are still on the board. Handoffs work the same for a person or an agent without a Telephone address.

## How it's used

A new agent starts with `spool prime`, which prints the whole work loop in under forty lines. The repository's `skills/spool.md` is the same loop as a skill, and the project's `AGENTS.md` points at both. The loop:

```sh
export SPOOL_AGENT=parser-worker
spool next --json
spool renew <id> --token <token>
spool comment <id> 'Parser done; checking Unicode boundaries' --ref src/parser.rs
spool complete <id> --token <token> --note 'Implemented; parser tests pass'
spool sync
```

A person mostly plans: makes a stream, adds tasks with good descriptions, and says which block which. Then the agents pull.

The day after the release, four agent sessions, two Claude Code and two Codex, built the first features of a personal assistant app from one Spool board, with Telephone between them. In two hours they made 12 tasks in two streams and completed all 12. There were 12 claims and 11 renewals. The agents asked for leases of an hour or two rather than the 15-minute default. Nobody used `handoff`. They talked over Telephone and wrote it down in notes: 37 of them, half longer than 780 characters, the longest about 8,000.

The coordinating agent wrote a retrospective afterwards. Telephone was the main source of friction; its messages could be accepted without reaching the session that needed them, and it had to be patched mid-run. Spool needed no changes: "Claims and leases made ownership explicit; descriptions recorded acceptance criteria and file boundaries; completion notes recorded actual checks." And one line I'd keep: "Spool did not replace conversation, but it was a useful record of what that conversation had decided."

## The TUI

`spool-ui` is a terminal view of the board: a priority-sorted task list, a detail pane with each task's full event history, search, and views for streams and for the whole project's history, newest first. It reloads when the events change. Since version 2 it shows which agent holds a task and when the lease runs out, and it goes through the same guarded writes as the CLI, so it can't overwrite a live claim. It still can't renew or complete one; that takes the CLI and the token.

## What I learned

Getting agents to use a tracker consistently was the main problem in January, and it's a lot like getting people to. Discipline is hard enough for humans. Version 2 doesn't make agents disciplined. It makes forgetting cheap: a lease runs out, a token goes stale, and the task goes back to whoever's next.

"Claim" meant the wrong thing for months without anyone noticing, because one agent at a time can't see the difference between an assignment and a lock. The first real test of a coordination tool is several agents racing it, and that's the test Spool now runs in CI.

The hard part wasn't the log. Append-only events were right on the first day, and they're why history from January still loads. What needed rethinking was everything around the log: where the board lives, who's allowed to write, and what a read can trust.

## Where it is

This site used Spool for its own tasks; the January post said so. The `.spool/` folder went when the site moved to Cloudflare in October. I'm not using it day to day now. We might pick it back up, for real or in spirit: what I'd want is a local, lightweight replacement for GitHub, and that would need to be a good deal more full-featured than Spool is.

The boundary is written down. Atomic claims cover one repository and its worktrees on one machine. Older Spool binaries don't take part in the lock, so every agent on a board has to run 2.0. It's open source and on crates.io, and it's small enough to read in an afternoon, which is about how long the rebuild took.
