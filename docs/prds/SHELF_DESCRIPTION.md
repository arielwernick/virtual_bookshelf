# Feature: Shelf Descriptions

## 1. Problem Statement

Currently, each user's shelf (collection of items) has no metadata beyond displaying the items themselves. Users cannot add context, a personal description, or any metadata to their shelf as a whole. This limits personalization and makes it harder for visitors to understand what the shelf is about before viewing the items.

## 2. Proposed Solution

Add a description field to the user's shelf that:
- Allows users to write a custom description (markdown optional, plain text is fine)
- Displays prominently on the shelf header
- Is editable by the shelf owner
- Is visible to public/shared viewers
- Can be up to 500 characters (or suitable length)

**Implementation approach:**
- Add a `description` column to the `users` table (TEXT, nullable)
- Add `description` to the `User` interface
- Create an API endpoint to update the shelf description
- Add a UI component for editing the description
- Display the description on the shelf view

## 3. Success Criteria

- [x] `description` column added to users table
- [x] `User` interface includes `description` field
- [x] Query function exists to update user description (`updateUserDescription`)
- [x] API endpoint `/api/shelf/update-description` accepts POST with description
- [x] Shelf edit page includes description input field with character counter
- [x] Description displays on public shelf view
- [x] Description displays on shared shelf view
- [x] Editing updates description with save button
- [x] Description can be empty/null
- [x] Character limit enforced (500 chars, frontend + backend)
- [x] TypeScript types updated (User, ShelfData interfaces)
- [x] API endpoints updated to return description in shelf data

## 4. Implementation Summary

### Database
- Added `description TEXT` column to users table

### Types
- Updated `User` interface with `description: string | null`
- Updated `ShelfData` interface with `description: string | null`

### Database Queries
- Added `updateUserDescription(userId, description)` function

### API Endpoints
- `POST /api/shelf/update-description` - Update user's shelf description (requires auth)
- Updated `GET /api/shelf/[username]` - Now returns description in response
- Updated `GET /api/shelf/share/[shareToken]` - Now returns description in response

### UI/Pages
- `/shelf/[username]/edit` - Added description editor with 500 char limit and save button
- `/shelf/[username]` - Shows description in header if present
- `/s/[shareToken]` - Shows description in header if present

### Features
- Description field in edit page with character counter
- Save button appears only when description is modified
- Character limit enforced at 500 characters
- Description displays gracefully on public and shared views
- Empty descriptions don't disrupt layout (hidden when null)
