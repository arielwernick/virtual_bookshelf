# 0001. Agents land ticketed work on `next`; the owner promotes to `main`

Date: Nov 11, 2026. Status: proposed, in use on the `next` branch.

## Context

`main` deploys to production on every push. One person reviews everything.
Routine PRs were merged within minutes of opening and PRs needing judgement
waited days, so agents could produce work faster than it could be reviewed,
and each waiting PR held a Vercel preview and one of ten Neon branches.

## Decision

A long-lived `next` branch takes one commit per ticket. The owner promotes
all of it, or cherry-picks. See `docs/process/INTEGRATION_BRANCH.md`.

## Considered

- **Trunk only, one PR per ticket into `main`.** Simple, and right for
  low-risk work, but it is what produced the review queue.
- **A fork.** Loses issue links, previews and CI for no gain.
- **Feature flags.** The better tool for shipping unfinished features dark.
  Not available yet; worth adding before `next` is used for anything large.

## Consequences

- Review moves from "many PRs" to "one list of commits", which is easier to
  scan but can hide dependencies between commits. Commit bodies must name
  them.
- `next` can drift. It needs rebasing after each promotion and a cap on how
  much it holds.
