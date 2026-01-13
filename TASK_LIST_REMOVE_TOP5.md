# Task List: Remove Top 5 Shelf Feature

**GitHub Issue:** #110  
**Branch:** `feature/remove-top5-shelves`  
**PRD:** [REMOVE_TOP5_SHELVES_PRD.md](./prds/REMOVE_TOP5_SHELVES_PRD.md)

---

## Phase 1: Database Migration

### Task 1.1: Create database migration file
- **Status:** ⬜ Not Started
- **File:** `lib/db/MIGRATION_004_remove_top5.sql`
- **Description:** Create SQL migration to convert all top5 shelves to standard and update constraint

### Task 1.2: Update schema.sql
- **Status:** ⬜ Not Started
- **File:** `lib/db/schema.sql`
- **Description:** Update CHECK constraint to only allow 'standard' shelf type

---

## Phase 2: TypeScript Types

### Task 2.1: Remove ShelfType and update Shelf interface
- **Status:** ⬜ Not Started
- **File:** `lib/types/shelf.ts`
- **Description:** Remove ShelfType union, remove shelf_type from interfaces or make constant

---

## Phase 3: API Routes

### Task 3.1: Update shelf create route
- **Status:** ⬜ Not Started
- **File:** `app/api/shelf/route.ts`
- **Description:** Remove shelf_type parameter from create shelf API

### Task 3.2: Update shelf detail route
- **Status:** ⬜ Not Started
- **File:** `app/api/shelf/[shelfId]/route.ts`
- **Description:** Remove shelf_type from responses and logic

### Task 3.3: Update dashboard route
- **Status:** ⬜ Not Started
- **File:** `app/api/shelf/dashboard/route.ts`
- **Description:** Remove shelf_type from dashboard response

---

## Phase 4: UI Pages

### Task 4.1: Simplify dashboard create form
- **Status:** ⬜ Not Started
- **File:** `app/dashboard/page.tsx`
- **Description:** Remove shelf type selection buttons and state, simplify form

### Task 4.2: Update shelf detail page
- **Status:** ⬜ Not Started
- **File:** `app/shelf/[shelfId]/page.tsx`
- **Description:** Remove Top5ShelfGrid import and conditional rendering

### Task 4.3: Update embed page
- **Status:** ⬜ Not Started
- **File:** `app/embed/[shareToken]/page.tsx`
- **Description:** Remove Top5ShelfGrid import and conditional rendering

### Task 4.4: Update public share page
- **Status:** ⬜ Not Started
- **File:** `app/s/[shareToken]/page.tsx`
- **Description:** Check and remove any Top 5 specific rendering

---

## Phase 5: Component Cleanup

### Task 5.1: Delete Top 5 components
- **Status:** ⬜ Not Started
- **Files:** 
  - `components/shelf/Top5ShelfGrid.tsx`
  - `components/shelf/Top5ShelfGrid.test.tsx`
  - `components/shelf/Top5ItemCard.tsx`
  - `components/shelf/Top5ItemCard.test.tsx`
- **Description:** Remove all Top 5 specific components

---

## Phase 6: Documentation Cleanup

### Task 6.1: Update task lists
- **Status:** ⬜ Not Started
- **File:** `TASK_LIST_PODCAST_EPISODES.md`
- **Description:** Remove Top 5 references from podcast episodes task list

### Task 6.2: Deprecate old migration file
- **Status:** ⬜ Not Started
- **File:** `lib/db/MIGRATION_002_top5_shelf.sql`
- **Description:** Add deprecation notice to old migration file

---

## Phase 7: Testing & Verification

### Task 7.1: Run type check
- **Status:** ⬜ Not Started
- **Command:** `npm run build`
- **Description:** Verify no TypeScript errors

### Task 7.2: Run tests
- **Status:** ⬜ Not Started
- **Command:** `npm run test:run`
- **Description:** Verify all tests pass

### Task 7.3: Run linter
- **Status:** ⬜ Not Started
- **Command:** `npm run lint`
- **Description:** Verify no linting errors

---

## Progress Summary

| Phase | Tasks | Completed |
|-------|-------|-----------|
| 1. Database | 2 | 0 |
| 2. Types | 1 | 0 |
| 3. API Routes | 3 | 0 |
| 4. UI Pages | 4 | 0 |
| 5. Components | 1 | 0 |
| 6. Documentation | 2 | 0 |
| 7. Testing | 3 | 0 |
| **Total** | **16** | **0** |
