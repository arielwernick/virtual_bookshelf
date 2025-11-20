# Implementation Plan: Configurable Shelf Titles

## Architecture

### Database Changes
- Add `title VARCHAR(100)` column to users table
- Default to NULL
- Backward compatible with existing users

```sql
ALTER TABLE users ADD COLUMN title VARCHAR(100) DEFAULT NULL;
```

### Type Changes
- Update `User` interface to include `title: string | null`

### New API Endpoint
- `PATCH /api/shelf/title` - Update shelf title
  - Requires authentication
  - Validates title length (max 100 chars)
  - Validates ownership
  - Returns updated user data with new title

### UI Components
1. **ShelfHeader.tsx** (new or integrate into existing page)
   - Display current title or default fallback
   - Show "Edit Title" button (only for owner)
   - Handle click to enter edit mode

2. **ShelfTitleEditor.tsx** (new)
   - Inline input field for title
   - Save and Cancel buttons
   - Loading state during API call
   - Error state if save fails
   - Max 100 character validation

### Display Logic
```
if (title && title.trim().length > 0) {
  display: title
} else {
  display: "{username}'s Bookshelf"
}
```

## Implementation Steps

1. **Database Migration**
   - Add title column to users table

2. **Update Types**
   - Modify `User` interface in lib/types/shelf.ts
   - Update `ShelfData` interface if needed

3. **Create API Endpoint**
   - New file: `app/api/shelf/title/route.ts`
   - PATCH handler with auth validation
   - Update user title in database

4. **Update Shelf API Response**
   - Include title in `GET /api/shelf/[username]` response
   - Include title in `GET /api/shelf/share/[shareToken]` response

5. **Create UI Components**
   - TitleEditor component for inline editing
   - Integrate into shelf page header

6. **Update Shelf Page**
   - Pass title data through
   - Add edit button for owner
   - Wire up title editor component
   - Display title with fallback logic

7. **Update Shared Shelf View**
   - Display title with same fallback logic

## Data Flow
```
Owner clicks "Edit Title"
  ↓
TitleEditor component appears
  ↓
User types new title
  ↓
Click "Save"
  ↓
PATCH /api/shelf/title with new title
  ↓
Database updates
  ↓
Component refreshes with new title
  ↓
Title displays on page
```

## Files to Modify
- `lib/db/schema.sql` - Add title column
- `lib/types/shelf.ts` - Update User interface
- `app/shelf/[username]/page.tsx` - Add edit functionality
- `app/api/shelf/[username]/route.ts` - Include title in response
- `app/api/shelf/share/[shareToken]/route.ts` - Include title in response

## Files to Create
- `app/api/shelf/title/route.ts` - PATCH endpoint
- `components/shelf/ShelfTitleEditor.tsx` - Title editor component
