# Risk tiers

Every issue and pull request gets one tier. The tier decides how much of a
person's attention the change needs. The aim is to stop treating a typo fix
and an auth change the same way.

| Tier | What it covers | Who may merge | What review means |
| --- | --- | --- | --- |
| **Low** | Docs, tests, copy in `content/`, comments, green minor and patch dependency updates, config with no runtime effect | An agent, once required checks pass | None beyond the checks |
| **Medium** | New routes or components, UI changes, additive migrations, anything a visitor can see | The owner | Look at the preview and answer the one question in the PR's "What I need from the reviewer" |
| **High** | Sign-in and sessions, `migrations/` that change or drop data, `lib/db/prodGuard.ts`, environment variables, privacy (anything that could show who owns a shelf or expose a private one), outbound email, anything in `.github/workflows/` that deploys | The owner, after reading the diff | Read the code, not just the summary |

## Rules

1. **When unsure, pick the higher tier.**
2. **A PR is as risky as its riskiest file.**
3. **An agent never lowers a tier** that a person set.
4. **No more than three agent PRs waiting on a person at once,** and no stack deeper than two. More than that and the queue outgrows review.
5. **A PR untouched for 7 days** is rebased and raised again. At 21 days it is closed with a note; the issue stays open.
6. **Do not start an issue whose dependency is waiting on a person.** Building on a blocked foundation produces PRs that go stale.

## Labels

`risk:low`, `risk:medium`, `risk:high`, and `blocked:owner` for anything
waiting on a decision, an account or credentials.

## Not turned on yet

Low-tier auto-merge needs two repository settings that only the owner can
change: "Allow auto-merge", and branch protection on `main` with the test,
lint, build and preview smoke checks required. Until then every merge is a
click by the owner, and this table tells them how hard to look.
