# The `next` branch

`next` is where agents land ticketed work that the owner has not reviewed yet.
`main` deploys to production on every push; `next` does not. The owner picks
what to promote.

## How work lands on `next`

- One ticket, one branch, one commit. Branches are named `agent/<issue>-<slug>`
  and are cut from `next`.
- The commit subject is `type: summary (#issue)`. The body says what changed,
  ends with `Closes #issue` and `Risk: low|medium|high`, and names any
  rollout step.
- History on `next` is linear: each ticket branch is fast-forwarded in. One
  commit per ticket is what makes picking and choosing possible.
- `npm run verify` is green before every commit.

## How to see what is waiting

```bash
git fetch origin
git cherry -v origin/main origin/next    # "+" lines are not on main yet
```

## How to promote

Tested on Nov 11, 2026: most commits on `next` do **not** cherry-pick cleanly
onto `main` on their own, and some that do would not compile, because later
commits build on earlier ones (several touch the shelf page, the queries file
and the handoff file). So pick by position, not by plucking.

**Take everything.** Open a pull request from `next` into `main`.

**Take the first few.** `next` is a straight line, so any commit and
everything before it is a working state:

```bash
git fetch origin
git log --oneline --reverse origin/main..origin/next   # the order
git checkout -b promote/2026-11-12 <last commit you want>
npm ci && npm run verify
git push -u origin promote/2026-11-12                  # then open a PR into main
```

**Take everything except one ticket.** Revert that ticket on a promote
branch, then open the pull request:

```bash
git checkout -b promote/2026-11-12 origin/next
git revert --no-edit <commit to leave out>             # fix conflicts if a later commit built on it
npm run verify
git push -u origin promote/2026-11-12
```

**One commit that does stand alone:** the first one on the branch,
`80b460b` (#283). `git cherry-pick -x 80b460b` onto a branch from `main`
works and should be promoted first.

The promote pull request must pass the preview smoke tests itself: "tested
on next" is not "tested on main".

## After promoting

```bash
git checkout next
git rebase origin/main        # git drops commits that are already on main
git push --force-with-lease   # only when no agent branch is in flight
```

This is the one place a force push is expected, and a person does it.

## Pitfalls

- **Order matters.** A commit can depend on an earlier one even when git
  applies it without complaint: the account export (#289) picks cleanly onto
  `main` but imports a file added by #285. Promote by position, as above.
- **Migrations are promoted strictly in number order, never skipped.** Run
  `npm run migrate:up` on production before deploying code that needs the new
  columns.
- **`Closes #N` only fires on `main`.** Issues stay open while work sits on
  `next`, which is correct: it has not shipped.
- **Do not let `next` become a graveyard.** If it holds more than about ten
  unpromoted commits, or anything older than two weeks, stop adding and
  decide.
- **Low-risk work does not need `next`.** Docs, tests and green dependency
  updates can go straight to `main`. Use `next` for work that needs a person
  to look at it.

## Previews

Every pushed branch gets a Vercel preview with its own Neon database branch,
and Neon allows ten. Ticket branches are therefore kept local and only `next`
is pushed.
