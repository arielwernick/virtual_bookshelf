# Migration: Google OAuth & Multi-Shelf Architecture

## Overview
This migration restructures the database to support Google OAuth and multi-shelf architecture.

## Changes

### Users Table
- Made `username` optional (NULL allowed) - can be generated from email
- Made `password_hash` optional (NULL allowed) - for Google-only accounts
- Added `email` as UNIQUE NOT NULL - primary identifier for OAuth
- Added `google_id` as UNIQUE optional - for Google OAuth accounts
- Added constraint: must have either `password_hash` OR `google_id` (at least one auth method)
- Added indexes on email and google_id for faster lookups

### New Shelves Table
```sql
CREATE TABLE shelves (
  id UUID PRIMARY KEY
  user_id UUID NOT NULL (references users)
  name VARCHAR(100) NOT NULL
  description TEXT
  share_token VARCHAR(50) UNIQUE
  is_public BOOLEAN DEFAULT FALSE
  created_at TIMESTAMP
  updated_at TIMESTAMP
)
```
- Shelves own items (one user → many shelves → many items per shelf)
- Each shelf gets its own share_token for public sharing
- Indexes on user_id and share_token for performance

### Items Table
- Added `shelf_id UUID NOT NULL` - items now belong to shelves
- Kept `user_id UUID` as optional - for denormalization/optimization
- Changed order constraint from `(user_id, order_index)` to `(shelf_id, order_index)`
- Updated indexes accordingly

## Migration Steps for Existing Database

### Important: Fresh Install vs. Existing Database

**Fresh Install** (new Neon database):
1. Use `lib/db/schema.sql` - runs all CREATE TABLE statements

**Existing Database** (already has users/items):
1. Use `lib/db/MIGRATION_001_google_oauth.sql` - uses ALTER TABLE to add columns
2. Do NOT use schema.sql as it won't update existing tables

### Steps for Existing Database

### 1. Backup Database
```bash
# In your Neon console, export/backup your data first
```

### 2. Run Migration SQL
Copy the contents of `lib/db/MIGRATION_001_google_oauth.sql` and execute it in your Neon SQL Editor.

This migration:
- Adds `email` and `google_id` columns to users
- Makes `username` and `password_hash` optional
- Creates shelves table
- Updates items table with shelf_id
- Generates default shelves for existing users
- Migrates items to their respective shelves

### 3. Verify Migration Success
After running the migration, verify in Neon SQL Editor:
```sql
-- Check users have email
SELECT id, username, email, google_id FROM users LIMIT 1;

-- Check shelves were created
SELECT id, user_id, name FROM shelves LIMIT 1;

-- Check items have shelf_id
SELECT id, shelf_id, user_id, title FROM items LIMIT 1;
```

All three queries should return results with the new columns populated.

## Backward Compatibility

### Old Code That Still Works
- `users.username` and `users.password_hash` still exist
- Existing passwords continue to work
- Old share tokens in users table still function (but shelves use shelf.share_token now)

### Code That Needs Updates
- Item creation: now requires `shelf_id` instead of `user_id`
- Shelf creation: new endpoint, different flow
- Item queries: now filtered by `shelf_id` first, then `user_id` (optional)
- Share links: now point to shelf endpoint instead of user endpoint

## Testing

After migration, verify:
1. [ ] Existing users can still login with password
2. [ ] Existing items appear in their default shelf
3. [ ] Share tokens for default shelves work
4. [ ] New Google OAuth users are created with email
5. [ ] New shelves can be created and items added to specific shelves

## Rollback

If issues arise, you can:
1. Keep shelves table (it's isolated)
2. Reset items.shelf_id to NULL
3. Continue with old user.user_id → items.user_id flow
4. Items query code needs to fallback to user_id if shelf_id is NULL

This is relatively safe because:
- Shelves table is new (no dependencies)
- Items.shelf_id is separate from user_id (both exist)
- Users table changes are backward compatible
