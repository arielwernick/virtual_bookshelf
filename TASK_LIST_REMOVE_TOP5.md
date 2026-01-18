# Task List: Remove Top 5 Shelf Feature

**GitHub Issue:** #110  
**Branch:** `feature/remove-top5-shelves`  
**PRD:** [REMOVE_TOP5_SHELVES_PRD.md](./prds/REMOVE_TOP5_SHELVES_PRD.md)

---

## Phase 1: Database Migration

### Task 1.1: Create database migration file
- **Status:** ✅ Complete
- **File:** `lib/db/MIGRATION_004_remove_top5.sql`
- **Description:** Create SQL migration to convert all top5 shelves to standard and update constraint

### Task 1.2: Update schema.sql
- **Status:** ✅ Complete
- **File:** `lib/db/schema.sql`
- **Description:** Update CHECK constraint to only allow 'standard' shelf type

---

## Phase 2: TypeScript Types

### Task 2.1: Remove ShelfType and update Shelf interface
- **Status:** ✅ Complete
- **File:** `lib/types/shelf.ts`
- **Description:** Remove ShelfType union, remove shelf_type from interfaces or make constant

---

## Phase 3: API Routes

### Task 3.1: Update shelf create route
- **Status:** ✅ Complete
- **File:** `app/api/shelf/create/route.ts`
- **Description:** Remove shelf_type parameter from create shelf API

### Task 3.2: Update shelf detail route
- **Status:** ✅ Complete
- **File:** `app/api/shelf/[shelfId]/route.ts`
- **Description:** Remove shelf_type from responses and logic

### Task 3.3: Update dashboard route
- **Status:** ✅ Complete
- **File:** `app/api/shelf/dashboard/route.ts` (via queries.ts update)
- **Description:** Remove shelf_type from dashboard response

### Task 3.4: Update share route
- **Status:** ✅ Complete
- **File:** `app/api/shelf/share/[shareToken]/route.ts`
- **Description:** Remove shelf_type from share API response

### Task 3.5: Update reorder route
- **Status:** ✅ Complete
- **File:** `app/api/shelf/[shelfId]/reorder/route.ts`
- **Description:** Remove top5 validation from reorder API

### Task 3.6: Update items route
- **Status:** ✅ Complete
- **File:** `app/api/items/route.ts`
- **Description:** Remove Top5 item limit validations

### Task 3.7: Update OG image route
- **Status:** ✅ Complete
- **File:** `app/api/og/[shareToken]/route.tsx`
- **Description:** Remove isTop5, trophy icons, and rank badges

---

## Phase 4: UI Pages

### Task 4.1: Simplify dashboard create form
- **Status:** ✅ Complete
- **File:** `app/dashboard/page.tsx`
- **Description:** Remove shelf type selection buttons and state, simplify form

### Task 4.2: Update shelf detail page
- **Status:** ✅ Complete
- **File:** `app/shelf/[shelfId]/page.tsx`
- **Description:** Remove Top5ShelfGrid import and conditional rendering

### Task 4.3: Update shelf edit page
- **Status:** ✅ Complete
- **File:** `app/shelf/[shelfId]/edit/page.tsx`
- **Description:** Remove Top5 components and logic

### Task 4.4: Update embed page
- **Status:** ✅ Complete
- **File:** `app/embed/[shareToken]/page.tsx`
- **Description:** Remove Top5ShelfGrid import and conditional rendering

### Task 4.5: Update public share page
- **Status:** ✅ Complete
- **Files:** `app/s/[shareToken]/page.tsx`, `app/s/[shareToken]/SharedShelfClient.tsx`
- **Description:** Remove shelf_type and Top5 components from shared shelf pages

---

## Phase 5: Component Cleanup

### Task 5.1: Delete Top 5 components
- **Status:** ✅ Complete
- **Files:** 
  - `components/shelf/Top5ShelfGrid.tsx` ❌ Deleted
  - `components/shelf/Top5ShelfGrid.test.tsx` ❌ Deleted
  - `components/shelf/Top5ItemCard.tsx` ❌ Deleted
  - `components/shelf/Top5ItemCard.test.tsx` ❌ Deleted
- **Description:** Remove all Top 5 specific components

### Task 5.2: Delete Top 5 utility
- **Status:** ✅ Complete
- **Files:**
  - `lib/utils/top5.ts` ❌ Deleted
  - `lib/utils/top5.test.ts` ❌ Deleted
- **Description:** Remove Top 5 utility functions and tests

---

## Phase 6: Documentation Cleanup

### Task 6.1: Update task lists
- **Status:** ✅ Complete
- **File:** `TASK_LIST_PODCAST_EPISODES.md`
- **Description:** Remove Top 5 references from podcast episodes task list

### Task 6.2: Deprecate old migration file
- **Status:** ✅ Complete
- **File:** `lib/db/MIGRATION_002_top5_shelf.sql`
- **Description:** Add deprecation notice to old migration file

### Task 6.3: Update Night Mode PRD
- **Status:** ✅ Complete
- **File:** `prds/NIGHT_MODE_PRD.md`
- **Description:** Remove Top5 component references

### Task 6.4: Update test mocks
- **Status:** ✅ Complete
- **File:** `test/utils/mocks.ts`
- **Description:** Remove ShelfType import and shelf_type from mock

---

## Phase 7: Testing & Verification

### Task 7.1: Run type check
- **Status:** ✅ Complete
- **Command:** `npm run build`
- **Description:** Verify no TypeScript errors - ✅ Compiled successfully

### Task 7.2: Run tests
- **Status:** ✅ Complete
- **Command:** `npm run test:run`
- **Description:** Verify all tests pass - ✅ 442 tests passed

### Task 7.3: Commit and push
- **Status:** ✅ Complete
- **Command:** `git commit` and `git push`
- **Description:** Changes committed and pushed to feature branch

---

## Progress Summary

| Phase | Tasks | Completed |
|-------|-------|-----------|
| 1. Database | 2 | 2 |
| 2. Types | 1 | 1 |
| 3. API Routes | 7 | 7 |
| 4. UI Pages | 5 | 5 |
| 5. Components | 2 | 2 |
| 6. Documentation | 4 | 4 |
| 7. Testing | 3 | 3 |
| **Total** | **24** | **24** |

---

## ✅ Feature Complete

All tasks completed. Branch `feature/remove-top5-shelves` is ready for PR review.

**Summary of changes:**
- Deleted 1,412 lines of code (net -1,059 lines after additions)
- Removed 6 files (4 components, 2 utilities)
- Updated 22 files across database, types, API routes, UI pages, and documentation
- All 442 tests passing
- Build compiles successfully
