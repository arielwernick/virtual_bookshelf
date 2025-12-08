# Database Migrations

## Migration Order

If you have an existing database, run migrations in order:

1. **Share Token Migration** (legacy)
2. **Top 5 Shelves Migration** (`MIGRATION_002_top5_shelf.sql`)
3. **Podcast Episodes Migration** (`MIGRATION_003_podcast_episodes.sql`)

## 1. Share Token Migration (Legacy)

Run this SQL in your Neon SQL Editor to add the share_token column to the users table:

```sql
-- Add share_token column to users table
ALTER TABLE users ADD COLUMN share_token VARCHAR(50) UNIQUE NOT NULL DEFAULT encode(gen_random_uuid()::text::bytea, 'hex');

-- Create index on share_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_share_token ON users(share_token);
```

## For new databases

The schema in `lib/db/schema.sql` already includes the share_token column, so no migration needed.

## What this does

- Adds a `share_token` column that stores a unique 48-character hex string for each user
- The token is auto-generated using Postgres's `gen_random_bytes()` function
- Creates an index for fast lookups by share token
- Each user gets a unique, permanent share token that never changes

## 2. Top 5 Shelves Migration

Run the SQL commands in `lib/db/MIGRATION_002_top5_shelf.sql` to add shelf_type support.

## 3. Podcast Episodes Migration

Run the SQL commands in `lib/db/MIGRATION_003_podcast_episodes.sql` to add podcast_episode support:

```sql
-- Drop the existing constraint
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_type_check;

-- Add the new constraint with podcast_episode support
ALTER TABLE items 
ADD CONSTRAINT items_type_check 
CHECK (type IN ('book', 'podcast', 'music', 'podcast_episode'));
```

## For New Databases

The schema in `lib/db/schema.sql` includes all features, so no migrations are needed for fresh installations.
