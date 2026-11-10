# Doc snapshot scripts

These read-only scripts gather the facts that keep the project's Claude Doc
current. Scheduled Claude tasks run them and then write the results into the
doc with the Claude Docs connector. The scripts never write to the doc, git,
GitHub or the site.

| Script | Feeds | What it reads |
| --- | --- | --- |
| `repo.mjs` | Codebase tab (generated part), Start here "Where things stand", ticks in Plan and notes | `origin/main` through `git show` and `git ls-tree`, plus issues and PRs through `gh` |
| `live-site.mjs` | Live site tab | https://virtualbookshelf.app with headless Playwright |
| `run.sh` | Both | Copies the scripts from `origin/main` into `~/.cache/vb-doc-snapshot/code` and runs one |

Run a job from the latest `origin/main` code:

```bash
git fetch -q origin && git show origin/main:scripts/doc-snapshot/run.sh | bash -s -- repo
```

```bash
git fetch -q origin && git show origin/main:scripts/doc-snapshot/run.sh | bash -s -- live-site
```

Each run prints `OUT_DIR=` and `COMMIT=`. The output folder holds a JSON file of
facts and a markdown file for the tab. The markdown uses a
`<?claude block asof?>` token for the date chip.

## Live site rules

- Public pages only: no sign-ins and no form submissions.
- Playwright's default headless user agent contains `HeadlessChrome`, which
  `app/api/views/route.ts` treats as a bot. Every request to `/api/views` is
  also aborted, so no view is ever counted.
- If the browser revision pinned by `@playwright/test` isn't installed, the
  script falls back to the newest installed Chromium (or `CHROMIUM_PATH`). It
  never downloads one.
- Notes are counted from the note text, because star ratings share the note
  icon's size class.

## Codebase tab layout

Everything above the "Notes kept by hand" heading is generated and replaced
each day. The sections below that heading are written by people and sessions,
and the cron never touches them.
