# Handoff: continuing the `next` branch

Written Nov 11, 2026, for any agent picking this work up. Read this whole
file before changing anything. It tells you what is done, what to do next in
order, exactly how to land work, and what you must not do.

If something here conflicts with `CLAUDE.md`, `CLAUDE.md` wins. If something
is unclear, stop and ask the owner (Ariel). Do not guess.

## 1. Where things stand

- All work is on the branch `next`. `main` is untouched and deploys to
  production. **Never commit to or push `main`.**
- `next` holds one commit per ticket on top of `main`. To list them:
  `git fetch origin && git log --oneline origin/main..origin/next`
- The full audit and reasoning are in the private doc "Virtual Bookshelf —
  Next Level Audit and Plan". You do not need it to do the tasks below.
- `ROADMAP.md` has the product order. This file has the task-level detail.

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
12. **Delete any temporary page or script before committing.** Run
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
- After pushing, tick the task in section 5 of this file in a small
  follow-up commit (`docs: tick <task> in the handoff`), or include the tick
  in the ticket's own commit.

## 4. Things only the owner can do (do not attempt)

These are waiting on Ariel. Remind him; do not work around them.

- [ ] Promote commit `80b460b` (#283) from `next` to `main`. It is urgent.
- [ ] Look at the Vercel preview of `next` and check these by hand, signed in:
      drag-and-drop reorder (#296), the dashboard view line (#68), the notes
      section on a public shelf (#293), adding several items in a row and
      publishing from the edit page (#292).
- [ ] Run `npm run migrate:up` then
      `npx tsx scripts/backfill-item-identity.ts` (dry run) on the Neon `dev`
      branch for #288. Migration 007 must reach production **before** the code
      that needs it.
- [ ] Privacy and Terms pages.
- [ ] Resend, Sentry and Search Console accounts.
- [ ] Repository settings: branch protection on `main`, auto-merge, the
      `risk:*` and `blocked:owner` labels.
- [ ] The decisions listed under "What to decide" in the audit doc.

## 5. Task queue, in order

Do them top to bottom. Each task says what "done" means. If a task is harder
than it looks, stop, write what you found under the task, and move to the
next one. A half-finished task must not be merged into `next`.

### Task 1. Fix the stale README (docs only, low risk)

- [ ] Not started.

**Why:** the README states old versions, links to doc paths that do not
exist, and its environment variable list disagrees with `CLAUDE.md`.

**Steps:**
1. Read `README.md` and `CLAUDE.md`.
2. Fix every factual error: framework versions (read them from
   `package.json`), commands (`npm run setup`, `npm run verify`), the
   required environment variables (copy the list from `CLAUDE.md`), and every
   link (check each linked file exists with `ls`).
3. Add a short "For AI agents" line pointing to `CLAUDE.md` and this file.
4. Do **not** rewrite the product description or add marketing claims.

**Done when:** every path and command in the README exists and works.
No ticket exists; use `Part of #290`.

### Task 2. Project skills for recurring jobs (low risk)

- [ ] Not started.

**Why:** agents repeat three jobs and get details wrong each time.

**Steps:** create three files. Each is a Markdown file with YAML front matter
containing `name` and `description`, then numbered steps.

- `.claude/skills/add-migration/SKILL.md`: how to add
  `migrations/NNN_name.sql` and `NNN_name.down.sql` (read
  `migrations/007_item_identity.sql` and `lib/db/migrate.ts` first); the file
  must be idempotent (`IF NOT EXISTS`); never run it; say in the commit that
  `migrate:up` must run before deploy.
- `.claude/skills/add-item-type/SKILL.md`: list every file that mentions an
  item type. Find them with
  `grep -rln "podcast_episode" --include=*.ts --include=*.tsx . | grep -v node_modules`.
- `.claude/skills/add-api-route/SKILL.md`: the route pattern from `CLAUDE.md`
  ("API Route Pattern"), with `app/api/account/export/route.ts` and its test
  as the example to copy.

**Done when:** the three files exist and every file path they mention exists.
Use `Part of #290`.

### Task 3. Tests for untested routes (issue #81, low risk)

- [ ] Not started.

**Why:** these routes have no tests: `app/api/oauth/register`,
`app/api/oauth/authorize`, `app/api/import/create`, `app/api/import/parse`,
`app/api/items/from-url`.

**Steps:** one test file per route, next to the route, named `route.test.ts`.
Copy the structure of `app/api/items/reorder/route.test.ts`: mock
`@/lib/utils/session` and `@/lib/db/queries` (and `@/lib/db/client` where the
route uses `sql` directly), then test: signed out returns 401; someone else's
shelf returns 403; bad input returns 400; the happy path returns 200 and calls
the query with the expected arguments. For `import/create` and `from-url`,
also test that a `javascript:` URL is rejected or stored as null.

**Do not** change the routes. If a test shows a real bug, stop and write it
under this task; do not fix it in the same commit.

**Done when:** each listed route has at least four tests and verify passes.
Do one route per commit if that is easier. Use `Part of #81`.

### Task 4. Mock mode for outside APIs (issue #275, medium risk)

- [ ] Not started.

**Why:** end-to-end tests cannot add an item, because adding calls Google
Books, Spotify, YouTube or Microlink. This is the largest gap in what agents
can verify on their own.

**Steps:**
1. Read issue #275 and the four clients in `lib/api/` (`googleBooks.ts`,
   `spotify.ts`, `youtube.ts`, `microlink.ts`).
2. Add `lib/api/mockMode.ts` exporting `isMockMode()`, true only when
   `process.env.EXTERNAL_APIS === 'mock'` **and**
   `process.env.VERCEL_ENV !== 'production'`.
3. In each client's exported search or lookup function, return a small fixed
   fixture at the top when `isMockMode()` is true. Put fixtures in
   `test/fixtures/external/<client>.ts`. Two results per client is enough.
4. Test each client: with mock mode on, `fetch` is never called and the
   fixture is returned; with it off, behaviour is unchanged. Test that mock
   mode is off when `VERCEL_ENV` is `production` even if the variable is set.
5. Document the variable in `CLAUDE.md` under "Agent testing".

**Do not** write the end-to-end tests themselves; they need a database (#147).

**Done when:** verify passes and mock mode cannot turn on in production.

### Task 5. Stable image sizes on shelf cards (low to medium risk, visible)

- [ ] Not started.

**Why:** cover images have no width or height, and every one loads lazily, so
the page can shift as they load.

**Steps:** in `components/shelf/ItemCardImage.tsx`, the image already sits in
a box with a fixed aspect ratio (see `ItemCardStatic.tsx`). Add
`decoding="async"`, and accept a `priority` prop: when true use
`loading="eager"` and `fetchPriority="high"`, otherwise `loading="lazy"`. In
`ShelfRowsResponsive.tsx`, pass `priority` for the first four items only.
Update the component tests.

**Do not** switch to `next/image`; that needs the host allowlist in #95.

**Done when:** verify passes. Say in the commit that it changes image loading
and should be looked at on the preview.

### Task 6. Content Security Policy in report-only mode (issue #82, medium risk)

- [ ] Not started.

**Why:** the site sends no Content Security Policy.

**Steps:** in `next.config.ts`, add a `Content-Security-Policy-Report-Only`
header (not the enforcing header) to the non-embed routes. Start from:
`default-src 'self'; img-src 'self' https: data:; script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; connect-src 'self' https:; frame-src https://www.youtube.com https://open.spotify.com; frame-ancestors 'none'`.
Add a test that reads the config and checks the header is present on `/` and
absent on `/embed/x`.

**Do not** send the enforcing `Content-Security-Policy` header. Report-only
cannot break the site; enforcing can.

**Done when:** verify passes and `npm run build` succeeds with
`DATABASE_URL=postgresql://test:test@localhost:5432/test SESSION_SECRET=test-secret-for-build`.

### Task 7. `apiError()` helper (issue #87, low risk)

- [ ] Not started.

Read the issue. Add the helper and its tests, and migrate **only** the routes
under `app/api/shelf/`. Leave every other route alone. Response bodies must
stay byte-for-byte the same for existing callers.

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
