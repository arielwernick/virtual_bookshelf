# Task List: Unit Testing Infrastructure

**PRD:** `tasks/UNIT_TESTING_PRD.md`  
**Created:** November 26, 2025  
**Status:** ✅ Complete

---

## Phase 1: Infrastructure Setup

### 1.1 Install Testing Dependencies
- [x] Add Vitest and related packages to devDependencies
- **Packages:** `vitest`, `@vitejs/plugin-react`, `jsdom`, `@vitest/coverage-v8`
- **Packages:** `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `@testing-library/dom`
- **Verify:** ✅ `npm install` succeeds without errors

### 1.2 Create Vitest Configuration
- [x] Create `vitest.config.ts` at project root
- Configure jsdom environment, path aliases, coverage settings
- **Verify:** ✅ `npx vitest --version` runs without config errors

### 1.3 Create Test Setup File
- [x] Create `test/setup.ts` with global mocks
- Mock `next/headers` (cookies function)
- Set test environment variables
- Import jest-dom matchers
- **Verify:** ✅ Setup file imports without errors

### 1.4 Add NPM Scripts
- [x] Add test scripts to `package.json`
- Scripts: `test`, `test:run`, `test:ci`, `test:ui`
- **Verify:** ✅ `npm test` starts Vitest

### 1.5 Create Database Mock
- [x] Create `__mocks__/lib/db/client.ts`
- Export mock `sql` function that can be controlled in tests
- **Verify:** ✅ Mock can be imported and configured

---

## Phase 2: Utility Function Tests

### 2.1 Validation Tests - Username & Email
- [x] Create `lib/utils/validation.test.ts`
- Test `validateUsername`: valid, empty, too short, too long, invalid chars, normalization
- Test `validateEmail`: valid, empty, too long, invalid format, normalization
- **Verify:** ✅ All tests pass

### 2.2 Validation Tests - Password & Item Type
- [x] Add tests for `validatePassword` and `validateItemType`
- Test `validatePassword`: valid, empty, too short, too long
- Test `validateItemType`: valid types (book, podcast, music), invalid type
- **Verify:** ✅ All tests pass

### 2.3 Validation Tests - Text, URL, Notes
- [x] Add tests for `validateText`, `validateUrl`, `validateNotes`
- Test `validateText`: valid, empty, too long, custom field name
- Test `validateUrl`: valid http/https, empty (optional), invalid protocol, invalid format
- Test `validateNotes`: valid, empty (optional), too long
- **Verify:** ✅ All tests pass

### 2.4 Session Utility Tests
- [x] Create `lib/utils/session.test.ts`
- Test `createSession`: generates valid JWT
- Test `verifySession`: decodes valid token, returns null for invalid
- Test token expiration handling
- **Verify:** ✅ All tests pass (uses Node environment for jose compatibility)

---

## Phase 3: Database Query Tests

### 3.1 User Query Tests
- [x] Create `lib/db/queries.test.ts`
- Test `createUser`: returns created user
- Test `getUserByEmail`: found and not found cases
- Test `getUserByUsername`: found and not found cases
- Test `getUserById`: found and not found cases
- Test `getUserByGoogleId`: found and not found cases
- **Verify:** ✅ All tests pass with mocked database

### 3.2 Shelf Query Tests
- [x] Add shelf query tests to `lib/db/queries.test.ts`
- Test `createShelf`: returns created shelf
- Test `getShelfById`: found and not found
- Test `getShelfsByUserId`: returns array of shelves
- Test `updateShelf`: updates name, description, is_public
- Test `deleteShelf`: returns true/false
- **Verify:** ✅ All tests pass

### 3.3 Item Query Tests
- [x] Add item query tests to `lib/db/queries.test.ts`
- Test `createItem`: returns created item with order_index
- Test `getItemsByShelfId`: returns ordered items
- Test `getItemById`: found and not found
- Test `updateItem`: updates various fields
- Test `deleteItem`: returns true/false
- Test `getNextOrderIndex`: returns correct index
- **Verify:** ✅ All tests pass

---

## Phase 4: API Route Tests

### 4.1 Items API Test Setup
- [x] Create `app/api/items/route.test.ts`
- Create helper function for mock requests
- Set up mocks for session and queries
- **Verify:** ✅ Test file structure is correct

### 4.2 Items POST Route Tests
- [x] Test authentication check (401 when not logged in)
- [x] Test shelf_id validation (400 when missing)
- [x] Test shelf ownership check (403 when not owner)
- [x] Test shelf not found (404)
- [x] Test validation errors (400 for invalid type, title, creator)
- [x] Test successful item creation (200)
- **Verify:** ✅ All tests pass

### 4.3 Auth Login Route Tests
- [x] Create `app/api/auth/login/route.test.ts`
- Test missing credentials (400)
- Test user not found (401)
- Test wrong password (401)
- Test successful login (200 with session cookie)
- **Verify:** ✅ All tests pass

### 4.4 Auth Signup Route Tests
- [x] Create `app/api/auth/signup/route.test.ts`
- Test missing fields (400)
- Test validation errors (400)
- Test duplicate username (409)
- Test duplicate email (409)
- Test successful signup (201)
- **Verify:** ✅ All tests pass

---

## Phase 5: Component Tests

### 5.1 Component Test Setup
- [x] Create test utilities for rendering with providers if needed
- [x] Verify React Testing Library works with React 19
- **Verify:** ✅ Basic component render test works

### 5.2 AddItemForm Component Tests
- [x] Create `components/shelf/AddItemForm.test.tsx`
- Test renders type selector buttons
- Test type button selection changes state
- Test manual mode toggle
- Test form validation (requires title and creator)
- Test successful form submission
- Test search functionality (mock fetch)
- **Verify:** ✅ All tests pass (20 tests)

### 5.3 ItemCard Component Tests
- [x] Create `components/shelf/ItemCard.test.tsx`
- Test renders item title and creator
- Test renders image when provided
- Test renders different item types correctly
- Test click interaction
- **Verify:** ✅ All tests pass (18 tests)

### 5.4 Modal Component Tests
- [x] Create `components/ui/Modal.test.tsx`
- Test renders children when open
- Test does not render when closed
- Test calls onClose when clicking backdrop
- Test calls onClose when pressing Escape
- **Verify:** ✅ All tests pass (11 tests)

---

## Phase 6: CI/CD Integration

### 6.1 Create GitHub Actions Workflow
- [x] Create `.github/workflows/test.yml`
- Configure Node.js 20 setup
- Run `npm ci` and `npm run test:ci`
- **Verify:** ✅ Workflow file created with test, lint, and build jobs

### 6.2 Configure Coverage Reporting
- [x] Add coverage thresholds to vitest config (70% minimum)
- [x] Configure coverage output for CI
- **Verify:** ✅ `npm run test:ci` generates coverage report

### 6.3 Verify CI Pipeline
- [ ] Push branch and verify GitHub Actions runs
- [ ] Confirm tests pass in CI environment
- **Verify:** ⏳ Awaiting push to GitHub

---

## Progress Tracking

| Phase | Tasks | Completed | Status |
|-------|-------|-----------|--------|
| 1. Infrastructure | 5 | 5 | ✅ Complete |
| 2. Utility Tests | 4 | 4 | ✅ Complete |
| 3. Database Tests | 3 | 3 | ✅ Complete |
| 4. API Route Tests | 4 | 4 | ✅ Complete |
| 5. Component Tests | 4 | 4 | ✅ Complete |
| 6. CI/CD | 3 | 2 | ⏳ Awaiting Push |

**Total:** 23 tasks | **Completed:** 22 | **Remaining:** 1 (CI verification)

---

## Test Summary

**Total Tests:** 204  
**Test Files:** 9  
**All Tests Passing:** ✅

| Test File | Tests |
|-----------|-------|
| `lib/utils/validation.test.ts` | 59 |
| `lib/db/queries.test.ts` | 46 |
| `components/shelf/AddItemForm.test.tsx` | 20 |
| `components/shelf/ItemCard.test.tsx` | 18 |
| `app/api/auth/signup/route.test.ts` | 14 |
| `app/api/items/route.test.ts` | 13 |
| `lib/utils/session.test.ts` | 13 |
| `components/ui/Modal.test.tsx` | 11 |
| `app/api/auth/login/route.test.ts` | 10 |

---

## Files Created

- `vitest.config.ts` - Test configuration
- `test/setup.ts` - Global mocks and polyfills
- `__mocks__/lib/db/client.ts` - Database mock
- `lib/utils/validation.test.ts` - Validation tests
- `lib/utils/session.test.ts` - Session/JWT tests
- `lib/db/queries.test.ts` - Database query tests
- `app/api/items/route.test.ts` - Items API tests
- `app/api/auth/login/route.test.ts` - Login API tests
- `app/api/auth/signup/route.test.ts` - Signup API tests
- `components/ui/Modal.test.tsx` - Modal component tests
- `components/shelf/ItemCard.test.tsx` - ItemCard tests
- `components/shelf/AddItemForm.test.tsx` - AddItemForm tests
- `.github/workflows/test.yml` - CI/CD workflow

---

## Notes

- Tests should be run frequently during development
- Each task should be committed separately for clear history
- Coverage threshold set to 70% for critical paths
- Focus on testing behavior, not implementation details
- Session tests use Node.js environment for jose JWT library compatibility
