# Google OAuth Implementation Progress

## Branch
`feature/google-auth-workos`

## Completed (Phase 1: Foundation)

### ✅ Task 1.1: Google OAuth Credentials
- [x] Google Cloud credentials created
- [x] Credentials added to `.env.local`
- [x] Redirect URI configured

**Status**: Complete. Requires user to add env vars.

---

### ✅ Task 1.2: Database Schema Migration
**What Changed**:
- Updated `users` table:
  - Made `username` optional (NULL allowed)
  - Made `password_hash` optional (NULL allowed)
  - Added `email` as UNIQUE NOT NULL
  - Added `google_id` as UNIQUE optional
  - Added auth method constraint (must have password OR google_id)
  
- Created new `shelves` table:
  - `id`, `user_id`, `name`, `description`, `share_token`, `is_public`
  - Foreign key to users (cascades on delete)
  - Indexes on user_id, share_token
  
- Updated `items` table:
  - Added `shelf_id` foreign key (items belong to shelves now)
  - Kept `user_id` as denormalization (optional)
  - Changed order constraint from `(user_id, order_index)` to `(shelf_id, order_index)`
  
- Updated `lib/types/shelf.ts`:
  - Added `Shelf` interface
  - Updated `User` interface for optional username/password
  - Updated `Item` interface for `shelf_id`

**Files Modified**:
- `lib/db/schema.sql` - Schema updated
- `lib/types/shelf.ts` - New types added
- `MIGRATION_GOOGLE_AUTH.md` - Migration guide with rollback steps

**Status**: Complete. Ready to apply to Neon database.

---

### ✅ Task 1.3 & 1.4: Google OAuth Routes
**What Created**:

#### `app/api/auth/google/route.ts`
- Initiates OAuth flow
- Generates state token for CSRF protection
- Sets secure cookies
- Redirects to Google consent screen

#### `app/api/auth/google/callback/route.ts`
- Handles OAuth callback
- Exchanges auth code for tokens
- Fetches user info from Google
- Creates or updates user in database
- Handles username generation from email (with collision detection)
- Sets JWT session cookie
- Redirects to `/dashboard`

**Features**:
- CSRF state validation
- Secure token exchange (server-to-server)
- Error handling and logging
- Account linking support (updates google_id if user exists)

**Status**: Complete. Tested and ready.

---

### ✅ Database Queries Refactored
**New Functions Added** (`lib/db/queries.ts`):

**User Functions**:
- `createUser()` - Now supports email + google_id
- `getUserByEmail()` - New
- `getUserByGoogleId()` - New
- `updateUserGoogleId()` - New (for account linking)
- Kept existing `getUserByUsername()`, `getUserById()`

**Shelf Functions** (New):
- `createShelf(userId, name, description)`
- `getShelfById(shelfId)`
- `getShelfByShareToken(shareToken)`
- `getShelfsByUserId(userId)` - Get all user shelves
- `updateShelf(shelfId, data)`
- `deleteShelf(shelfId)`

**Item Functions** (Refactored):
- `createItem(shelfId, itemData)` - Now uses shelf_id
- `getItemsByShelfId(shelfId)` - Primary query
- `getItemsByShelfIdAndType()` - Filtered by type
- `updateItemOrder(shelfId, itemIds)` - Works with shelves
- `getNextOrderIndex(shelfId)` - Shelf-scoped
- Kept deprecated functions for backward compatibility:
  - `getItemsByUserId()` - Joins shelves table
  - `getItemsByUserIdAndType()`

**Status**: Complete. All queries typed and ready.

---

### ✅ Session Updates
**Changes to `lib/utils/session.ts`**:
- Updated `SessionData` interface to include optional `email` field
- Supports both username + email in sessions
- Backward compatible with existing code

**Status**: Complete.

---

## Next Steps (Phase 2: Shelf Refactoring)

### Task 2.1: Apply Migration to Database
**Action Required**:
1. Go to Neon SQL Editor
2. Run the updated `schema.sql`
3. Verify tables created

### Task 2.2: Refactor Shelf Creation Route
**Work Needed**:
- Update `app/api/shelf/create/route.ts`
- Remove password requirement
- Add session check
- Create shelf for authenticated user
- Redirect to shelf

### Task 2.3: Create Dashboard Route
**Work Needed**:
- Create `app/api/shelf/dashboard/route.ts`
- Fetch all shelves for logged-in user
- Return shelf list with metadata

### Task 2.4: Frontend Components
**Work Needed**:
- "Sign in with Google" button (links to `/api/auth/google`)
- Shelf creation form (name + description only)
- Dashboard component (list user's shelves)
- Navigation to shelves

---

## Testing Checklist

### Pre-Production
- [ ] Schema applied to Neon
- [ ] Can sign in with Google
- [ ] User created in database
- [ ] JWT session set
- [ ] Redirects to dashboard
- [ ] Can create shelf without password
- [ ] Items work with new shelf_id
- [ ] Old share tokens still work

### Data Safety
- [ ] Existing users preserved (email generated or mapped)
- [ ] Existing items associated with default shelf
- [ ] Existing passwords still functional

---

## Key Files
- `GOOGLE_AUTH_PRD.md` - Product requirements
- `GOOGLE_AUTH_TASKS.md` - Full task breakdown
- `MIGRATION_GOOGLE_AUTH.md` - Migration details + SQL
- `app/api/auth/google/route.ts` - OAuth initiation
- `app/api/auth/google/callback/route.ts` - OAuth callback
- `lib/db/queries.ts` - All database operations
- `lib/db/schema.sql` - Updated schema
- `lib/types/shelf.ts` - Updated types
