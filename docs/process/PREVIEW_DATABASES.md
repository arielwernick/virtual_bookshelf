# Preview databases

Every Vercel preview uses the shared Neon `dev` branch, except pull requests
marked as database changes, which get their own Neon branch. Neon allows ten
branches, so per-preview branches are kept for the changes that need them.

## For a pull request

- **Most pull requests:** nothing to do. The preview reads and writes `dev`,
  the same schema-only branch local development uses.
- **Migrations or schema changes:** tick **Database change** in the pull
  request description. `.github/workflows/preview-db.yml` then:
  1. creates the Neon branch `preview/pr-<number>` from `dev`,
  2. sets `BOOKSHELF_DATABASE_URL` and `BOOKSHELF_DATABASE_URL_UNPOOLED` as
     Vercel Preview variables scoped to the pull request's git branch,
  3. redeploys the preview, whose build applies the migrations to that branch
     (`scripts/preview-migrate.ts`).
- A pull request that changes `migrations/` or `lib/db/schema.sql` without the
  box ticked fails the `require-checkbox` check, so a migration never runs on
  the shared `dev` branch from a preview.
- **When the pull request closes,** its Neon branch and Vercel variables are
  deleted. **When a database change merges,** its migrations are applied to
  `dev` so other previews running the new code find the new columns.
  Production migrations are still run by a person before deploy.

## Safety

A preview without `BOOKSHELF_DATABASE_URL`, or with one that points at the
production database, fails rather than falling back to `DATABASE_URL`, which
is production on Vercel's Preview environment (`lib/db/client.ts`).

## One-time setup (owner)

1. **Vercel → Integrations → Neon:** turn off automatic database branches for
   preview deployments.
2. **Vercel → Settings → Environment Variables, Preview:** set
   `BOOKSHELF_DATABASE_URL` to the `dev` branch's **pooled** connection
   string. Remove any Preview-wide `BOOKSHELF_DATABASE_URL_UNPOOLED`: only an
   isolated branch should have it, because it is what makes a preview build
   run migrations.
3. **GitHub → Settings → Secrets and variables → Actions:**
   - Secrets: `NEON_API_KEY`, `VERCEL_TOKEN`, `DEV_DATABASE_URL_UNPOOLED`
     (the `dev` branch's direct connection string).
   - Variables: `NEON_PROJECT_ID`, `VERCEL_PROJECT_ID`, and `VERCEL_TEAM_ID`
     if the project belongs to a team. Optional: `NEON_PREVIEW_PARENT`
     (default `dev`), `NEON_DATABASE` (default `neondb`), `NEON_ROLE`
     (default `neondb_owner`).
4. **Neon:** delete the old per-preview branches the integration created.
