# PRD: Remove Top 5 Shelf Feature

## Overview

**Feature:** Remove Top 5 Shelf Type  
**Priority:** High  
**Status:** In Progress  
**Created:** January 13, 2026  
**Branch:** `feature/remove-top5-shelves`

## Problem Statement

The Top 5 shelf feature adds unnecessary complexity to the shelf creation process without providing significant value to users. This feature:

1. **Increases onboarding friction** - Users must choose between "Standard" and "Top 5" shelf types during creation, adding a decision point that delays getting started
2. **Diverges from core functionality** - The ranking/limited-items concept doesn't align with the primary value proposition of curating and sharing collections
3. **Adds maintenance burden** - Separate components (`Top5ShelfGrid`, `Top5ItemCard`) and conditional logic throughout the codebase
4. **Creates inconsistent UX** - Different display formats and behaviors between shelf types can confuse users

## Proposed Solution

Remove the Top 5 shelf feature entirely and unify all shelves as "standard" type. This will:

- Simplify the shelf creation flow (one-click to create, no type selection)
- Reduce codebase complexity
- Provide consistent experience across all shelves
- Allow users to naturally highlight favorites through ordering in standard shelves

## User Stories

**As a new user**, I want to create a shelf quickly without unnecessary choices so that I can start adding content immediately.

**As an existing user**, I want my existing Top 5 shelves to continue working (converted to standard) so that I don't lose any data.

**As a developer**, I want cleaner code without conditional shelf-type logic so that I can maintain the application more easily.

## Requirements

### Functional Requirements

1. **Remove shelf type selection** from the create shelf form
2. **Convert existing Top 5 shelves** to standard type via database migration
3. **Remove Top 5-specific components** (`Top5ShelfGrid`, `Top5ItemCard`)
4. **Remove conditional rendering** based on shelf type throughout the app
5. **Remove `shelf_type` column** from database (or keep as 'standard' only)
6. **Update TypeScript types** to remove `ShelfType` union

### Non-Functional Requirements

1. **Zero data loss** - All items from existing Top 5 shelves must be preserved
2. **Graceful migration** - Existing users shouldn't experience any disruption
3. **Clean codebase** - All Top 5 references should be removed

## Technical Implementation

### Files to Modify

1. **Database Schema & Migration**
   - `lib/db/schema.sql` - Remove `shelf_type` constraint or change to allow only 'standard'
   - Create `lib/db/MIGRATION_004_remove_top5.sql` - Update existing shelves

2. **TypeScript Types**
   - `lib/types/shelf.ts` - Remove `ShelfType` type, remove `shelf_type` from `Shelf` interface

3. **Dashboard Page**
   - `app/dashboard/page.tsx` - Remove shelf type selection UI, remove conditional rendering

4. **Shelf Detail Pages**
   - `app/shelf/[shelfId]/page.tsx` - Remove Top5ShelfGrid import and conditional rendering
   - `app/shelf/[shelfId]/edit/page.tsx` - Remove any Top 5-specific edit logic

5. **Embed Pages**
   - `app/embed/[shareToken]/page.tsx` - Remove Top5ShelfGrid import and conditional rendering

6. **Public Share Pages**
   - `app/s/[shareToken]/page.tsx` - Remove any Top 5-specific rendering

7. **Components to Delete**
   - `components/shelf/Top5ShelfGrid.tsx`
   - `components/shelf/Top5ShelfGrid.test.tsx`
   - `components/shelf/Top5ItemCard.tsx`
   - `components/shelf/Top5ItemCard.test.tsx`

8. **API Routes**
   - `app/api/shelf/route.ts` - Remove shelf_type from create shelf logic
   - `app/api/shelf/[shelfId]/route.ts` - Remove shelf_type references
   - `app/api/shelf/dashboard/route.ts` - Remove shelf_type from response

9. **Migration Files**
   - Delete or mark deprecated: `lib/db/MIGRATION_002_top5_shelf.sql`

10. **Task Lists**
    - Update `TASK_LIST_PODCAST_EPISODES.md` - Remove Top 5 references

## Acceptance Criteria

- [ ] Users can create shelves without choosing a type (single "Create Shelf" button flow)
- [ ] All existing shelves display using standard ShelfGrid component
- [ ] No Top 5-related code, components, or types remain in codebase
- [ ] Database migration successfully converts existing Top 5 shelves
- [ ] All existing items on Top 5 shelves are preserved
- [ ] All tests pass after modifications
- [ ] Build completes successfully with no type errors

## Migration Strategy

### Database Migration

```sql
-- Migration: Remove Top 5 shelf type
-- 1. Update all top5 shelves to standard
UPDATE shelves SET shelf_type = 'standard' WHERE shelf_type = 'top5';

-- 2. Update constraint to only allow 'standard'
ALTER TABLE shelves DROP CONSTRAINT IF EXISTS shelves_shelf_type_check;
ALTER TABLE shelves ADD CONSTRAINT shelves_shelf_type_check CHECK (shelf_type = 'standard');
```

### Rollback Plan

If issues occur, shelves can be identified by:
- Created date (Top 5 feature launch date)
- Number of items (5 or fewer)

However, this is a one-way migration as there's no way to distinguish which standard shelves were previously Top 5.

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Users may miss Top 5 feature | Users can manually limit and order items in standard shelves |
| Database migration failure | Test migration on staging before production |
| Breaking existing shared links | Shared links will continue to work, just display as standard grid |

## Out of Scope

- Adding alternative ranking features
- Adding item limits as an optional feature
- Changing the core shelf display grid

## Success Metrics

- Reduced time-to-first-shelf for new users
- Fewer codebase files and lines of code
- Simplified mental model for users

## Timeline

Estimated implementation: 2-3 hours

1. Create migration and update database (15 min)
2. Update TypeScript types (10 min)
3. Update dashboard page (20 min)
4. Update shelf detail pages (15 min)
5. Update embed/share pages (10 min)
6. Delete Top 5 components (5 min)
7. Update API routes (15 min)
8. Clean up tests and documentation (20 min)
9. Testing and verification (30 min)
