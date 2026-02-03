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

## Phase 2: Directory Reorganization (To Do)

### Task 2.1: Move Task Lists to docs/task-lists/
- [ ] Create `docs/task-lists/` directory
- [ ] Move `TASK_LIST_ITEM_RATING.md`
- [ ] Move `TASK_LIST_PODCAST_EPISODES.md`
- [ ] Move `TASK_LIST_REMOVE_TOP5.md`
- [ ] Move `TASK_LIST_SHELF_CONTINUITY.md`
- [ ] Move `TASK_LIST_SSR_SHARED_SHELF.md`
- [ ] Move `TASK_LIST_TEXT_TO_SHELF.md`

### Task 2.2: Reorganize PRDs
- [ ] Move files from `/prds/` to `docs/prds/`
- [ ] Update any internal links

### Task 2.3: Reorganize docs/ Subdirectories
- [ ] Create `docs/guides/` for operational docs
- [ ] Create `docs/architecture/` for system docs
- [ ] Create `docs/migrations/` for DB migration docs
- [ ] Create `docs/security/` for security docs
- [ ] Move existing files to appropriate directories

### Task 2.4: Clean Up Root Files
- [ ] Move `ACCEPTANCE_CRITERIA_VERIFICATION.md` to `docs/verification/`
- [ ] Archive or delete `SIMPLIFIED_TEXT_TO_SHELF_PROMPT.md`
- [ ] Delete `test-schema-output.ts`

---

## Phase 3: Test Route Cleanup (To Do)

### Task 3.1: Remove Debug API Routes
- [ ] Delete `app/api/test-db/`
- [ ] Delete `app/api/test-books/`
- [ ] Delete `app/api/test-spotify/`
- [ ] Delete `app/api/test-spotify-auth/`
- [ ] Delete `app/api/test-episodes/`
- [ ] Delete `app/api/test-episode-position/`

### Task 3.2: Create Script Alternatives (if needed)
- [ ] Create `scripts/test-db-connection.ts`
- [ ] Document how to run scripts in CONTRIBUTING.md

---

## Phase 4: Code Quality Improvements (To Do)

### Task 4.1: Create Error Constants
- [ ] Create `lib/constants/errors.ts`
- [ ] Define `AUTH_ERRORS` constants
- [ ] Define `VALIDATION_ERRORS` constants
- [ ] Define `API_ERRORS` constants

### Task 4.2: Refactor Error Messages
- [ ] Update auth routes to use error constants
- [ ] Update item routes to use error constants
- [ ] Update shelf routes to use error constants

### Task 4.3: Update Copilot Instructions
- [ ] Sync `.github/copilot-instructions.md` with new structure
- [ ] Update directory structure section
- [ ] Add references to new documentation

---

## Phase 5: Final Review (To Do)

### Task 5.1: Verification
- [ ] Run `npm run lint`
- [ ] Run `npm run test:run`
- [ ] Run `npm run build`
- [ ] Verify all documentation links work

### Task 5.2: Commit & PR
- [ ] Create commit for each completed phase
- [ ] Create Pull Request
- [ ] Request review

---

## Progress Summary

| Phase | Status | Tasks Completed |
|-------|--------|-----------------|
| Phase 1: Documentation | ✅ Complete | 5/5 |
| Phase 2: Reorganization | 🔲 Not Started | 0/4 |
| Phase 3: Test Routes | 🔲 Not Started | 0/2 |
| Phase 4: Code Quality | 🔲 Not Started | 0/3 |
| Phase 5: Final Review | 🔲 Not Started | 0/2 |

---

## Notes

- Phase 1 creates the foundational documentation
- Phases 2-4 involve file moves/deletes - can be done incrementally
- Each phase should be committed separately for clean git history
- Breaking changes (if any) require major version bump
