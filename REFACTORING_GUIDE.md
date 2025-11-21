# User Accounts & Multiple Shelves Refactoring Guide

## Overview

This document describes the architectural changes made to support proper user accounts with multiple shelves.

## What Changed

### Before (Old Architecture)
- One user = One shelf
- Users table acted as "shelves"
- Items belonged directly to users
- Each username had one collection

### After (New Architecture)
- Users have accounts with authentication
- Each user can own multiple shelves
- Items belong to shelves
- Each user has one default shelf
- Full support for managing multiple collections

## Database Changes

### New Schema

#### Users Table (Simplified)
```sql
- id: UUID (primary key)
- username: VARCHAR(50)
- password_hash: VARCHAR(255)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### Shelves Table (NEW)
```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to users)
- name: VARCHAR(100)
- share_token: VARCHAR(50)
- description: TEXT
- is_default: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### Items Table (Updated)
```sql
- id: UUID (primary key)
- shelf_id: UUID (foreign key to shelves) ← Changed from user_id
- type: VARCHAR(20)
- title: VARCHAR(255)
- creator: VARCHAR(255)
- image_url: TEXT
- external_url: TEXT
- notes: TEXT
- order_index: INTEGER
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Migration Required

**⚠️ Important**: If you have an existing database, you MUST run the migration script:

```sql
-- Run this in your Neon SQL Editor
-- File: lib/db/migration-to-shelves.sql
```

The migration will:
1. Create the `shelves` table
2. Create a default shelf for each existing user
3. Migrate items to reference shelves instead of users
4. Remove obsolete columns from users table (`share_token`, `description`, `title`)

## API Changes

### New Endpoints

#### Shelf Management
- `GET /api/shelves` - List all shelves for authenticated user
- `POST /api/shelves` - Create a new shelf
- `GET /api/shelves/[id]` - Get a specific shelf
- `PATCH /api/shelves/[id]` - Update shelf name or description
- `DELETE /api/shelves/[id]` - Delete a shelf (except default)

### Updated Endpoints

#### Items API
All item operations now require `shelf_id`:

```javascript
// Creating an item
POST /api/items
{
  "shelf_id": "uuid-here",  // NEW: Required
  "type": "book",
  "title": "Example",
  "creator": "Author"
}

// Reordering items
POST /api/items/reorder
{
  "shelf_id": "uuid-here",  // NEW: Required
  "itemIds": ["id1", "id2", "id3"]
}
```

#### Shelf Metadata Updates
```javascript
// Update shelf description
POST /api/shelf/update-description
{
  "shelf_id": "uuid-here",  // NEW: Required
  "description": "My books"
}

// Update shelf title/name
PATCH /api/shelf/update-title
{
  "shelf_id": "uuid-here",  // NEW: Required
  "title": "Reading List"
}
```

## Code Changes

### TypeScript Types

#### New Types
```typescript
// Shelf interface
interface Shelf {
  id: string;
  user_id: string;
  name: string;
  share_token: string;
  description: string | null;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}

// Create shelf data
interface CreateShelfData {
  name: string;
  description?: string;
  is_default?: boolean;
}

// Update shelf data
interface UpdateShelfData {
  name?: string;
  description?: string;
}
```

#### Updated Types
```typescript
// User - removed shelf-related fields
interface User {
  id: string;
  username: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

// Item - changed user_id to shelf_id
interface Item {
  id: string;
  shelf_id: string;  // Changed from user_id
  // ... other fields
}

// ShelfData - updated for display
interface ShelfData {
  username: string;
  shelfName: string;  // Changed from title
  description: string | null;
  items: Item[];
  share_token?: string;
  created_at: Date;
}
```

### Component Updates

#### AddItemForm
Now requires `shelfId` prop:
```typescript
<AddItemForm
  shelfId={currentShelf.id}  // NEW: Required
  onItemAdded={() => refresh()}
  onClose={() => setShowModal(false)}
/>
```

## User Flow

### Registration
1. User creates account with username/password
2. System automatically creates a default shelf named "My Shelf"
3. User is logged in and redirected to edit their shelf

### Using the App
1. User logs in with username/password
2. Default shelf is displayed at `/shelf/[username]`
3. User can edit their default shelf
4. (Future) User can create additional shelves
5. Each shelf has its own share link

### Multiple Shelves (Future Enhancement)
The architecture now supports multiple shelves per user. Future UI updates can add:
- Shelf selector dropdown
- "Create New Shelf" button
- Shelf management page
- Ability to switch between shelves in edit mode

## Backwards Compatibility

### Preserved Functionality
- ✅ User registration flow unchanged
- ✅ Login flow unchanged
- ✅ Public shelf URLs (`/shelf/[username]`) work the same
- ✅ Share URLs (`/s/[shareToken]`) work the same
- ✅ All UI functionality preserved

### Breaking Changes
- Database schema change requires migration
- Old database backups incompatible without migration
- API now requires `shelf_id` for item operations

## Testing Checklist

After deploying this refactor:

- [ ] Test user registration
- [ ] Test login
- [ ] Test viewing public shelf
- [ ] Test adding items to shelf
- [ ] Test editing items
- [ ] Test deleting items
- [ ] Test reordering items
- [ ] Test updating shelf description
- [ ] Test updating shelf title
- [ ] Test share link functionality
- [ ] Test authentication/authorization

## Future Enhancements

The new architecture enables:

1. **Multiple Shelves Per User**
   - Reading list, Favorites, To-Read, etc.
   - Each shelf can have different sharing settings
   - Organize collections by theme or category

2. **Enhanced Sharing**
   - Share individual shelves
   - Different privacy settings per shelf
   - Collaborative shelves (future)

3. **Better Organization**
   - Tags across shelves
   - Search within all user's shelves
   - Cross-shelf statistics

## Rollback Plan

If issues arise:

1. Keep a backup of the old database
2. The old branch is preserved in git history
3. To rollback:
   ```bash
   git revert <commit-hash>
   ```
4. Restore database from backup

## Questions?

If you encounter issues:
1. Check that migration script ran successfully
2. Verify all environment variables are set
3. Check browser console for client-side errors
4. Check server logs for API errors

## Files Modified

### Database & Types
- `lib/db/schema.sql` - New schema with shelves table
- `lib/db/migration-to-shelves.sql` - Migration script
- `lib/db/queries.ts` - Added shelf operations, updated item queries
- `lib/types/shelf.ts` - Added Shelf type, updated Item and User types

### API Routes
- `app/api/shelf/create/route.ts` - Creates user + default shelf
- `app/api/shelves/route.ts` - NEW: Shelf list/create endpoints
- `app/api/shelves/[id]/route.ts` - NEW: Shelf CRUD operations
- `app/api/items/route.ts` - Updated to require shelf_id
- `app/api/items/[id]/route.ts` - Updated ownership checks
- `app/api/items/reorder/route.ts` - Updated to use shelf_id
- `app/api/shelf/[username]/route.ts` - Returns default shelf
- `app/api/shelf/share/[shareToken]/route.ts` - Updated for shelves
- `app/api/shelf/update-description/route.ts` - Updated to use shelf_id
- `app/api/shelf/update-title/route.ts` - Updated to use shelf_id

### UI Components
- `components/shelf/AddItemForm.tsx` - Added shelfId prop
- `app/shelf/[username]/page.tsx` - Updated to display shelfName
- `app/shelf/[username]/edit/page.tsx` - Updated to fetch and use shelf_id
- `app/s/[shareToken]/page.tsx` - Updated for shelf display
