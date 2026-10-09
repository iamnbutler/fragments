# Agent guidance

## Development

This is Nate's Astro site, _fragments, served by a Cloudflare Worker with
media in R2. Use npm: `npm ci` to install dependencies, `npm run dev` to
develop, and `npm test`, `npm run check` and `npm run test:build` to validate
application changes. Documentation-only edits do not need an application build.

- Keep media out of the repo. Images, video and fonts go to R2 with
  `npm run media -- put <file> <name>`, which updates `src/media.json`; refer
  to them in code with `media(name)`. See the README.
- Pushes to `main` deploy to Cloudflare. Land changes through a pull request
  that passes checks.
- Touch only this site's Cloudflare resources: the `fragments` Worker and the
  `fragments-media` bucket.

## Lanes

Use `lane` for isolated work. Follow the
[lane skill in Spade](../spade/.agents/skills/lane/SKILL.md); resolve that path
from this repository's primary checkout, not from a lane worktree.

- Inspect `git status` and `lane ls --json` before starting. Reuse the current
  task's lane when appropriate; otherwise run `lane new <task-name>` and work
  in the directory it prints. Initialize with `lane init` if needed.
- Only pass `--dirty` when deliberately carrying the parent checkout's
  uncommitted work into the new lane. Preserve unrelated changes.
- Run `lane why <path>` before editing each file. Record significant,
  non-obvious constraints with `lane note add <path> -a <anchor> "..."`.
  Do not hand-edit `.lane/` or fill it with summaries of changes.
- Run `lane check` before landing; confirm, replace, or retire stale notes.
- Commit tracked changes before `lane merge`. It lands on local trunk and
  removes the lane; publishing is a separate step. After a lane is merged
  remotely, use `lane prune` to clean it up.
- Do not assume `lane push` targets Nexthub or creates a native Nexthub Change.
  Verify its destination and review behavior first. When publishing to Nexthub,
  use the explicit publication workflow below if that is not established.

## Publishing

GitHub (github.com/iamnbutler/fragments) is the default destination for code
and review. Use GitHub pull requests by default. Use Nexthub when explicitly
requested.

### Publish to Nexthub when requested

Check `git remote -v` and the selected remote's push URL before publishing.
For this ordinary Git repository, use a named Nexthub remote:

```sh
# One-time setup, only if this remote is absent:
git remote add nexthub https://nexthub.sh/iamnbutler/fragments

# Verify the destination and inspect its current state before pushing:
git remote get-url --push nexthub
git fetch nexthub
git push -u nexthub HEAD
```

Inspect destination commits and resolve any divergence before retrying a
rejected push. Prefer the explicit remote even after an upstream is set.
When publishing to Nexthub, use Nexthub Changes for review. Do not run an import
merely to publish new commits.

### The `nh` CLI

- Start with `nh --help` and the docs below. Do not assume subcommand `--help`
  is safe: the installed CLI can execute `nh push --help` as a push and treat
  `nh init --help` as a directory to initialize.
- `nh push` publishes through `origin`; it does not select Nexthub by name.
  Use it only after verifying that both the fetch and push URLs for `origin`
  point to the intended Nexthub repository. `NEXTHUB_URL` is not a substitute
  for checking the Git remote.
- Ordinary repositories need no Sources. For a Project with Sources, use
  `nh add <path>`, `nh commit -m "..."`, and `nh push` to retain Source histories
  and publish the complete root Revision. Do not bypass that with a root-only
  Git push. Use `nh status` to inspect Source changes.
- `NEXTHUB_TOKEN` authenticates CLI API calls; Git uses its configured
  credential helper and a Nexthub access token. Keep tokens out of repository
  files, remote URLs, and command output.

References:

- [Nexthub docs](https://github.com/githubnext/nexthub/tree/main/docs)
- [Use Git with Nexthub](https://github.com/githubnext/nexthub/blob/main/docs/public/access-tokens.md)
- [nh CLI](https://github.com/githubnext/nexthub/blob/main/packages/cli/readme.md)
- [Project Sources](https://github.com/githubnext/nexthub/blob/main/docs/projects.md)
- [Import from GitHub](https://github.com/githubnext/nexthub/blob/main/docs/public/importing.md)

## Standing preferences

- Schedule recurring GitHub Actions outside 22:00–02:00 UTC at an off-hour
  minute, such as 08:17 UTC. This does not restrict actual execution times;
  do not add runtime time-window guards or defer manual runs.
- Real OpenAI and Anthropic API tokens are authorized for requested work,
  development, smoke tests, and evaluations. Keep validation proportional;
  do not ask for spending approval unless Nate sets a new constraint.
