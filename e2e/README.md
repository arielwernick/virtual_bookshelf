# End-to-end & agent UI exploration

This directory uses [Playwright](https://playwright.dev) to drive the real app
in a browser. It serves two purposes:

1. **Smoke tests** (`smoke.spec.ts`) — verify the public surface renders.
2. **Agent UI exploration** — capture what an agent needs to understand the UI
   without a human: screenshots, the ARIA/accessibility tree, and a summary of
   every route's interactive controls. Split into the public crawl
   (`explore.spec.ts`) and the logged-in crawl (`explore-auth.auth.spec.ts`).

## Setup (one time)

```bash
npm install            # installs @playwright/test
npx playwright install chromium
```

A running database is required for the landing/dashboard pages, so make sure
`.env.local` is populated (same vars as `npm run dev`).

## Commands

```bash
npm run e2e            # run all tests headless (auto-starts the dev server)
npm run e2e:headed     # run with a visible browser
npm run e2e:ui         # interactive Playwright UI mode
npm run e2e:explore    # run only the agent UI exploration
npm run e2e:report     # open the last HTML report
```

If a dev server is already running on port 3000 it is reused. Override the
target with `PLAYWRIGHT_BASE_URL` (e.g. against a deployed preview).

## Agent perspective

`npm run e2e:explore` writes to `e2e/artifacts/`:

- `UI-MAP.md` — an index of every route with its purpose, HTTP status, final
  URL (so redirects are visible), title, headings, links, buttons, and form
  field count.
- `<route>.png` — full-page screenshot.
- `<route>.aria.yml` — the ARIA snapshot. This is the structured, role-based
  view of the page (e.g. `heading "Sign in"`, `textbox "Email"`) that an agent
  reasons over rather than raw pixels or HTML.

To explore a new public route, add it to the `ROUTES` array in
`explore.spec.ts`; for a logged-in route, add a case to
`explore-auth.auth.spec.ts`.

## Authenticated exploration

The logged-in surface (populated dashboard, shelf editor, import) is covered by
the `authenticated` Playwright project:

- `auth.setup.ts` runs once as a project dependency. It signs the test user up
  via `/api/auth/signup` (falling back to `/api/auth/login` if they already
  exist), seeds a shelf with a few items, and saves the session cookie to
  `e2e/.auth/user.json` plus seed metadata to `e2e/.auth/seed.json`.
- Authenticated specs (`*.auth.spec.ts`) reuse that cookie via
  `storageState`, so they never click through the login form.

The test account is created in whatever database `DATABASE_URL` points at, so
**point this at a dev/local database, not production.** Override the credentials
(e.g. to reuse a staging account) with `E2E_USERNAME`, `E2E_EMAIL`, and
`E2E_PASSWORD`.

Artifacts, saved auth state, and Playwright's own output are git-ignored — they
are generated, not committed.
