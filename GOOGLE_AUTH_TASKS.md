# Task Breakdown: Google OAuth & Multi-Shelf Implementation

## Phase 1: Foundation (Google OAuth Setup)

### Task 1.1: Setup Google OAuth Credentials
**Objective**: Get Google OAuth credentials and configure redirect URI
**Steps**:
1. Go to Google Cloud Console
2. Create new project (or use existing)
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Set redirect URI: `http://localhost:3000/api/auth/google/callback` (dev), `https://yourdomain.com/api/auth/google/callback` (prod)
6. Save Client ID and Client Secret to `.env.local`

**Acceptance**:
- [ ] Google OAuth credentials obtained
- [ ] Credentials stored in `.env.local`
- [ ] Redirect URI configured in Google Console

---

### Task 1.2: Database Schema Migration
**Objective**: Update users table + create shelves table
**Steps**:
1. Add columns to users table:
   - `google_id VARCHAR(100) UNIQUE`
   - `email VARCHAR(255) UNIQUE NOT NULL`
   - Make `password_hash` optional (allow NULL)
   - Make `username` optional or generate from email
2. Create shelves table:
   ```sql
   CREATE TABLE shelves (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     name VARCHAR(100) NOT NULL,
     description TEXT,
     share_token VARCHAR(50) UNIQUE NOT NULL,
     is_public BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   )
   ```
3. Create migration file documenting changes
4. Update schema.sql with new structure

**Acceptance**:
- [ ] schema.sql updated with users changes + shelves table
- [ ] Migration SQL file created and documented
- [ ] No conflicts with existing data

---

### Task 1.3: Create Google OAuth Callback Route
**Objective**: Handle Google OAuth callback and create/update user
**File**: `app/api/auth/google/callback/route.ts`
**Steps**:
1. Create route handler
2. Verify OAuth state token (CSRF protection)
3. Exchange authorization code for tokens
4. Fetch user info from Google
5. Create or update user in DB:
   - If google_id exists: update
   - If google_id new: create with email
6. Set JWT session cookie
7. Redirect to dashboard or onboarding

**Acceptance**:
- [ ] Route handles Google callback
- [ ] State token validation working
- [ ] User created/updated in DB
- [ ] Session cookie set
- [ ] Redirects to dashboard

---

### Task 1.4: Create Google OAuth Login Route
**Objective**: Generate OAuth flow URL for "Sign in with Google" button
**File**: `app/api/auth/google/route.ts`
**Steps**:
1. Create route handler that generates OAuth URL
2. Include state token for CSRF protection
3. Include necessary scopes (openid, email, profile)
4. Redirect user to Google auth URL

**Acceptance**:
- [ ] Route generates valid Google OAuth URL
- [ ] State token included
- [ ] Correct scopes requested

---

## Phase 2: Shelf Refactoring

### Task 2.1: Update Database Queries
**Objective**: Create queries for shelf operations
**File**: `lib/db/queries.ts`
**New functions**:
- `createShelf(userId: string, name: string, description?: string): Promise<Shelf>`
- `getShelfsByUserId(userId: string): Promise<Shelf[]>`
- `getShelfById(shelfId: string): Promise<Shelf | null>`
- `getShelfByShareToken(shareToken: string): Promise<Shelf | null>`
- `updateShelf(shelfId: string, data: Partial<Shelf>): Promise<Shelf>`
- `deleteShelf(shelfId: string): Promise<boolean>`

**Acceptance**:
- [ ] All shelf queries implemented
- [ ] Queries tested with sample data
- [ ] Proper error handling

---

### Task 2.2: Update Items Queries
**Objective**: Refactor items to use shelf_id instead of user_id
**File**: `lib/db/queries.ts`
**Changes**:
1. Update `createItem` to accept `shelf_id` instead of `user_id`
2. Update `getItemsByShelfId` (rename from getItemsByUserId)
3. Update `updateItem`, `deleteItem` with shelf context
4. Update `updateItemOrder` to work with shelves

**Acceptance**:
- [ ] Items queries updated to use shelf_id
- [ ] All existing query functions work with new structure
- [ ] Item retrieval by shelf working

---

### Task 2.3: Create Shelf Creation Route (Auth-Required)
**Objective**: New shelf creation endpoint that requires session
**File**: `app/api/shelf/create/route.ts` (refactor existing)
**Changes**:
1. Check for valid session (user_id from JWT)
2. Require only `name` parameter (no password)
3. Generate share_token for shelf
4. Create shelf associated with user
5. Return shelf data

**Acceptance**:
- [ ] Route requires authentication
- [ ] Shelf created without password
- [ ] Share token generated
- [ ] Shelf associated with correct user

---

### Task 2.4: Create Dashboard Route
**Objective**: Show user all their shelves
**File**: `app/api/shelf/dashboard/route.ts`
**Steps**:
1. Check for valid session
2. Get all shelves for user_id
3. Return shelf list with item counts
4. Include actions (edit, delete, share)

**Acceptance**:
- [ ] Route requires authentication
- [ ] All user shelves returned
- [ ] Item counts included

---

## Phase 3: Frontend Updates

### Task 3.1: Update Login UI
**Objective**: Replace password login with "Sign in with Google"
**Changes**:
1. Remove username/password form
2. Add "Sign in with Google" button
3. Link to `/api/auth/google`
4. Show loading state during auth flow

**Acceptance**:
- [ ] Google login button visible
- [ ] Redirects to Google OAuth
- [ ] Returns to app after auth

---

### Task 3.2: Create Shelf Creation Form
**Objective**: Simple form to create new shelf
**Changes**:
1. Create form component with:
   - Shelf name (required)
   - Description (optional)
   - "Create shelf" button
2. POST to `/api/shelf/create`
3. Redirect to new shelf on success

**Acceptance**:
- [ ] Form renders
- [ ] Creates shelf via API
- [ ] Redirects to new shelf

---

### Task 3.3: Create Dashboard Component
**Objective**: Show all user shelves with management
**Changes**:
1. Display list of shelves
2. Show item count per shelf
3. Options to edit/delete/share each shelf
4. Button to create new shelf
5. Link to each shelf

**Acceptance**:
- [ ] Dashboard shows all user shelves
- [ ] Item counts displayed
- [ ] Can navigate to shelves
- [ ] Can create new shelf from dashboard

---

## Phase 4: Data Migration (Optional)

### Task 4.1: Migrate Existing Users to New Schema
**Objective**: Handle existing user data
**Steps**:
1. For each user, create default shelf with their items
2. Migrate items to shelf
3. Preserve share tokens
4. Keep old username/password for backward compat (optional)

**Acceptance**:
- [ ] Existing users' data preserved
- [ ] Items moved to default shelf
- [ ] Share tokens still valid

---

## Testing Checklist

### Unit Tests
- [ ] Shelf creation with valid data
- [ ] Google OAuth token verification
- [ ] Session creation from Google user
- [ ] Item operations with shelf_id

### Integration Tests
- [ ] Full Google OAuth flow
- [ ] Create shelf → Create item → Share
- [ ] Multiple shelves per user
- [ ] Item reordering within shelf

### Manual Tests
- [ ] Sign up with Google
- [ ] Create multiple shelves
- [ ] Add items to shelf
- [ ] Share shelf link (public)
- [ ] Delete shelf + items

---

## Priority Order
1. Tasks 1.1 → 1.4 (Google Auth setup)
2. Tasks 2.1 → 2.3 (Database + Shelf ops)
3. Tasks 3.1 → 3.3 (Frontend)
4. Task 4.1 (Migration, if needed)
