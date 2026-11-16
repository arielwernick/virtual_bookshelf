---
name: add-migration
description: Add a database migration to Virtual Bookshelf. Use when a task needs a new table, column, index or constraint. Covers file naming, idempotency, the down file, and what an agent must not run.
---

# Add a database migration

Migrations are plain SQL files in `migrations/`, run in number order by
`lib/db/migrate.ts`. Each runs once, inside a transaction.

## Steps

1. **Find the next number.** Run `ls migrations/`. Use the highest number
   plus one, zero-padded to three digits. Check open pull requests too: if
   one already adds that number, take the next. (Better Auth holds 006.)
2. **Create two files:**
   - `migrations/NNN_short_name.sql`: the change.
   - `migrations/NNN_short_name.down.sql`: exactly undoes it.
3. **Make the up file idempotent,** so running it twice is harmless. Use
   `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`,
   `CREATE INDEX IF NOT EXISTS`. For a named constraint, wrap it in a
   `DO $$ ... IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = ...) ... $$`
   block. Copy the style of `migrations/007_item_identity.sql` (simple) or
   `migrations/001_initial_schema.sql` (constraints).
4. **Start the file with a comment:** what it adds, why, and the issue number.
5. **Prefer additive changes.** New nullable columns and new tables are safe.
   Dropping or renaming a column, or adding `NOT NULL` to an existing one, is
   high risk: stop and ask the owner first.
6. **Update the types and queries:** `lib/types/shelf.ts` and
   `lib/db/queries.ts`. Add tests in `lib/db/queries.test.ts`.
7. **Prove it on a real engine.** `lib/db/queries.integration.test.ts` applies
   every migration to an in-process Postgres (PGlite) and runs them twice.
   Add a test there for your new columns or table, and one for the down file,
   following the "007" example in that file.
8. **Run `npm run verify`.**

## Do not

- **Do not run the migration.** No `npm run migrate:up`, `migrate:down` or
  `db:bootstrap`. An agent session has no database, and production is
  guarded. The owner runs migrations.
- **Do not set `MIGRATE_ALLOW_PROD`.**
- **Do not edit a migration that is already on `main`.** Add a new one.

## In the commit message

Say that the migration must run before the code deploys, for example:
"Rollout: run `npm run migrate:up` before deploying this, because item
inserts write the new columns." Mark the risk as medium or higher.
