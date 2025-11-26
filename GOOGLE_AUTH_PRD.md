# PRD: Google OAuth Authentication & Multi-Shelf Architecture

## Problem
Currently, shelves are password-protected (users create a shelf with username + password). This creates friction for shelf creation and management. We need a modern authentication flow where:
- Users authenticate once with Google
- Users can create multiple shelves under their account
- Shelf creation no longer requires password entry

## Solution Overview
Implement Google OAuth authentication as the primary login method, and refactor shelf creation to be user-centric rather than shelf-centric.

### Architecture Changes
1. **User Model**: Keep existing `users` table, add `google_id` field for OAuth
2. **Shelf Model**: Create new `shelves` table (currently "shelves" are just users with items)
3. **Session**: Continue using JWT-based sessions (no changes to session.ts)
4. **Auth Flow**:
   - User clicks "Sign in with Google"
   - Google OAuth callback creates/updates user
   - User redirected to dashboard where they can create multiple shelves
   - Shelf creation requires no password (auth already verified)

## Data Model Changes

### Users Table
- Add: `google_id` (optional, for OAuth)
- Add: `email` (from Google)
- Keep: `password_hash` (optional, for backward compatibility or future local auth)
- Keep: `username` (generated from email if Google-only)

### New Shelves Table
```
shelves (
  id UUID PRIMARY KEY
  user_id UUID FOREIGN KEY -> users(id)
  name VARCHAR(100)
  description TEXT
  is_public BOOLEAN
  created_at TIMESTAMP
  updated_at TIMESTAMP
)
```

### Items Table (Refactor)
- Change: `user_id` → `shelf_id`
- Items now belong to shelves, not directly to users

## User Flows

### Flow 1: First-Time Google Login
1. User visits app, clicks "Sign in with Google"
2. Google OAuth callback
3. If user doesn't exist: Create user with google_id + email
4. Session created, user redirected to dashboard
5. User creates first shelf (requires shelf name only)
6. User can add items to shelf

### Flow 2: Create Additional Shelf
1. User logged in, on dashboard
2. Click "Create new shelf"
3. Enter shelf name (optional description)
4. Shelf created, redirected to new shelf
5. Add items to shelf

## Acceptance Criteria
- [ ] Google OAuth integration working (callback URL correct)
- [ ] User created/updated via Google login
- [ ] JWT session set on successful Google auth
- [ ] Shelves table created and migrations run
- [ ] Shelf creation requires only name (no password)
- [ ] Users can view all their shelves in dashboard
- [ ] Items correctly associated with shelves
- [ ] Share token still works (shelf-level sharing)

## Out of Scope (Phase 2)
- Linking Google auth to existing password accounts
- Social features (followers, shares, etc.)
- WorkOS directory sync
- Multiple OAuth providers (GitHub, Discord, etc.)
