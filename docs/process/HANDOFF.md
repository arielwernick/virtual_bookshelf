# Handoff: continuing the `next` branch

Written Nov 11, 2026, for any agent picking this work up. Read this whole
file before changing anything. It tells you what is done, what to do next in
order, exactly how to land work, and what you must not do.

If something here conflicts with `CLAUDE.md`, `CLAUDE.md` wins. If something
is unclear, stop and ask the owner (Ariel). Do not guess.

## 1. Where things stand

- All work is on the branch `next`. `main` is untouched and deploys to
  production. **Never commit to or push `main`.**
- `next` is open as **pull request #297** into `main`. Every push to `next`
  updates that pull request and re-runs its checks. Its description holds the
  owner's activation checklist. Do not merge it; the owner does.
- `next` holds one commit per ticket on top of `main`. To list them:
  `git fetch origin && git log --oneline origin/main..origin/next`
- The full audit and reasoning are in the private doc "Virtual Bookshelf —
  Next Level Audit and Plan". You do not need it to do the tasks below.
- `ROADMAP.md` has the product order. This file has the task-level detail.
- **The branch is large. Prefer making what is there safer over adding
  features.** Tests, small fixes and documentation are welcome. A new feature
  is not, unless the owner asks for it.

## 2. The rules (do not skip)

1. **Start every session with** `git fetch origin && git checkout next && git pull origin next && npm ci`.
2. **One ticket = one local branch = one commit.** Branch name
   `agent/<issue>-<slug>`, cut from `next`.
3. **Never push a ticket branch.** Every pushed branch takes a preview
   database, and there are only ten. Only `next` is pushed.
4. **Never force push. Never rewrite history on `next`.** If you made a
   mistake, add a new commit that fixes it.
5. **Definition of done:** `npm run verify` exits 0. Check the exit code,
   not just the output:
   `rm -rf .next/dev; npm run verify; echo "exit=$?"`
   (`rm -rf .next/dev` matters: a stale dev build makes the typecheck fail.)
6. **Write tests for everything you add.** Follow the test pattern in
   `CLAUDE.md` ("Testing Patterns"). Copy the style of a nearby test file.
7. **Do not run migrations, seeds or anything against a database.** There is
   no database in an agent session. Never set `MIGRATE_ALLOW_PROD`,
   `SEED_ALLOW_PROD` or `E2E_ALLOW_PROD`. Never read `.env` files.
8. **Do not describe security problems in public GitHub issues or commit
   messages.** The repository is public. Use neutral wording ("only web URLs
   are stored"), never "vulnerability", "exploit" or "attack".
9. **Do not change product copy, positioning or visible design** unless the
   task says so. If a task changes what a visitor sees, say so in the commit
   body so the owner checks the preview.
10. **Settled decisions are not yours to reopen:** coffee table not a
    portfolio; homepage has no SEO or comparison content; shelves start
    private; usernames and internal ids never appear on public pages; agents
    draft and never send.
11. **If `npm run dev` runs, Next.js rewrites a block at the bottom of
    `AGENTS.md`.** That block is already committed. If `git status` shows
    `AGENTS.md` changed and you did not edit it, run `git checkout AGENTS.md`.
12. **After every push, check the pull request's checks.** Wait a few
    minutes, then run:
    `gh api repos/arielwernick/virtual_bookshelf/commits/$(git rev-parse HEAD)/check-runs --jq '.check_runs[] | "\(.name): \(.status) \(.conclusion)"'`
    `test`, `lint`, `build` and `smoke` must end in `success`. `smoke` runs the
    Playwright tests in `e2e/smoke.spec.ts` against the live preview, which has
    a real database. `CodeQL` shows one known failure (see section 4); a
    second one is new and yours to fix. If you broke a check, fix it in a new
    commit before doing anything else.
13. **SQL must run on a real engine before it lands.** If you add or change a
    query in `lib/db/queries.ts` or a file in `migrations/`, add a case to
    `lib/db/queries.integration.test.ts`. It runs on PGlite, a real Postgres
    inside the test process. A mocked test alone is not enough for SQL.
14. **Delete any temporary page or script before committing.** Run
    `git status --short` and read every line before you commit.

## 3. How to land one ticket (copy these commands)

```bash
git checkout next && git pull origin next
git checkout -b agent/<issue>-<slug>

# ...make the change, add tests...

rm -rf .next/dev; npm run verify; echo "exit=$?"     # must print exit=0
git status --short                                    # read every line

git add -A
git commit -m "<type>: <summary> (#<issue>)" \
  -m "<What changed, in two or three plain sentences. What was NOT checked.>

Closes #<issue>
Risk: low|medium|high"

git checkout next
git merge --ff-only agent/<issue>-<slug>
git push origin next
```

- `<type>` is `feat`, `fix`, `chore`, `docs`, `test` or `ci`.
- Use `Part of #<issue>` instead of `Closes` when the ticket is not finished.
- If `git merge --ff-only` fails, someone else pushed. Run
  `git checkout agent/<issue>-<slug> && git rebase next`, re-run verify, and
  try again.
- After pushing, tick the task in section 5 of this file in its **own**
  small commit (`docs: tick <task> in the handoff`). Do not put the tick in
  the ticket's commit: it ties every ticket to this file and makes them
  harder to promote separately.

## 4. Things only the owner can do (do not attempt)

These are waiting on Ariel. Remind him; do not work around them.

- [ ] Promote commit `80b460b` (#283) from `next` to `main`. It is urgent.
- [ ] Look at the Vercel preview of `next` and check these by hand, signed in:
      drag-and-drop reorder (#296), the dashboard view line (#68), the notes
      section on a public shelf (#293), adding several items in a row and
      publishing from the edit page (#292).
- [ ] Run `npm run migrate:up` then
      `npx tsx scripts/backfill-item-identity.ts` (dry run first, then
      `--apply`) on the Neon `dev` branch, and later on production, for #288.
      Order no longer matters: items save even before migration 007 runs,
      and the backfill fills in identifiers afterwards.
- [ ] Decide the one CodeQL alert on pull request #297 ("Server-side request
      forgery" at `lib/utils/safeFetch.ts`). It points at the guarded fetch
      this branch added. Agents: do not try to silence it.
- [ ] Privacy and Terms pages.
- [ ] Resend, Sentry and Search Console accounts.
- [ ] Repository settings: branch protection on `main`, auto-merge, the
      `risk:*` and `blocked:owner` labels.
- [ ] The decisions listed under "What to decide" in the audit doc.

## 5. Task queue, in order

Do them top to bottom. Each task says what "done" means. If a task is harder
than it looks, stop, write what you found under the task, and move to the
next one. A half-finished task must not be merged into `next`.

### Task 1. Fix the stale README

- [x] Done on `next`. Versions, commands, environment variables, links and
  the API list now match the code. The product description was left alone.

### Task 2. Project skills for recurring jobs

- [x] Done on `next`. Three skills in `.claude/skills/`: `add-migration`,
  `add-item-type` and `add-api-route`. **Read the matching skill before doing
  one of those jobs.**

### Task 3. Tests for untested routes (issue #81)

- [x] Done on `next` for the five routes that were listed: `items/from-url`,
  `import/create`, `import/parse`, `oauth/register`, `oauth/authorize`. Issue
  #81 also names the connector route (`app/api/mcp`) and a revalidate route;
  those are not done. The connector route needs care to mock; leave it unless
  the owner asks.

### Task 4. Mock mode for outside APIs (issue #275)

- [x] Done on `next`. Set `EXTERNAL_APIS=mock` and the four clients return
  fixed results with no network request. See `lib/api/mockMode.ts`,
  `lib/api/mockFixtures.ts` and `lib/api/mockMode.test.ts`. It cannot turn on
  in production. The end-to-end tests that would use it still need a database
  (#147, blocked).

### Task 5. Faster first covers on shelf pages

- [x] Done on `next`. The first six covers on a shelf page load at once and
  ahead of other images; the rest stay lazy. See `ItemCardImage.tsx` and
  `ShelfRowsResponsive.tsx`. Moving to `next/image` still waits on the host
  allowlist in #95.

### Task 6. Content Security Policy in report-only mode (issue #82)

- [x] Done on `next`, in report-only mode. The policy is in
  `lib/security/csp.ts`. **Do not** switch it to the enforcing
  `Content-Security-Policy` header: that is the owner's call, after the
  preview has been used with a clean browser console.

### Task 7. `apiError()` helper (issue #87)

- [ ] **Blocked: do not start.** The issue asks for a new error format that
  it describes as breaking for consumers, and an earlier attempt (pull
  request #113) was closed. The owner must choose first: keep `error` as a
  string and add a `code` beside it (safe), or change `error` into an object
  (breaks every page that reads it).

### Task 8. More database-backed tests (low risk)

- [ ] Partly done. Covered on `next`: `deleteShelf`, `deleteItem`,
  `getNextOrderIndex`, `recordShelfView`, `getPublicVideoByVideoId` and the
  OAuth client, code and token functions. These tests found a real bug
  (deleting a shelf left its items behind), fixed in commit `f9b87e0`.

**Still to do:** `getUserByEmail`, `getUserByUsername`, `getUserByGoogleId`,
`updateShelf`, `getShelvesWithItems`, `getPublicVideoItems`, `touchUserLastSeen`
and the admin queries (`getAdminOverview`, `getAdminWeeklySignups`,
`getAdminAttribution`, `getAdminRecentUsers`, `getAdminViewStats`,
`getAdminTopShelves`, `getAdminEmbedHosts`).

**Steps:**
1. Read `test/utils/pgliteClient.ts` and `lib/db/queries.integration.test.ts`.
2. Add `describe` blocks to the same file, a few functions per commit. Use the
   helpers already there (`createTestUser`, `createTestShelf`, `book`).
3. For the admin queries, check counts against data you created, and that
   private shelves are not counted where they should not be.

**Do not** change `lib/db/queries.ts` in the same commit. If a test shows a
real bug, commit the failing test as `it.fails(...)` with a comment, write
what you found under this task, and tell the owner. A fix goes in its own
commit.

**Done when:** each listed function has at least two tests and verify passes.
Use `Part of #147`.

### Task 9. Do not send the owner's id to visitors of a public shelf page

- [x] Done on `next`. `GET /api/shelf/[shelfId]` returns `is_owner` and
  leaves the owner's id out for visitors. See its `route.test.ts`.

### Task 10. Accessibility checks in the smoke tests (issue #84, low risk)

- [ ] Not started.

Read the issue. Add `@axe-core/playwright` as a dev dependency and one test
in `e2e/smoke.spec.ts` that runs it on `/`, `/login` and `/signup` and fails
only on violations of impact `critical`. Do **not** fix the violations in the
same commit: list what it finds under this task. If it finds any, mark the
test `test.fixme` with a comment, so the smoke check stays green, and tell
the owner.

## 6. Tasks that are blocked. Do not start them

| Task | Blocked on |
| --- | --- |
| Per-work pages (#294) | Visibility levels (#263) and the #288 backfill being run |
| Paste a list before signing up (#295) | A decision on signed-out lookups; Privacy and Terms |
| Daily budget for `/api/import/metadata` | The same decision as #295 |
| Dated snapshot shelves ("time capsules") | A product decision: a label, or a frozen copy? |
| Replace the `LIKE` scan in `getPublicVideoByVideoId` with `source_id` | The #288 backfill being run on production |
| Sign-in changes of any kind | The Better Auth migration (PRs #270, #271). Do not touch the old sign-in code |
| End-to-end tests in CI (#147) | A database for CI |
| Removing the Bento and Linktree questions from the homepage FAQ | The owner's decision |
| Archiving old files in `docs/` | The owner wants them kept: they are material for the founder blog |

## 7. When you finish a session

1. `git status` is clean and `git log origin/next..next` prints nothing.
2. This file's checkboxes match reality.
3. Tell the owner, in plain words: which tasks landed (with commit ids), what
   you did not check, and anything you found that he needs to decide.
