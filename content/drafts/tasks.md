---
title: "Serial by Design"
slug: tasks
date: 2026-10-08
kicker: Tasks
dek: "[Tasks](https://github.com/iamnbutler/tasks) turns a GitHub issue tracker into merged pull requests. The first version ran its agents side by side and drowned in conflicts. The second sends everything through one long conversation, on purpose."
draft: true
repo: https://github.com/iamnbutler/tasks
links:
  - label: iamnbutler/tasks
    url: https://github.com/iamnbutler/tasks
  - label: "RFC: Double Diamond Architecture (#744)"
    url: https://github.com/iamnbutler/tasks/issues/744
  - label: The orchestrator's mind (plan)
    url: https://github.com/iamnbutler/tasks/blob/main/docs/plans/2026-08-14-orchestrator-mind.md
  - label: nate.rip/tasks
    url: https://nate.rip/tasks/
facts:
  - label: Built
    value: March to August 2026, with a sixteen-week gap
  - label: History
    value: 719 commits on main, 608 pull requests, 491 issues
  - label: Size
    value: About 135,000 lines, mostly Rust, and about 1,500 tests
  - label: Runs on
    value: macOS, with agents in apple/container VMs
  - label: Agent engine
    value: Claude Code, headless
images:
  - src: drafts/tasks/fig-1-shapes
    alt: "Line drawing in two halves. On the left, labeled version one, five issue cards each feed their own agent, and five pull request arrows converge on a line labeled main, where crosses mark conflicts. On the right, labeled version two, three issue cards feed three scouts side by side; each scout hands over a folded document labeled SPEC.md, the documents stack into a single file, and one builder carries them down a single lane into main."
    caption: "Fig. 1. Two shapes. Version one ran N agents on N tasks. Version two explores side by side and builds in single file."
  - src: drafts/tasks/fig-2-barrier
    alt: "Line drawing of two VMs separated by a wall. In the left VM a scout writes code and two documents, NOTES.md and SPEC.md; the code goes into a bin labeled thrown away. Only SPEC.md passes through a slot in the wall, to a review stamp and then into the right VM, where a builder writes new code. Under the drawing, a rail of task states runs backlog, queued, scouting, in review, ready to build, building, awaiting merge, done, with rejected branching off below."
    caption: "Fig. 2. The barrier. A Scout's code never leaves its VM; only the spec crosses, and the Builder starts over from the text."
  - src: drafts/tasks/fig-3-tick
    alt: "Line drawing of the orchestrator's turn. Four voices on the left, labeled you, pipeline, agent and worker, and a stack labeled obligations, flow with a computed brief into a single oval labeled one Claude Code session, resumed. A single arrow labeled curl leaves it for the HTTP API, which passes through a gate marked charter, with off, shadow and live, before reaching GitHub and the pipeline. Every crossing is written to a long strip labeled decisions ledger."
    caption: "Fig. 3. One turn. Everything waiting is folded into one prompt for one long conversation, and every write it makes passes the charter and lands in the ledger."
  - src: drafts/tasks/fig-4-charter
    alt: "A printed table with eleven rows, one per capability: capture work, retire work, queue tasks, dispatch builds, auto review specs, comment on work, land builds, curate work, cancel runs, enroll agents and dispatch workers. Three columns are labeled off, shadow and live, and every row is ticked live. A hand-drawn note in the margin reads human-writable only."
    caption: "Fig. 4. The charter. Eleven capabilities, every one shipped live. Shadow is kept for demotion."
  - src: drafts/tasks/fig-5-merged
    alt: "Line drawing of a branch graph. A main line runs left to right. Branch A leaves main and merges back. Branch B, stacked on A, merges into A only after A has already merged, so its commits end on a dead branch. A stamp reading merged sits on B. Beneath it, a check reads: merged, and the merge commit is an ancestor of main."
    caption: "Fig. 5. Merged is not shipped. #863 merged into a branch that had already landed, so its work never reached main."
---

Tasks is a server that runs on my Mac. It reads a repository's GitHub issues, hands them to Claude Code agents working in throwaway VMs, and turns what they make into merged pull requests. Beside that pipeline sits an orchestrator: one Claude Code conversation that doesn't end. It reviews the agents' plans, starts builds, lands them and talks to me.

Over five months it collected 719 commits on main, 608 pull requests and 491 issues, and it's about 135,000 lines today. Before that, one commit deleted 81,716 lines. Most of what's interesting about Tasks happened between those two numbers.

## N agents, N tasks

The first version, in March, had the obvious shape. Each task got a container, an agent implemented it directly, and the result went into a merge queue as a pull request. In sixteen days, agents opened 313 pull requests against Tasks' own repository, and 199 of them merged.

Parallel looked like leverage. A lot of it turned out to be cleanup:

- The poller picked up agent pull requests as new tasks, which spawned agents that opened more pull requests.
- Five containers at 8 GB each could exhaust the Mac's memory and lock it up. That happened twice.
- A detector that watched agent output for questions like "should I…" was switched off for false positives.
- One commit is titled "Fix review issues from bulk-merged PRs".

In April, an [RFC](https://github.com/iamnbutler/tasks/issues/744) named the problem. N agents implementing N tasks in parallel leads to "endless conflicts", "duplicate work" and "no shared context". Each agent could be right on its own terms and still be wrong next to the others, because none of them knew what the rest were doing.

Version two began with a commit that "deletes all v1 code, docs, web frontend, desktop app, CI, and scripts". That's the 81,716 lines. Then the branch sat for sixteen weeks. Work picked up again on August 9, and most of what follows was built in the twelve days after that.

## Explore in parallel, build in series

The RFC's answer was to split the work in two and give each half the opposite kind of concurrency.

Exploring is parallel. A **Scout** takes one issue into a fresh VM and implements it for real. Then its code is thrown away. What the Scout hands back is a SPEC.md, a written description of the change. The RFC's case for doing the work twice: "Throwaway implementation forces real understanding. An agent that just reads an issue and writes a spec is guessing."

Building is serial. Once a spec is approved, a **Builder** implements it in another fresh VM, without ever seeing the Scout's code. There's exactly one build lane. Approved specs wait for it, and when it frees up, whatever is waiting goes in together as one branch and one pull request.

Two ideas hold this up. The first is the barrier: "Reimplementing from the spec alone is what proves the spec is complete." If the Builder can't get there from the text, the text was missing something. The second is that text composes and branches don't. The resume plan is blunt about it: "at 70+ issues no tool keeps N branches conflict-free, but N documents merge trivially."

There's a small rule hiding in the Scout. It keeps NOTES.md as it goes, saved every 30 seconds, and writes SPEC.md only once it has actually concluded. If it dies early, the notes survive, but they never become a spec, because "a half-explored spec in the review queue looks finished." A valid SPEC.md finishes a Scout whatever its exit code. A missing one is the failure.

The single lane does a quieter job too. Adding a repository with 11,000 open issues must not turn into 11,000 Scout runs. Intake drops everything into a backlog that nothing is dispatched from, and since builds are serial, "the 11,000-PR outcome is structurally impossible rather than rate-limited."

## One long conversation

The orchestrator is the part I find most interesting.

It isn't an agent framework. Every second, the server checks whether anything is waiting for it. If something is, it shells out to headless Claude Code and resumes the same session it resumed last time: one conversation, days long, picking up where it left off. By default the only tool it has is curl, pointed at Tasks' own HTTP API.

It's serial on purpose. The plan that defines it says:

> Accumulated context is the product, not an implementation detail. … without it, the platform is N parallel Claude Code sessions with extra steps.

The evidence came from review. Of three real defects the orchestrator's review caught, two could only be caught by something holding the other in-flight work in mind. One spec added migration 0009 when a 0009 had already landed on main. Another rebuilt a test harness that was sitting in an open pull request. A reviewer that sees one spec at a time can't see either, so parallel verdicts were ruled out. The orchestrator is "the pipeline's serial bottleneck by design."

Each turn's prompt is built from four voices:

- me
- [pipeline] notices about what just happened
- [agent] messages from outside agents, read "as a peer's unverified leads"
- [worker] reports from the disposable sessions it sends off to do labor

Notices are batched and can be dropped, and that's fine, because they only make it faster. What can't be dropped is computed instead. Every minute, the server works out what the orchestrator owes, like a spec to review, a build to dispatch or a batch to land, and keeps reminding it until it's done. The rule behind that is one of the best lines in the repo: "every state the pipeline can rest in either is terminal or has an obligation that names who owes what. A state that is neither is a place work goes to be forgotten."

The server also precomputes a brief for each decision: files a spec touches that open work also touches, clashing sequence numbers, the state of related pull requests, earlier verdicts. It replaced a prompt that spent 10–50k tokens a cycle paging through the event log to rebuild the same picture. The plan calls one property of the brief load-bearing, and it's good advice for anything that summarizes for a model: "silence means unchecked, not fine."

A long conversation has its own way of failing. If a resume fails, the chat carries on as if nothing happened, and "the thing writing it has forgotten the morning." Now a failed resume closes the old session in a ledger and writes a visible seam into the conversation.

## Authority lives in a table

What the orchestrator may do isn't written in its prompt. It's in a table.

The charter has one row per capability, eleven in the code, from `queue_tasks` and `auto_review_specs` to `land_builds` and `dispatch_workers`. Each is set to off, shadow or live, and only I can write the rows. Every turn, the authority section of the prompt is generated from them, and the server enforces the same rows on its endpoints. A comment in the orchestrator explains why: "A prompt sentence is the weakest mechanism this codebase has — the charter exists because authority should not be something a long conversation can talk itself out of."

The interesting part is the defaults. Every capability shipped live. The rejected alternatives are written down: everything off ("wrong safe"), shadow first, daily caps, and a "the human told me to" flag, which "would hand the charter's keys to the thing it governs." Instead of approval gates, every write lands in an append-only decisions ledger to be read afterwards. The README's version: "Oversight happens after the fact, where it's cheap, instead of as pre-approval gates, where it's the bottleneck."

Shadow mode got one real day. With `auto_review_specs` in shadow, the orchestrator "wrote a correct and well-argued verdict — and then handed it back as prose for the human to read and re-enter by hand." That's the most expensive setting there is for the one resource that's actually short. The same plan says plainly that tokens aren't the constraint: "the scarce resource is the human's attention, not tokens." Shadow is now only for demoting a capability that misbehaves.

The model has a sharp edge, and the code says so. A write the server can't attribute is recorded as mine, and I'm never gated, so a broken agent credential "does not fail closed, it *escalates*." That's why workers get no curl at all. A comment on the issue that proposed workers, opening with "Orchestrator here.", spelled out what would happen otherwise: a worker with curl and no credential has "full human authority over the entire API."

## Confident and wrong

Give an agent authority and it will sometimes use it wrongly, with complete confidence.

The orchestrator once rewrote a Builder's pull request body from "Implements #N" to "Closes #N" and reported it as a bug fix. The original wording was deliberate. The server neutralizes closing keywords so GitHub won't close an issue just because a pull request merged. The issue that recorded this says: "The orchestrator was confident and wrong, and nothing in the system would have caught it." It had also been counting opened pull requests as shipped work.

That produced a rule that sounds obvious and took two tries: done means shipped. The second try came from #863, a pull request GitHub shows as merged whose work never reached main. It was stacked on another branch and merged into that branch after the branch had already landed. The work was recovered from refs/pull/863/head. Now a task is done only when its pull request is merged *and* the merge commit is an ancestor of trunk, and only that check closes the issue.

## A laptop is not a server

Tasks runs on a Mac, and Macs sleep.

In #929, a build went out at 03:44 UTC. The lid opened at 12:34, and the build was declared timed out against its 3,600-second budget. It had held the only build lane for nearly nine hours and charged each of three specs a strike for a closed lid. Deadlines now run on two clocks, wall time and awake time. The first fix waived the strike for any sleep over 60 seconds, which meant "a 61-second nap waives the strike for a build that timed out with the lid open," so it got split again.

Under that is the strike rule: a strike is charged for a verdict, and only a verdict. Three strikes reject a task. Infrastructure kept charging them anyway. Agent processes died around 380 seconds in, when the VM's connection dropped mid-response. GitHub had outages. The container runtime stopped. Each became a hold or a retry instead, and agents now resume in the same VM, up to twice, after a dropped connection.

Some lessons were about deploying more than code:

- Supervisor fixes were "inert until `make images`", and for a while every image build failed on a dead redirector, so none had reached a VM.
- `cargo clean` deleted the running system, because "the system's stable home was a build cache."
- Any web page could post to the local API and dispatch builds, until the server learned to refuse it.
- A log line printed the agent's API key on every VM allocation. Fixing the log didn't fix the copies ("Redaction is a claim about future writes"), so keys came out of the VMs entirely. Agents now get scoped, expiring leases redeemed at a broker.

## It built itself

Through August, Tasks was mostly building Tasks. The Builder opened 91 pull requests, and 81 merged. The pipeline's own identity, Tasks Builder, has 254 commits across branches. When a Builder left work uncommitted, a server step committed it anyway, as "Sweep: work the agent left uncommitted."

Self-hosting had a cost that's easy to miss. CLAUDE.md, the file every agent reads, went from 8,823 characters to 190,413 in seven days, the same seven days the pipeline was building its own repository. That's about 48k tokens on every agent turn. Each lesson had become a rule, and every rule was read every time. It was cut back, and a test now fails if the file passes 20,000 characters. The rule that replaced the sprawl: CLAUDE.md holds universal rules, and the code holds its own reasoning.

That reasoning has a house style. Doc comments and commit messages open with the failure that produced the design, so you could rebuild most of this piece from the source. The comment above the deadline code tells you about the lid. The one above the orchestrator's environment notes tells you about the time an orchestrator was told it had a checkout, "spent a turn reaching for `python3`, `Write` and a heredoc, had all three denied, and reported the denials as a tooling failure. It was right; the prompt was lying to it."

## Where it is

The last commit is from August 21. In September, the issues show Tasks pointed at a second repository, a Svelte app, and finding what a second project finds. The worker lane assumed the Tasks checkout, so four survey workers came back with nothing, and one worker dispatch fired twice inside 79 milliseconds. Older problems are still open too, like a build that implemented two of its four specs, exited cleanly and was recorded as succeeded, so merging it would close untouched issues as done. The README opens with a section called "Read this first": the agents run with their permission checks off, the server acts unattended, and the local API has no authentication. It's "software one person wrote to run on his own machine."

The shape that survived is simple to say. Explore side by side, because exploring is cheap and agents are good at it. Decide in one place, because the decisions that matter are the ones that need to see everything else in flight. Build in single file. Check afterwards, because checking first is where the human's attention goes to wait. The parallel part is easy. The serial part is where context builds up, and context, as the plan says, is the product.
