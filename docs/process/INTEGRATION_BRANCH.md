# The `next` branch (retired)

From Nov 11 to Nov 16, 2026, agents landed ticketed work on a long-lived
`next` branch and the owner promoted it to `main`
([decision 0001](../decisions/0001-integration-branch.md)). Everything on
`next` was merged into `main` in pull request #297, and the workflow is
finished ([decision 0004](../decisions/0004-retire-integration-branch.md)).
Don't cut branches from `next` or push to it.

## How work lands now

One issue, one branch cut from `main`, one pull request into `main` whose body
says `Closes #N`. `npm run verify` is green and its output is in the PR
(`.github/pull_request_template.md`). The risk tier
(`docs/process/RISK_TIERS.md`) says who merges.

## Previews and Neon branches

Every pushed branch gets a Vercel preview with its own Neon database branch,
and Neon allows ten. When they run out, a new preview fails within seconds,
before the build starts.

- Delete the Neon branch for a pull request once it is merged or closed.
- Don't push a branch you aren't opening a pull request for.
- If a preview fails right away, check the Neon branch count before looking
  at the code.
