# 0004. Retire the `next` branch; one pull request per issue into `main`

Date: Nov 22, 2026. Status: accepted. Replaces [0001](0001-integration-branch.md).

## Context

The `next` branch (0001) gathered the November audit work as one commit per
ticket. It was merged into `main` in pull request #297, and nothing is left on
it.

## Decision

Stop using `next`. Each issue gets its own branch cut from `main` and its own
pull request into `main`, as `CLAUDE.md` ("Definition of done") describes. The
risk tiers in `docs/process/RISK_TIERS.md` decide who merges.

## Considered

- **Keep `next` for medium and high risk work.** Its promotion steps were
  fiddly (commits did not cherry-pick on their own), and one reviewer is
  easier served by small pull requests with previews.

## Consequences

- Every pull request gets a Vercel preview. To stay under Neon's ten
  branches, previews share the `dev` branch and only pull requests marked as
  database changes get their own (`docs/process/PREVIEW_DATABASES.md`).
- `docs/process/HANDOFF.md` is kept as a record of the `next` work, not as
  instructions.
