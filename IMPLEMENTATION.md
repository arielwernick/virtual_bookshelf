# Implementation: Share Public Shelf Feature

## Architecture

### Database Changes
- Add `share_token` VARCHAR(50) UNIQUE column to users table
- Token generated as random 48-char hex string on user creation

### New API Endpoints
1. `GET /api/shelf/share/[shareToken]` - Fetch shelf data by share token
   - Returns username, items, created_at (same as public endpoint)
   - No authentication required
   - Returns 404 if token not found

### New Routes
1. `/s/[shareToken]` - Public shared shelf view
   - Client-side route using `[shareToken]` dynamic segment
   - Fetches data from `/api/shelf/share/[shareToken]`
   - Displays read-only shelf grid
   - Shows attribution "Shared by [username]"

### UI Components
1. **ShareModal.tsx** - Modal with share link and copy button
   - Displays share URL
   - Copy to clipboard button
   - Close button

### Updates to Existing Files
1. **lib/db/schema.sql** - Add share_token column
2. **lib/types/shelf.ts** - Update User interface
3. **lib/db/queries.ts** - Add getUserByShareToken function
4. **app/shelf/[username]/page.tsx** - Add Share button in header
5. **components/shelf/ShareModal.tsx** - New modal component
6. **app/s/[shareToken]/page.tsx** - New shared shelf route

## Data Flow
```
User shares shelf
  ↓
Share button clicked → ShareModal opens
  ↓
Copy button clicked → URL copied to clipboard
  ↓
Recipient opens /s/[shareToken]
  ↓
Page fetches /api/shelf/share/[shareToken]
  ↓
Display read-only shelf grid
```

## Database Migration
Need to run SQL to add share_token to existing users:
```sql
ALTER TABLE users ADD COLUMN share_token VARCHAR(50) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex');
CREATE INDEX IF NOT EXISTS idx_users_share_token ON users(share_token);
```
