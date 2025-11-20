# TODOs: Configurable Shelf Titles

## Phase 1: Database & Types
- [ ] Add title column to users table in schema.sql
- [ ] Update User interface in lib/types/shelf.ts to include title field
- [ ] Verify migration strategy for existing users

## Phase 2: API Endpoints
- [ ] Create PATCH /api/shelf/title endpoint
  - [ ] Add authentication check
  - [ ] Validate title length (max 100 chars)
  - [ ] Update database with new title
  - [ ] Return updated user data
- [ ] Update GET /api/shelf/[username] to include title in response
- [ ] Update GET /api/shelf/share/[shareToken] to include title in response

## Phase 3: UI Components
- [ ] Create ShelfTitleEditor component
  - [ ] Accept current title as prop
  - [ ] Show input field and save/cancel buttons
  - [ ] Handle loading state
  - [ ] Handle error state
  - [ ] Validate max 100 character limit
  - [ ] Call update API on save
  - [ ] Emit callback with updated title on success
- [ ] Create TitleDisplay component (optional, for displaying title + edit button)

## Phase 4: Integration
- [ ] Update shelf page (/app/shelf/[username]/page.tsx)
  - [ ] Import TitleEditor component
  - [ ] Add title from shelf data
  - [ ] Add "Edit Title" button (visible only for owner)
  - [ ] Implement edit mode toggle
  - [ ] Wire up title update callback
  - [ ] Display title with fallback logic
- [ ] Update header to show title instead of hardcoded "{username}'s Bookshelf"

## Phase 5: Display & Fallback Logic
- [ ] Update page title display:
  ```
  const displayTitle = shelfData.title && shelfData.title.trim().length > 0 
    ? shelfData.title 
    : `${shelfData.username}'s Bookshelf`
  ```
- [ ] Test fallback displays correctly when title is null/empty

## Phase 6: Testing
- [ ] Test owner can edit title
- [ ] Test non-owner cannot edit title
- [ ] Test title persists across page refresh
- [ ] Test title displays on shared shelf view
- [ ] Test fallback displays when title is empty
- [ ] Test title length validation (100 char limit)
- [ ] Test error handling if API call fails
- [ ] Test on mobile responsive view

## Phase 7: Polish
- [ ] Ensure loading state feedback during API call
- [ ] Ensure error messages are clear
- [ ] Test keyboard interactions (Enter to save, Escape to cancel)
- [ ] Consider adding placeholder text in input
- [ ] Consider adding character count indicator

## Phase 8: Shared Shelf View
- [ ] Verify title displays correctly on /s/[shareToken] route
- [ ] Test title update reflected on shared view
