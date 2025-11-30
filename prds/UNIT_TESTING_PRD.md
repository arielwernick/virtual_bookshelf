# PRD: Unit Testing Infrastructure for Virtual Bookshelf

## Document Information
- **Author:** Ryan (AI Agent)
- **Created:** November 26, 2025
- **Status:** Draft
- **Version:** 1.0

---

## 1. Overview

### 1.1 Problem Statement
The Virtual Bookshelf project currently has no automated testing infrastructure. As the codebase grows with features like Google OAuth, shelf management, and item CRUD operations, the risk of regressions increases. Manual testing is time-consuming and error-prone, especially for edge cases in authentication, database operations, and API validation.

### 1.2 Proposed Solution
Implement a comprehensive unit testing infrastructure using **Vitest** as the testing framework, with **React Testing Library** for component testing. This includes test utilities for mocking the Neon PostgreSQL database, JWT session handling, and external APIs (Google Books, Spotify).

### 1.3 Goals
1. Establish a testing foundation that catches bugs before deployment
2. Enable confident refactoring with regression protection
3. Document expected behavior through test specifications
4. Integrate with CI/CD for automated quality gates
5. Maintain fast test execution for developer productivity

### 1.4 Non-Goals
- End-to-end (E2E) testing with Playwright/Cypress (future phase)
- Performance/load testing
- Visual regression testing
- 100% code coverage (aim for critical paths)

---

## 2. Target Users

| User | Need |
|------|------|
| **Developer (you)** | Fast feedback loop, easy test writing, clear failure messages |
| **CI/CD Pipeline** | Reliable automated checks before merge/deploy |
| **Future Contributors** | Understandable test patterns to follow |

---

## 3. Technical Decisions

### 3.1 Testing Framework: **Vitest** (over Jest)

**Rationale:**
| Factor | Vitest | Jest |
|--------|--------|------|
| **Speed** | Native ESM, faster startup | CJS-first, slower with ESM |
| **Next.js Compatibility** | Better ESM/TypeScript support | Requires extensive config |
| **React 19** | Works out of the box | May have compatibility issues |
| **Configuration** | Reuses Vite config patterns | Separate config ecosystem |
| **HMR for Tests** | Built-in watch mode with HMR | Standard watch mode |
| **Community** | Growing, modern | Mature, but legacy patterns |

**Decision:** Use Vitest for its ESM-native design, speed, and excellent TypeScript support.

### 3.2 Database Mocking Strategy

**Challenge:** The `@neondatabase/serverless` client uses tagged template literals (`sql\`...\``) which makes traditional mocking complex.

**Solution: Module Mocking with Factory Pattern**

```typescript
// __mocks__/lib/db/client.ts
export const mockSql = vi.fn();
export const sql = mockSql;

// In tests
import { mockSql } from '@/__mocks__/lib/db/client';

beforeEach(() => {
  mockSql.mockReset();
});

test('creates user', async () => {
  mockSql.mockResolvedValueOnce([{ id: '1', email: 'test@example.com' }]);
  // ... test code
});
```

**Benefits:**
- No actual database connection needed
- Full control over query responses
- Tests run in isolation
- Can simulate errors and edge cases

### 3.3 Component Testing: **React Testing Library**

**Approach:** Test components from the user's perspective (what they see and interact with), not implementation details.

**Key Libraries:**
- `@testing-library/react` - Core testing utilities
- `@testing-library/user-event` - Realistic user interactions
- `@testing-library/jest-dom` - Extended DOM matchers

### 3.4 Test File Organization: **Colocated Tests**

**Structure:**
```
lib/
  db/
    queries.ts
    queries.test.ts        # Colocated unit tests
  utils/
    validation.ts
    validation.test.ts
    session.ts
    session.test.ts

app/
  api/
    items/
      route.ts
      route.test.ts        # API route tests

components/
  shelf/
    AddItemForm.tsx
    AddItemForm.test.tsx   # Component tests
    ItemCard.tsx
    ItemCard.test.tsx

__mocks__/                  # Shared mocks at root
  lib/
    db/
      client.ts            # Database mock
  next/
    headers.ts             # cookies() mock
```

**Rationale:**
- Tests live next to the code they test (easier navigation)
- Clear ownership and discoverability
- Shared mocks in `__mocks__/` following Vitest conventions
- No separate `__tests__` folder to maintain

### 3.5 API Route Testing Strategy

**Challenge:** Next.js App Router route handlers use `NextRequest`/`NextResponse` and server-side features like `cookies()`.

**Solution:**

```typescript
// Testing utilities for API routes
import { NextRequest } from 'next/server';

export function createMockRequest(
  url: string,
  options: {
    method?: string;
    body?: object;
    headers?: Record<string, string>;
  } = {}
): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method: options.method || 'GET',
    body: options.body ? JSON.stringify(options.body) : undefined,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}
```

### 3.6 Session/Auth Test Utilities

**Mock Session Helper:**

```typescript
// test/utils/session.ts
import { vi } from 'vitest';
import * as sessionModule from '@/lib/utils/session';

export function mockAuthenticatedUser(userData: {
  userId: string;
  username: string | null;
  email?: string;
}) {
  vi.spyOn(sessionModule, 'getSession').mockResolvedValue(userData);
}

export function mockUnauthenticated() {
  vi.spyOn(sessionModule, 'getSession').mockResolvedValue(null);
}
```

---

## 4. Test Coverage Priorities

### 4.1 Critical (Must Have)

| Area | Files | Why Critical |
|------|-------|--------------|
| **Validation** | `lib/utils/validation.ts` | Guards all user input |
| **Session** | `lib/utils/session.ts` | Auth security |
| **User Queries** | `lib/db/queries.ts` (user functions) | Auth data integrity |
| **Items API** | `app/api/items/route.ts` | Core CRUD operations |
| **Auth Routes** | `app/api/auth/login/route.ts` | Security-sensitive |

### 4.2 High Priority

| Area | Files | Why Important |
|------|-------|---------------|
| **Shelf Queries** | `lib/db/queries.ts` (shelf functions) | Data organization |
| **Shelf API** | `app/api/shelf/*/route.ts` | User-facing features |
| **AddItemForm** | `components/shelf/AddItemForm.tsx` | Complex user flows |

### 4.3 Medium Priority

| Area | Files | Rationale |
|------|-------|-----------|
| **External APIs** | `lib/api/googleBooks.ts`, `lib/api/spotify.ts` | Third-party integration |
| **UI Components** | `ItemCard.tsx`, `ShelfGrid.tsx` | Visual correctness |
| **Password Utils** | `lib/utils/password.ts` | Security utility |

---

## 5. CI/CD Integration

### 5.1 GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main, feature/*]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:ci
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
```

### 5.2 Vercel Integration

Tests will run:
1. **Pre-push:** Local via `npm test`
2. **PR Creation:** GitHub Actions
3. **Pre-deploy:** GitHub Actions (required check)

Vercel deployment will be blocked if tests fail via GitHub branch protection rules.

---

## 6. Configuration Files

### 6.1 `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      exclude: [
        'node_modules',
        '.next',
        '**/*.test.{ts,tsx}',
        'test/**',
        '**/*.d.ts',
      ],
    },
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

### 6.2 `test/setup.ts`

```typescript
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock Next.js headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

// Mock environment variables
process.env.SESSION_SECRET = 'test-secret-key-for-testing';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
```

---

## 7. Package Dependencies

### 7.1 Dev Dependencies to Add

```json
{
  "devDependencies": {
    "vitest": "^2.1.0",
    "@vitejs/plugin-react": "^4.3.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/dom": "^10.0.0",
    "jsdom": "^25.0.0",
    "@vitest/coverage-v8": "^2.1.0"
  }
}
```

### 7.2 NPM Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:ci": "vitest run --coverage",
    "test:watch": "vitest --watch"
  }
}
```

---

## 8. Example Test Patterns

### 8.1 Validation Function Test

```typescript
// lib/utils/validation.test.ts
import { describe, it, expect } from 'vitest';
import { validateUsername, validateEmail, validatePassword } from './validation';

describe('validateUsername', () => {
  it('accepts valid username', () => {
    const result = validateUsername('john_doe');
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe('john_doe');
  });

  it('rejects empty username', () => {
    const result = validateUsername('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Username cannot be empty');
  });

  it('normalizes to lowercase', () => {
    const result = validateUsername('JohnDoe');
    expect(result.normalized).toBe('johndoe');
  });

  it('rejects username with spaces', () => {
    const result = validateUsername('john doe');
    expect(result.valid).toBe(false);
  });
});
```

### 8.2 Database Query Test

```typescript
// lib/db/queries.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserByEmail, createUser } from './queries';

// Mock the database client
vi.mock('./client', () => ({
  sql: vi.fn(),
}));

import { sql } from './client';

describe('getUserByEmail', () => {
  beforeEach(() => {
    vi.mocked(sql).mockReset();
  });

  it('returns user when found', async () => {
    const mockUser = { id: '1', email: 'test@example.com', username: 'testuser' };
    vi.mocked(sql).mockResolvedValueOnce([mockUser]);

    const result = await getUserByEmail('test@example.com');
    expect(result).toEqual(mockUser);
  });

  it('returns null when user not found', async () => {
    vi.mocked(sql).mockResolvedValueOnce([]);

    const result = await getUserByEmail('notfound@example.com');
    expect(result).toBeNull();
  });
});
```

### 8.3 API Route Test

```typescript
// app/api/items/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/utils/session');
vi.mock('@/lib/db/queries');

import { getSession } from '@/lib/utils/session';
import { getShelfById, createItem, getNextOrderIndex } from '@/lib/db/queries';

function createRequest(body: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/items', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/items', () => {
  beforeEach(() => {
    vi.mocked(getSession).mockReset();
    vi.mocked(getShelfById).mockReset();
    vi.mocked(createItem).mockReset();
    vi.mocked(getNextOrderIndex).mockReset();
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const req = createRequest({ shelf_id: '1', type: 'book', title: 'Test', creator: 'Author' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('Not authenticated');
  });

  it('returns 404 when shelf not found', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'user1', username: 'test' });
    vi.mocked(getShelfById).mockResolvedValue(null);

    const req = createRequest({ shelf_id: 'invalid', type: 'book', title: 'Test', creator: 'Author' });
    const res = await POST(req);

    expect(res.status).toBe(404);
  });

  it('creates item successfully', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'user1', username: 'test' });
    vi.mocked(getShelfById).mockResolvedValue({ id: 'shelf1', user_id: 'user1', name: 'My Shelf' });
    vi.mocked(getNextOrderIndex).mockResolvedValue(0);
    vi.mocked(createItem).mockResolvedValue({
      id: 'item1',
      shelf_id: 'shelf1',
      type: 'book',
      title: 'Test Book',
      creator: 'Test Author',
    });

    const req = createRequest({
      shelf_id: 'shelf1',
      type: 'book',
      title: 'Test Book',
      creator: 'Test Author',
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.title).toBe('Test Book');
  });
});
```

### 8.4 Component Test

```typescript
// components/shelf/AddItemForm.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddItemForm } from './AddItemForm';

describe('AddItemForm', () => {
  const mockOnItemAdded = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  it('renders type selector buttons', () => {
    render(
      <AddItemForm
        shelfId="shelf1"
        onItemAdded={mockOnItemAdded}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByRole('button', { name: 'Book' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Podcast' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Music' })).toBeInTheDocument();
  });

  it('switches to manual mode', async () => {
    const user = userEvent.setup();
    render(
      <AddItemForm
        shelfId="shelf1"
        onItemAdded={mockOnItemAdded}
        onClose={mockOnClose}
      />
    );

    await user.click(screen.getByText('Or add manually →'));
    
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/author/i)).toBeInTheDocument();
  });

  it('submits manual entry form', async () => {
    const user = userEvent.setup();
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    render(
      <AddItemForm
        shelfId="shelf1"
        onItemAdded={mockOnItemAdded}
        onClose={mockOnClose}
      />
    );

    await user.click(screen.getByText('Or add manually →'));
    await user.type(screen.getByLabelText(/title/i), 'Test Book');
    await user.type(screen.getByLabelText(/author/i), 'Test Author');
    await user.click(screen.getByRole('button', { name: /add to shelf/i }));

    await waitFor(() => {
      expect(mockOnItemAdded).toHaveBeenCalled();
    });
  });
});
```

---

## 9. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Test Pass Rate | 100% | CI pipeline status |
| Critical Path Coverage | >80% | Vitest coverage report |
| Test Execution Time | <30s | CI job duration |
| Flaky Test Rate | <1% | CI failure analysis |

---

## 10. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Database mock complexity | Tests don't reflect real behavior | Careful mock design, integration tests later |
| Next.js server component testing | Limited testability | Focus on route handlers and client components |
| Test maintenance burden | Slow development | Write focused tests, avoid over-mocking |
| ESM compatibility issues | Build failures | Use Vitest's native ESM support |

---

## 11. Future Considerations

1. **Integration Tests:** Test database queries against a real test database (Neon branching)
2. **E2E Tests:** Add Playwright for critical user journeys
3. **Visual Regression:** Implement screenshot testing for UI components
4. **Performance Testing:** Benchmark API response times

---

## 12. Approval

- [ ] PRD reviewed and approved
- [ ] Technical decisions validated
- [ ] Ready for task breakdown

---

## Questions for Clarification

1. **Coverage Threshold:** Should we enforce a minimum coverage percentage in CI (e.g., 70%)?
2. **Test Database:** Should we set up Neon branching for integration tests in a future phase?
3. **Pre-commit Hooks:** Want to add Husky to run tests before commits?
4. **Existing Tests:** Are there any test files or patterns you've already started?

---

*Ready for task list generation when approved.*
