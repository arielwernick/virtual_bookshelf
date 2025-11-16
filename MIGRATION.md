# Database Migration: Add Share Token Feature

## For existing databases

Run this SQL in your Neon SQL Editor to add the share_token column to the users table:

```sql
-- Add share_token column to users table
ALTER TABLE users ADD COLUMN share_token VARCHAR(50) UNIQUE NOT NULL DEFAULT encode(gen_random_uuid()::text, 'hex');

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
