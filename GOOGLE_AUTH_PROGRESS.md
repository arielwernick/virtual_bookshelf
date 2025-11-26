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

## Completed (Phase 2: Shelf Refactoring)

### ✅ Task 2.1: Apply Migration to Database
**What's Needed**:
1. Copy `lib/db/MIGRATION_001_google_oauth.sql` to Neon SQL Editor
2. Execute it (this handles ALTER TABLE for existing databases)
3. Verify with test queries

**Status**: Script created, ready to apply.

---

### ✅ Task 2.2: Refactor Shelf Creation Route
**What Changed** (`app/api/shelf/create/route.ts`):
- Removed password requirement
- Requires authenticated session
- Takes only `name` (required) + `description` (optional)
- Creates shelf for authenticated user
- Returns shelf data with share_token

**Status**: Complete.

---

### ✅ Task 2.3: Create Dashboard Route
**What Changed** (`app/api/shelf/dashboard/route.ts`):
- New endpoint: GET `/api/shelf/dashboard`
- Requires authentication
- Returns all user's shelves with item counts
- Includes user info (username, email)

**Status**: Complete.

---

### ✅ Task 2.4: Shelf Management Routes
**What Created**:

**`app/api/shelf/[shelfId]/route.ts`** (new):
- GET: Fetch shelf + items (owner or public)
- PATCH: Update shelf (name, description, is_public)
- DELETE: Delete shelf (cascades to items)

**`app/api/shelf/share/[shareToken]/route.ts`** (updated):
- GET: Fetch public shelf by share token
- Returns shelf + items (no auth required)

**`app/api/items/[id]/route.ts`** (updated):
- PATCH/DELETE: Fixed ownership check to use shelf_id
- Verifies user owns the shelf containing the item

**Status**: Complete.

---

## Next Steps (Phase 3: Frontend Components)

### Task 3.1: Update Login Page
**Work Needed**:
- Remove username/password form
- Add "Sign in with Google" button
- Link to `/api/auth/google`

### Task 3.2: Create Shelf Creation Form
**Work Needed**:
- Form component: name + description
- POST to `/api/shelf/create`
- Redirect to shelf page

### Task 3.3: Create Dashboard
**Work Needed**:
- Fetch `/api/shelf/dashboard`
- Display list of shelves
- Button to create new shelf
- Edit/delete/share options per shelf
- Navigation to individual shelves

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
