# Agent safety

Most work on this repository is done by AI coding agents. This page lists what
an agent must never do, and what stops it. Each risk has at least one layer
that does not depend on the agent choosing to behave.

| Risk | Rule | What enforces it | Proof |
| --- | --- | --- | --- |
| Changing production data | Migrations, seeds, backfills and e2e seeding refuse the production database unless a person sets an override | `lib/db/prodGuard.ts`, called by `scripts/migrate.ts`, the seed scripts, `scripts/backfill-item-identity.ts` and e2e setup | `lib/db/prodGuard.test.ts` |
| Setting the override | Agents do not set `MIGRATE_ALLOW_PROD`, `SEED_ALLOW_PROD` or `E2E_ALLOW_PROD` | Deny rules in `.claude/settings.json`; `CLAUDE.md` | Second layer only: the settings file is a convenience, the guard above is the control |
| Reading secrets | Agents do not read `.env` files | Deny rules in `.claude/settings.json`. `.env.local` points at the schema-only Neon `dev` branch, never production | `npm run setup` links `.env.local` without printing it |
| Rewriting history | No force pushes; `main` only changes through a pull request | Deny rules in `.claude/settings.json`. Branch protection on `main` is a repository setting only the owner can turn on | See "Not enforced yet" |
| Sending things to people | Agents draft replies and emails; a person sends them | Settled decision (Nov 4, 2026). No agent has send credentials | Applies to the planned SEO and PM agents |
| Leaking who owns a shelf | Usernames and internal ids never appear on public surfaces | Field allowlists in `lib/shelf/publicShelf.ts`; `lib/utils/schemaMarkup.ts` | `lib/shelf/publicShelf.test.ts`, `lib/utils/schemaMarkup.test.ts` |
| Exposing private shelves | Machine-readable views answer 404 unless the shelf is public | One check, `loadPublicShelf` in `lib/shelf/loadPublicShelf.ts` | `lib/shelf/loadPublicShelf.test.ts` |
| Shipping unverified work | Done means `npm run verify` is green and its output is in the PR | CI runs the same command; `.github/pull_request_template.md` asks for the output | `.github/workflows/test.yml` |

## Not enforced yet

These depend on a setting or account only the repository owner controls.

- **Branch protection on `main`** with required checks. Until it is on, nothing technical stops a direct push.
- **Signed-in end-to-end tests in CI** (issues #147 and #275). Until then an agent cannot prove a signed-in flow works without a person checking the preview.
- **Error monitoring in production** (Sentry). Until then agents fix what they are told about, not what users hit.

## If you are an agent and something here blocks you

Stop and say so. Do not look for another way to do the blocked thing. A rule
on this page being in your way is a reason to ask a person, never a reason to
work around it.
