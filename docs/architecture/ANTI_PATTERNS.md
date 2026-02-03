# Anti-Patterns Guide

This document identifies common anti-patterns found in the Virtual Bookshelf codebase and provides guidance on how to refactor them. Use this as a reference when reviewing code or implementing new features.

---

## Table of Contents

1. [API Anti-Patterns](#api-anti-patterns)
2. [Database Anti-Patterns](#database-anti-patterns)
3. [Component Anti-Patterns](#component-anti-patterns)
4. [Testing Anti-Patterns](#testing-anti-patterns)
5. [Organization Anti-Patterns](#organization-anti-patterns)
6. [TypeScript Anti-Patterns](#typescript-anti-patterns)
7. [Security Anti-Patterns](#security-anti-patterns)
8. [Performance Anti-Patterns](#performance-anti-patterns)

---

## API Anti-Patterns

### ❌ AP-1: Inline Error Messages

**Problem:** Hardcoded error strings scattered throughout API routes make maintenance difficult and translation impossible.

```typescript
// ❌ BAD
return NextResponse.json(
  { success: false, error: 'Invalid username or password' },
  { status: 401 }
);

return NextResponse.json(
  { success: false, error: 'This account uses Google authentication' },
  { status: 401 }
);
```

**Solution:** Centralize error messages in a constants file.

```typescript
// ✅ GOOD: lib/constants/errors.ts
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid username or password',
  NOT_AUTHENTICATED: 'Not authenticated',
  GOOGLE_ONLY_ACCOUNT: 'This account uses Google authentication. Please sign in with Google.',
  ACCOUNT_NOT_FOUND: 'Account not found',
} as const;

export const VALIDATION_ERRORS = {
  REQUIRED_FIELD: (field: string) => `${field} is required`,
  INVALID_FORMAT: (field: string) => `Invalid ${field} format`,
} as const;

// Usage in route
import { AUTH_ERRORS } from '@/lib/constants/errors';

return NextResponse.json(
  { success: false, error: AUTH_ERRORS.INVALID_CREDENTIALS },
  { status: 401 }
);
```

---

### ❌ AP-2: Test/Debug Routes in Production

**Problem:** Debug endpoints exposed in production create security risks and clutter.

```typescript
// ❌ BAD: app/api/test-db/route.ts
export async function GET() {
  const isConnected = await testConnection();
  return NextResponse.json({ success: isConnected });
}
```

**Solution:** Remove debug routes or protect with environment checks.

```typescript
// ✅ GOOD: Option 1 - Remove entirely and use scripts
// scripts/test-db-connection.ts
import { testConnection } from '@/lib/db/client';

async function main() {
  const connected = await testConnection();
  console.log(connected ? '✅ Database connected' : '❌ Connection failed');
  process.exit(connected ? 0 : 1);
}

main();

// Run with: npx tsx scripts/test-db-connection.ts
```

```typescript
// ✅ GOOD: Option 2 - Environment protection (if route is needed)
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  
  const isConnected = await testConnection();
  return NextResponse.json({ success: isConnected });
}
```

---

### ❌ AP-3: Missing Rate Limiting

**Problem:** Endpoints without rate limiting are vulnerable to abuse.

```typescript
// ❌ BAD
export async function POST(request: Request) {
  const body = await request.json();
  // Process immediately without rate limiting
  return await processRequest(body);
}
```

**Solution:** Apply rate limiting to sensitive endpoints.

```typescript
// ✅ GOOD
import { 
  getLoginRateLimiter, 
  getClientIP, 
  checkRateLimit, 
  isRateLimitingEnabled 
} from '@/lib/utils/rateLimit';

export async function POST(request: Request) {
  // Check rate limit first
  if (isRateLimitingEnabled()) {
    const ip = getClientIP(request);
    const result = await checkRateLimit(getLoginRateLimiter(), ip);
    if (!result.success) {
      return result.response; // Returns 429 response
    }
  }
  
  const body = await request.json();
  return await processRequest(body);
}
```

---

### ❌ AP-4: Inconsistent Error Handling

**Problem:** Some routes return errors differently, making client-side handling difficult.

```typescript
// ❌ BAD: Inconsistent responses
return NextResponse.json({ error: 'Failed' });           // Missing success field
return NextResponse.json({ message: 'Error occurred' }); // Different field name
return new Response('Error', { status: 500 });           // Plain text
```

**Solution:** Always use the standard ApiResponse format.

```typescript
// ✅ GOOD: Consistent format
return NextResponse.json(
  { success: false, error: 'Operation failed' },
  { status: 500 }
);
```

---

## Database Anti-Patterns

### ❌ AP-5: N+1 Query Problem

**Problem:** Fetching related data in a loop causes excessive database queries.

```typescript
// ❌ BAD: N+1 queries
const shelves = await getAllShelves(userId);
for (const shelf of shelves) {
  shelf.items = await getItemsByShelfId(shelf.id); // Query per shelf!
}
```

**Solution:** Use JOINs or batch queries.

```typescript
// ✅ GOOD: Single query with JOIN
export async function getShelvesWithItems(userId: string): Promise<ShelfWithItems[]> {
  const result = await sql`
    SELECT 
      s.*,
      COALESCE(
        json_agg(i.* ORDER BY i.order_index) 
        FILTER (WHERE i.id IS NOT NULL), 
        '[]'
      ) as items
    FROM shelves s
    LEFT JOIN items i ON i.shelf_id = s.id
    WHERE s.user_id = ${userId}
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `;
  
  return result.map(row => ({
    shelf: { ...row, items: undefined },
    items: row.items,
  }));
}
```

---

### ❌ AP-6: Missing Transaction Boundaries

**Problem:** Multi-step operations without transactions can leave data in inconsistent states.

```typescript
// ❌ BAD: No transaction
await createShelf(userId, shelfData);
await createDefaultItems(shelfId); // If this fails, shelf exists but is empty
await updateUserShelfCount(userId); // May be inconsistent
```

**Solution:** Use transactions for multi-step operations.

```typescript
// ✅ GOOD: Wrapped in transaction (with Neon, use transaction wrapper)
// Note: Neon serverless has limited transaction support
// For critical operations, design idempotent queries or use cleanup handlers

try {
  const shelf = await createShelf(userId, shelfData);
  try {
    await createDefaultItems(shelf.id);
  } catch (error) {
    // Cleanup: delete the shelf if items failed
    await deleteShelf(shelf.id);
    throw error;
  }
} catch (error) {
  logger.error('Failed to create shelf with items', error);
  throw error;
}
```

---

### ❌ AP-7: Untyped Query Results

**Problem:** Query results without type assertions lose type safety.

```typescript
// ❌ BAD: Untyped
const result = await sql`SELECT * FROM users WHERE id = ${id}`;
return result[0]; // Type is unknown
```

**Solution:** Always type-assert query results.

```typescript
// ✅ GOOD: Typed
const result = await sql`SELECT * FROM users WHERE id = ${id}`;
return result.length > 0 ? (result[0] as User) : null;
```

---

## Component Anti-Patterns

### ❌ AP-8: Mixed Server/Client Code

**Problem:** Attempting to use server-only features in client components.

```typescript
// ❌ BAD: This will fail at runtime
'use client';

import { sql } from '@/lib/db/client';

export function UserList() {
  const users = await sql`SELECT * FROM users`; // Can't use sql in client!
  return <ul>{users.map(u => <li>{u.name}</li>)}</ul>;
}
```

**Solution:** Fetch data in server components or via API routes.

```typescript
// ✅ GOOD: Option 1 - Server Component (no 'use client')
import { getAllUsers } from '@/lib/db/queries';

export async function UserList() {
  const users = await getAllUsers();
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}

// ✅ GOOD: Option 2 - Client component with API fetch
'use client';

import { useState, useEffect } from 'react';

export function UserList() {
  const [users, setUsers] = useState([]);
  
  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data.users));
  }, []);
  
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

---

### ❌ AP-9: Missing Loading/Error States

**Problem:** Components that fetch data without handling loading and error states.

```typescript
// ❌ BAD: No loading or error handling
export function DataDisplay({ id }) {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetch(`/api/data/${id}`).then(res => res.json()).then(setData);
  }, [id]);
  
  return <div>{data.items.map(i => <Item {...i} />)}</div>; // Crashes if data is null!
}
```

**Solution:** Always handle loading, error, and empty states.

```typescript
// ✅ GOOD: Complete state handling
export function DataDisplay({ id }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    fetch(`/api/data/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(setData)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [id]);
  
  if (isLoading) return <SkeletonLoader />;
  if (error) return <ErrorMessage error={error} />;
  if (!data?.items?.length) return <EmptyState message="No items found" />;
  
  return <div>{data.items.map(i => <Item key={i.id} {...i} />)}</div>;
}
```

---

### ❌ AP-10: Prop Drilling

**Problem:** Passing props through many component layers.

```typescript
// ❌ BAD: Props passed through multiple levels
function App({ user }) {
  return <Layout user={user}><Page user={user}><Component user={user} /></Page></Layout>;
}
```

**Solution:** Use context for widely-needed data.

```typescript
// ✅ GOOD: Context provider
const UserContext = createContext<User | null>(null);

export function UserProvider({ children, user }) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}

// Usage
function Component() {
  const user = useUser();
  // ...
}
```

---

## Testing Anti-Patterns

### ❌ AP-11: Testing Implementation Details

**Problem:** Tests that break when implementation changes, even if behavior is correct.

```typescript
// ❌ BAD: Testing internal state
it('sets isLoading to true', () => {
  const { result } = renderHook(() => useSearch());
  expect(result.current.isLoading).toBe(false);
  act(() => result.current.search('query'));
  expect(result.current.isLoading).toBe(true); // Implementation detail!
});
```

**Solution:** Test observable behavior and outcomes.

```typescript
// ✅ GOOD: Testing behavior
it('shows loading indicator while searching', async () => {
  render(<SearchComponent />);
  
  await userEvent.type(screen.getByRole('searchbox'), 'query');
  await userEvent.click(screen.getByRole('button', { name: /search/i }));
  
  expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  
  await waitFor(() => {
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
  });
});
```

---

### ❌ AP-12: Incomplete Mocks

**Problem:** Mocks that don't match the actual interface, causing silent failures.

```typescript
// ❌ BAD: Incomplete mock
vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(() => ({ id: '1' })), // Missing required fields!
}));
```

**Solution:** Use helper functions that create complete mock objects.

```typescript
// ✅ GOOD: Complete mock with helper
function createMockUser(overrides = {}): User {
  return {
    id: 'user-1',
    username: 'testuser',
    email: 'test@example.com',
    password_hash: 'hash',
    google_id: null,
    share_token: 'token',
    description: null,
    title: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(() => createMockUser()),
}));
```

---

## Organization Anti-Patterns

### ❌ AP-13: Scattered Documentation

**Problem:** Documentation files scattered across the codebase.

```
/TASK_LIST_FEATURE_A.md        # Root
/docs/SETUP.md                 # Docs folder
/prds/FEATURE_A_PRD.md         # PRDs folder
/ACCEPTANCE_CRITERIA.md        # Root again
```

**Solution:** Organize all documentation in a single hierarchy.

```
/docs/
├── guides/                    # How-to guides
│   ├── QUICK_START.md
│   └── DEPLOYMENT.md
├── prds/                      # All PRDs
│   └── FEATURE_A_PRD.md
├── task-lists/                # All task lists
│   └── TASK_LIST_FEATURE_A.md
├── architecture/              # System design docs
│   └── OVERVIEW.md
└── verification/              # Acceptance criteria
    └── ACCEPTANCE_CRITERIA.md
```

---

### ❌ AP-14: Orphaned Files

**Problem:** Old or unused files left in the codebase.

```
/test-schema-output.ts         # What is this?
/scripts/seed-demo.deprecated.ts  # Deprecated but still there
```

**Solution:** Regularly audit and clean up orphaned files.

```bash
# Add to README or CONTRIBUTING.md:
# Before merging, verify:
# - No temporary files committed
# - Deprecated files are removed or clearly documented
# - Test/debug routes are not in production code
```

---

## TypeScript Anti-Patterns

### ❌ AP-15: Using `any` Type

**Problem:** The `any` type defeats TypeScript's purpose.

```typescript
// ❌ BAD
function processData(data: any) {
  return data.items.map((item: any) => item.name);
}
```

**Solution:** Define proper types or use `unknown` with type guards.

```typescript
// ✅ GOOD: Proper typing
interface DataResponse {
  items: Array<{ id: string; name: string }>;
}

function processData(data: DataResponse) {
  return data.items.map(item => item.name);
}

// ✅ GOOD: Unknown with type guard
function processData(data: unknown) {
  if (!isDataResponse(data)) {
    throw new Error('Invalid data format');
  }
  return data.items.map(item => item.name);
}
```

---

### ❌ AP-16: Type Assertions Without Validation

**Problem:** Blindly asserting types without validation.

```typescript
// ❌ BAD: Dangerous assertion
const user = response.data as User; // What if it's not a User?
```

**Solution:** Validate data before type assertions.

```typescript
// ✅ GOOD: Validated assertion
function isUser(data: unknown): data is User {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'email' in data
  );
}

const data = response.data;
if (!isUser(data)) {
  throw new Error('Invalid user data');
}
// Now TypeScript knows data is User
```

---

## Security Anti-Patterns

### ❌ AP-17: Exposing Internal Errors

**Problem:** Leaking internal error details to clients.

```typescript
// ❌ BAD: Exposing internal error
catch (error) {
  return NextResponse.json({
    success: false,
    error: error.message, // May contain sensitive info!
    stack: error.stack,   // Never expose stack traces!
  });
}
```

**Solution:** Log details internally, return generic message to client.

```typescript
// ✅ GOOD: Safe error handling
catch (error) {
  logger.error('Operation failed', { 
    error,
    userId: session?.userId,
    requestId: request.headers.get('x-request-id'),
  });
  
  return NextResponse.json(
    { success: false, error: 'An error occurred. Please try again.' },
    { status: 500 }
  );
}
```

---

### ❌ AP-18: Missing Authorization Checks

**Problem:** Checking authentication but not authorization.

```typescript
// ❌ BAD: Only checks authentication
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  
  const { itemId } = await request.json();
  await deleteItem(itemId); // No check if user owns this item!
}
```

**Solution:** Always verify resource ownership.

```typescript
// ✅ GOOD: Checks both auth and authorization
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  
  const { itemId } = await request.json();
  
  // Verify ownership
  const item = await getItemById(itemId);
  if (!item) return notFound();
  if (item.user_id !== session.userId) return forbidden();
  
  await deleteItem(itemId);
}
```

---

## Performance Anti-Patterns

### ❌ AP-19: Unnecessary Re-renders

**Problem:** Components re-render when they don't need to.

```typescript
// ❌ BAD: Creates new function on every render
function ParentComponent() {
  return <ChildComponent onClick={() => handleClick()} />;
}
```

**Solution:** Use useCallback for stable references.

```typescript
// ✅ GOOD: Stable callback reference
function ParentComponent() {
  const handleClick = useCallback(() => {
    // handle click
  }, []);
  
  return <ChildComponent onClick={handleClick} />;
}
```

---

### ❌ AP-20: Blocking the Main Thread

**Problem:** Heavy computations blocking UI responsiveness.

```typescript
// ❌ BAD: Synchronous heavy computation
function HeavyComponent({ data }) {
  const processed = data.map(item => expensiveOperation(item)); // Blocks UI!
  return <List items={processed} />;
}
```

**Solution:** Use useMemo for expensive computations, or consider Web Workers.

```typescript
// ✅ GOOD: Memoized computation
function HeavyComponent({ data }) {
  const processed = useMemo(
    () => data.map(item => expensiveOperation(item)),
    [data]
  );
  return <List items={processed} />;
}
```

---

## Quick Reference: Anti-Pattern Checklist

Use this checklist during code reviews:

- [ ] No inline error messages (use constants)
- [ ] No debug/test routes in production
- [ ] Rate limiting on sensitive endpoints
- [ ] Consistent error response format
- [ ] No N+1 queries
- [ ] Query results are typed
- [ ] No server code in client components
- [ ] Loading/error/empty states handled
- [ ] Tests verify behavior, not implementation
- [ ] Mocks are complete and typed
- [ ] Documentation is organized
- [ ] No orphaned files
- [ ] No `any` types
- [ ] Type assertions are validated
- [ ] Internal errors not exposed
- [ ] Authorization checks present
- [ ] Callbacks are memoized
- [ ] Heavy computations are optimized

---

## Refactoring Priority

| Priority | Anti-Pattern | Effort | Impact |
|----------|--------------|--------|--------|
| 🔴 High | AP-2: Test routes in production | Low | High |
| 🔴 High | AP-17: Exposing internal errors | Medium | High |
| 🔴 High | AP-18: Missing authorization | Medium | High |
| 🟡 Medium | AP-1: Inline error messages | Medium | Medium |
| 🟡 Medium | AP-5: N+1 queries | High | Medium |
| 🟡 Medium | AP-13: Scattered documentation | Low | Medium |
| 🟢 Low | AP-15: Using any type | Medium | Low |
| 🟢 Low | AP-19: Unnecessary re-renders | Low | Low |
