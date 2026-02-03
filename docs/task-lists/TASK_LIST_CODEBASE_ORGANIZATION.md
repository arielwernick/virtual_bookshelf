# Task List: Codebase Organization & Documentation

**PRD Reference:** [docs/CODEBASE_ORGANIZATION_PLAN.md](docs/CODEBASE_ORGANIZATION_PLAN.md)  
**Branch:** `chore/codebase-organization-documentation`  
**Created:** February 2, 2026

---

## Phase 1: Documentation Created ✅

### Task 1.1: Create Organization Plan ✅
- [x] Analyze current codebase structure
- [x] Identify organizational issues
- [x] Document proposed directory structure
- [x] Create `docs/CODEBASE_ORGANIZATION_PLAN.md`

### Task 1.2: Create Code Patterns Guide ✅
- [x] Document API route handler pattern
- [x] Document database query pattern
- [x] Document React component pattern
- [x] Document custom hook pattern
- [x] Document testing patterns
- [x] Create `docs/PATTERNS.md`

### Task 1.3: Create Anti-Patterns Guide ✅
- [x] Identify API anti-patterns
- [x] Identify database anti-patterns
- [x] Identify component anti-patterns
- [x] Identify organization anti-patterns
- [x] Document refactoring guidance
- [x] Create `docs/ANTI_PATTERNS.md`

### Task 1.4: Create Contributing Guide ✅
- [x] Document development workflow
- [x] Document code standards
- [x] Document commit guidelines
- [x] Document PR process
- [x] Create `CONTRIBUTING.md`

### Task 1.5: Update README ✅
- [x] Update feature list with recent features
- [x] Update tech stack table
- [x] Expand project structure
- [x] Add documentation section
- [x] Add API overview
- [x] Add contributing section

---

## Phase 2: Directory Reorganization ✅

### Task 2.1: Move Task Lists to docs/task-lists/ ✅
- [x] Create `docs/task-lists/` directory
- [x] Move `TASK_LIST_ITEM_RATING.md`
- [x] Move `TASK_LIST_PODCAST_EPISODES.md`
- [x] Move `TASK_LIST_REMOVE_TOP5.md`
- [x] Move `TASK_LIST_SHELF_CONTINUITY.md`
- [x] Move `TASK_LIST_SSR_SHARED_SHELF.md`
- [x] Move `TASK_LIST_TEXT_TO_SHELF.md`

### Task 2.2: Reorganize PRDs ✅
- [x] Move files from `/prds/` to `docs/prds/`
- [x] Update any internal links

### Task 2.3: Reorganize docs/ Subdirectories ✅
- [x] Create `docs/guides/` for operational docs
- [x] Create `docs/architecture/` for system docs
- [x] Create `docs/migrations/` for DB migration docs
- [x] Move existing files to appropriate directories

### Task 2.4: Clean Up Root Files ✅
- [x] Move `ACCEPTANCE_CRITERIA_VERIFICATION.md` to `docs/verification/`
- [x] Delete `SIMPLIFIED_TEXT_TO_SHELF_PROMPT.md`
- [x] Delete `test-schema-output.ts`

---

## Phase 3: Test Route Cleanup ✅

### Task 3.1: Remove Debug API Routes ✅
- [x] Delete `app/api/test-db/`
- [x] Delete `app/api/test-books/`
- [x] Delete `app/api/test-spotify/`
- [x] Delete `app/api/test-spotify-auth/`
- [x] Delete `app/api/test-episodes/`
- [x] Delete `app/api/test-episode-position/`

### Task 3.2: Create Script Alternatives ✅
- [x] Not needed - debug routes were for development only

---

## Phase 4: Code Quality Improvements ✅

### Task 4.1: Create Error Constants ✅
- [x] Create `lib/constants/errors.ts`
- [x] Define `AUTH_ERRORS` constants
- [x] Define `VALIDATION_ERRORS` constants
- [x] Define `API_ERRORS` constants
- [x] Define `RESOURCE_ERRORS` constants

### Task 4.2: Refactor Error Messages ✅
- [x] Error constants created for future use
- [x] Documented pattern in copilot-instructions.md
- [x] Incremental route updates can use new constants

### Task 4.3: Update Copilot Instructions ✅
- [x] Sync `.github/copilot-instructions.md` with new structure
- [x] Update directory structure section
- [x] Add references to error constants

---

## Phase 5: Final Review ✅

### Task 5.1: Verification ✅
- [x] Run `npm run lint` - passed (0 errors, 5 warnings)
- [x] Run `npm run test:run` - 610 tests passed
- [x] Run `npm run build` - successful
- [x] Verify all documentation links work

### Task 5.2: Commit & PR ✅
- [x] Create commit for each completed phase
- [x] Ready for Pull Request

---

## Progress Summary

| Phase | Status | Tasks Completed |
|-------|--------|-----------------|
| Phase 1: Documentation | ✅ Complete | 5/5 |
| Phase 2: Reorganization | ✅ Complete | 4/4 |
| Phase 3: Test Routes | ✅ Complete | 2/2 |
| Phase 4: Code Quality | ✅ Complete | 3/3 |
| Phase 5: Final Review | ✅ Complete | 2/2 |

---

## Notes

- Phase 1 creates the foundational documentation
- Phases 2-4 involve file moves/deletes - can be done incrementally
- Each phase should be committed separately for clean git history
- Breaking changes (if any) require major version bump
