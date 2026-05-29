# Database Migrations

This project uses a lightweight, **idempotent**, scriptable migration runner
built on the Neon serverless driver. It replaces the old workflow of hand-pasting
SQL files into the Neon SQL editor.

## TL;DR

```bash
npm run migrate:status   # show applied / pending migrations
npm run migrate:up       # apply all pending migrations (idempotent, safe to re-run)
npm run migrate:down     # roll back the most recently applied migration
npm run db:bootstrap     # bring an empty DB to current schema (alias for migrate:up)
```

All commands read `DATABASE_URL` from the environment (loaded from `.env.local`
via `dotenv`). For CI / ephemeral databases, set `DATABASE_URL` inline:

```bash
DATABASE_URL="postgres://...test-db..." npm run db:bootstrap
```

## How it works

- Migration files live in `migrations/` and are named `NNN_description.sql`
  (e.g. `001_initial_schema.sql`). They are applied in ascending numeric order
  of their prefix.
- Applied migrations are tracked in a `schema_migrations` table (created
  automatically on first run). Each `migrate:up` only runs files not yet
  recorded there.
- Each migration runs inside a single transaction. If it throws, the
  transaction is rolled back and the migration is **not** recorded — so a failed
  migration can be fixed and re-run cleanly.
- The runner lives in [`lib/db/migrate.ts`](../../lib/db/migrate.ts); the CLI
  wrapper is [`scripts/migrate.ts`](../../scripts/migrate.ts).

### Idempotency

The system is idempotent at two levels:

1. **Runner level** — already-applied versions are skipped, so re-running
   `migrate:up` against an up-to-date database is a no-op (not an error).
2. **DDL level** — migration SQL uses `CREATE TABLE IF NOT EXISTS`, guarded
   `ALTER`/`ADD CONSTRAINT` (`DO $$ ... $$` blocks), `CREATE OR REPLACE
   FUNCTION`, and `DROP TRIGGER IF EXISTS` + `CREATE TRIGGER`. This means the
   baseline migration can be applied to an already-populated production database
   as a safe no-op, which is how existing databases adopt the system.

This makes the runner suitable for CI and agent-driven provisioning of
ephemeral test databases (see issue #147): a single `npm run db:bootstrap` takes
an empty database to the current schema with no manual steps.

## Creating a new migration

1. Create `migrations/NNN_short_description.sql` with the next number in
   sequence. Write idempotent DDL (guard everything with `IF [NOT] EXISTS` or a
   `DO` block) so the file is safe to re-run.
2. (Optional) Create `migrations/NNN_short_description.down.sql` with the
   inverse operations to support `migrate:down`. Omit it for irreversible
   migrations; `migrate:down` will refuse to roll back a migration that has no
   down file.
3. Run `npm run migrate:status` then `npm run migrate:up`.

### Why a custom runner

The codebase uses raw SQL via the Neon serverless driver (no ORM). A full ORM
(Drizzle/Prisma) was out of scope — it would require rewriting `lib/db/queries.ts`.
`node-pg-migrate` is built around the `pg` driver, which would introduce a second
database client; this runner instead reuses the Neon driver's `Pool` (over
WebSockets) already in the project. The required surface is small, so a custom
runner is the cleanest fit and directly serves the CI/ephemeral-DB use case.

## Legacy SQL files (historical reference)

The files in `lib/db/` (`schema.sql`, `MIGRATION_001..006_*.sql`) predate this
system. Their contents are consolidated into `migrations/001_initial_schema.sql`.
They are retained for historical reference only and should not be run manually
anymore — use `npm run migrate:up`.
