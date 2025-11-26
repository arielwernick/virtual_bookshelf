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

If you have existing users and items, follow these steps to migrate:

### 1. Backup Database
```bash
# In your Neon console, export/backup your data first
```

### 2. Run Schema Updates
Execute the updated schema.sql in Neon SQL Editor. Since it uses `CREATE TABLE IF NOT EXISTS`, it's safe to run multiple times.

### 3. Add Email to Existing Users (if upgrading)
```sql
-- Generate email from username if not present
UPDATE users 
SET email = username || '@localhost'
WHERE email IS NULL
AND username IS NOT NULL;
```

### 4. Create Default Shelves for Existing Users
```sql
-- Create one default shelf per user, preserving their existing share_token
INSERT INTO shelves (id, user_id, name, share_token, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  users.id,
  COALESCE(users.title, users.username || '''s Shelf'),
  users.share_token,
  users.created_at,
  users.updated_at
FROM users
WHERE NOT EXISTS (SELECT 1 FROM shelves WHERE shelves.user_id = users.id);
```

### 5. Migrate Items to Shelves
```sql
-- For each user, associate their items with their default shelf
UPDATE items
SET shelf_id = shelves.id
FROM shelves
WHERE items.user_id = shelves.user_id
AND items.shelf_id IS NULL;
```

### 6. Update Order Constraints
```sql
-- The items table constraint has been updated from user_id to shelf_id
-- If you have duplicate order_index values per user, you may need to fix them:
-- Contact support if you encounter constraint violations
```

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
