# PRD: Configurable Shelf Titles (Rename Shelf)

## Objective
Enable users to rename their bookshelf titles after the shelf is created. Currently the title is fixed as "{username}'s Bookshelf". Users should be able to customize this to any title they prefer.

## Problem Statement
Users want to organize their bookshelves by themes or categories, not just their username. A single shelf titled "{username}'s Bookshelf" limits organizational flexibility.

## Requirements

### Functional Requirements
1. Add a new "title" field to users table (optional, defaults to null for backward compatibility)
2. When title is null/empty, display "{username}'s Bookshelf" as fallback
3. Add "Edit Title" button to shelf header (visible only to owner)
4. Create inline title editor that allows users to:
   - Edit the shelf title directly
   - Save changes with API call
   - Cancel editing without saving
   - See loading/error states
5. Title should be max 100 characters
6. Title can be empty (which reverts to default display)

### User-Facing Behavior
- Owner clicks "Edit Title" button
- Title becomes editable (inline edit or modal)
- User types new title
- Click "Save" to persist
- Title updates immediately on page
- Non-owners see the title but cannot edit

### API Changes
- `PATCH /api/shelf/title` - Update shelf title (requires auth, returns updated user data)

## Success Criteria
- [ ] Title column added to users table
- [ ] User type includes title field
- [ ] Edit Title button added to shelf page header
- [ ] Inline/modal title editor component created
- [ ] PATCH endpoint implemented and secured
- [ ] Title updates persist in database
- [ ] Title displays correctly on shelf page
- [ ] Title displays on shared shelf view (with same logic)
- [ ] Works on mobile responsive design

## Acceptance Criteria
- User can rename their shelf to any title
- Title persists across page refreshes
- Non-owners cannot edit title
- Default fallback works when no title set
- Title length is validated (max 100 chars)
