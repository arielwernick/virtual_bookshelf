# Code Patterns Guide

This document defines the standard code patterns used throughout the Virtual Bookshelf codebase. Following these patterns ensures consistency, maintainability, and easier onboarding for new contributors.

---

## Table of Contents

1. [API Route Handlers](#api-route-handlers)
2. [Database Queries](#database-queries)
3. [React Components](#react-components)
4. [Custom Hooks](#custom-hooks)
5. [Type Definitions](#type-definitions)
6. [Testing Patterns](#testing-patterns)
7. [Error Handling](#error-handling)
8. [Validation](#validation)
9. [Logging](#logging)
10. [Import Organization](#import-organization)

---

## API Route Handlers

### Standard Structure

Every API route handler should follow this structure:

```typescript
// app/api/[resource]/route.ts
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/utils/session';
import { createLogger } from '@/lib/utils/logger';
import { validateInput } from '@/lib/utils/validation';

const logger = createLogger('ResourceName');

export async function POST(request: Request) {
  try {
    // 1. AUTHENTICATION (if required)
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // 2. PARSE REQUEST BODY
    const body = await request.json();

    // 3. VALIDATION
    const validation = validateInput(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // 4. AUTHORIZATION (if resource-specific)
    const resource = await getResourceById(body.resourceId);
    if (resource.userId !== session.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // 5. BUSINESS LOGIC
    const result = await performOperation(body);

    // 6. SUCCESS RESPONSE
    logger.info('Operation completed', { userId: session.userId });
    return NextResponse.json({ 
      success: true, 
      data: result 
    });

  } catch (error) {
    // 7. ERROR HANDLING
    logger.error('Operation failed', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Response Format

Always use the `ApiResponse<T>` type:

```typescript
// Success response
{ success: true, data: T }

// Error response
{ success: false, error: string }

// With optional message
{ success: true, data: T, message: string }
```

### Status Codes

| Code | Usage |
|------|-------|
| 200 | Success (GET, PUT, PATCH) |
| 201 | Created (POST) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (not authenticated) |
| 403 | Forbidden (not authorized) |
| 404 | Not Found |
| 429 | Rate Limited |
| 500 | Internal Server Error |

---

## Database Queries

### Location

All database queries live in `lib/db/queries.ts`, organized by entity:

```typescript
// ============================================================================
// USER QUERIES
// ============================================================================

// ============================================================================
// SHELF QUERIES
// ============================================================================

// ============================================================================
// ITEM QUERIES
// ============================================================================
```

### Query Function Pattern

```typescript
/**
 * Brief description of what this query does
 */
export async function getEntityById(id: string): Promise<Entity | null> {
  const result = await sql`
    SELECT * FROM entities
    WHERE id = ${id}
    LIMIT 1
  `;
  
  return result.length > 0 ? (result[0] as Entity) : null;
}
```

### Parameterized Queries

Always use template literals with the `sql` function for automatic parameterization:

```typescript
// ✅ GOOD: Parameterized
const result = await sql`
  SELECT * FROM users WHERE email = ${email}
`;

// ❌ BAD: String interpolation (SQL injection risk)
const result = await sql`
  SELECT * FROM users WHERE email = '${email}'
`;
```

### Return Types

- Single record: `Promise<Entity | null>`
- Multiple records: `Promise<Entity[]>`
- Create/Update: `Promise<Entity>` (returns the created/updated record)
- Delete: `Promise<void>` or `Promise<boolean>`

---

## React Components

### File Structure

```typescript
// components/[category]/ComponentName.tsx
'use client'; // Only if component uses client-side features

import { useState, useCallback } from 'react';
import { ComponentType } from '@/lib/types/shelf';

// ============================================================================
// TYPES
// ============================================================================

interface ComponentNameProps {
  /** Required prop description */
  item: ComponentType;
  /** Optional callback description */
  onClick?: () => void;
  /** Optional boolean with default */
  isEditable?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ComponentName({ 
  item, 
  onClick, 
  isEditable = false 
}: ComponentNameProps) {
  // 1. STATE
  const [isLoading, setIsLoading] = useState(false);

  // 2. DERIVED VALUES
  const displayName = item.name || 'Unnamed';

  // 3. EVENT HANDLERS
  const handleClick = useCallback(() => {
    if (!isEditable && onClick) {
      onClick();
    }
  }, [isEditable, onClick]);

  // 4. RENDER
  return (
    <div 
      className="component-class"
      onClick={handleClick}
    >
      {/* Component content */}
    </div>
  );
}
```

### Client vs Server Components

```typescript
// Server Component (default) - No 'use client' directive
// ✅ Can access: Database, file system, environment variables
// ❌ Cannot use: useState, useEffect, event handlers, browser APIs

// Client Component - Has 'use client' directive
// ✅ Can use: React hooks, event handlers, browser APIs
// ❌ Cannot access: Server-only features directly
```

### Props Interface Naming

Always name props interfaces as `ComponentNameProps`:

```typescript
interface ItemCardProps { ... }
interface ShelfGridProps { ... }
interface ModalProps { ... }
```

---

## Custom Hooks

### Structure

```typescript
// lib/hooks/useFeatureName.ts
import { useState, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface UseFeatureNameOptions {
  onSuccess?: (data: DataType) => void;
  onError?: (error: Error) => void;
}

interface UseFeatureNameReturn {
  data: DataType | null;
  isLoading: boolean;
  error: Error | null;
  execute: (params: ParamsType) => Promise<void>;
  reset: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function useFeatureName(
  options: UseFeatureNameOptions = {}
): UseFeatureNameReturn {
  const [data, setData] = useState<DataType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (params: ParamsType) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await apiCall(params);
      setData(result);
      options.onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options.onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [options.onSuccess, options.onError]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { data, isLoading, error, execute, reset };
}
```

### Naming Convention

- Prefix with `use`
- Describe the feature: `useSearch`, `useEpisodes`, `useManualEntry`
- File name matches hook name: `useSearch.ts` contains `useSearch()`

---

## Type Definitions

### Central Location

All shared types live in `lib/types/shelf.ts`:

```typescript
// lib/types/shelf.ts

// Entity types
export interface User { ... }
export interface Shelf { ... }
export interface Item { ... }

// Composite types
export interface ShelfWithItems { ... }
export interface ShelfData { ... }

// Input types
export interface CreateItemData { ... }
export interface UpdateItemData { ... }

// Response types
export interface ApiResponse<T = unknown> { ... }

// Union types
export type ItemType = 'book' | 'podcast' | 'music' | 'podcast_episode' | 'video' | 'link';
```

### Type vs Interface

```typescript
// Use interface for object shapes
interface User {
  id: string;
  name: string;
}

// Use type for unions, primitives, and complex types
type ItemType = 'book' | 'podcast' | 'music';
type Nullable<T> = T | null;
```

---

## Testing Patterns

### File Naming

- Component tests: `ComponentName.test.tsx`
- Utility tests: `utilityName.test.ts`
- Hook tests: `useHookName.test.ts`
- API route tests: `route.test.ts`

### Test File Structure

```typescript
// ComponentName.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ============================================================================
// MOCKS
// ============================================================================

vi.mock('@/lib/db/queries', () => ({
  getItemById: vi.fn(),
}));

// ============================================================================
// HELPERS
// ============================================================================

function createMockItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'test-id-1',
    type: 'book',
    title: 'Test Book',
    creator: 'Test Author',
    image_url: null,
    external_url: null,
    notes: null,
    rating: null,
    order_index: 0,
    shelf_id: 'shelf-1',
    user_id: 'user-1',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

function renderComponent(props: Partial<ComponentProps> = {}) {
  const defaultProps = { item: createMockItem() };
  return render(<Component {...defaultProps} {...props} />);
}

// ============================================================================
// TESTS
// ============================================================================

describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with required props', () => {
      renderComponent();
      expect(screen.getByText('Test Book')).toBeInTheDocument();
    });

    it('renders with optional props', () => {
      renderComponent({ showDetails: true });
      expect(screen.getByText('Test Author')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onClick when clicked', async () => {
      const onClick = vi.fn();
      renderComponent({ onClick });
      
      await userEvent.click(screen.getByRole('button'));
      
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('handles missing image gracefully', () => {
      renderComponent({ item: createMockItem({ image_url: null }) });
      expect(screen.getByTestId('fallback-icon')).toBeInTheDocument();
    });
  });
});
```

### Mock Data Helpers

Always create helper functions for mock data:

```typescript
function createMockUser(overrides = {}): User {
  return {
    id: 'user-1',
    username: 'testuser',
    email: 'test@example.com',
    ...overrides,
  };
}

function createMockShelf(overrides = {}): Shelf {
  return {
    id: 'shelf-1',
    name: 'Test Shelf',
    user_id: 'user-1',
    ...overrides,
  };
}
```

---

## Error Handling

### Try-Catch Pattern

```typescript
try {
  const result = await riskyOperation();
  return { success: true, data: result };
} catch (error) {
  // Log with context
  logger.error('Operation failed', { 
    error,
    context: { userId, operation: 'create' }
  });
  
  // Return user-friendly error
  return { success: false, error: 'Failed to complete operation' };
}
```

### Error Type Checking

```typescript
catch (error) {
  if (error instanceof ValidationError) {
    return { success: false, error: error.message, status: 400 };
  }
  if (error instanceof NotFoundError) {
    return { success: false, error: 'Resource not found', status: 404 };
  }
  // Generic error
  return { success: false, error: 'Internal server error', status: 500 };
}
```

---

## Validation

### Validation Function Pattern

```typescript
// lib/utils/validation.ts

interface ValidationResult {
  valid: boolean;
  error?: string;
  normalized?: string; // For normalized values
}

export function validateUsername(username: unknown): ValidationResult {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Username is required' };
  }
  
  const normalized = username.trim().toLowerCase();
  
  if (normalized.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }
  
  if (!/^[a-z0-9_]+$/.test(normalized)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }
  
  return { valid: true, normalized };
}
```

### Using Validation

```typescript
const usernameValidation = validateUsername(body.username);
if (!usernameValidation.valid) {
  return NextResponse.json(
    { success: false, error: usernameValidation.error },
    { status: 400 }
  );
}

// Use the normalized value
const username = usernameValidation.normalized!;
```

---

## Logging

### Logger Factory

```typescript
// lib/utils/logger.ts
export function createLogger(context: string) {
  return {
    info: (message: string, data?: object) => {
      console.log(`[${context}] ${message}`, data || '');
    },
    warn: (message: string, data?: object) => {
      console.warn(`[${context}] ${message}`, data || '');
    },
    error: (message: string, error?: unknown) => {
      console.error(`[${context}] ${message}`, error);
    },
  };
}
```

### Usage

```typescript
const logger = createLogger('AuthLogin');

logger.info('Login attempt', { username });
logger.warn('Rate limit approaching', { ip, remaining: 2 });
logger.error('Login failed', error);
```

---

## Import Organization

### Import Order

```typescript
// 1. External packages (React, Next.js, etc.)
import { useState, useCallback } from 'react';
import { NextResponse } from 'next/server';
import Image from 'next/image';

// 2. Internal absolute imports (@/)
import { Item, Shelf } from '@/lib/types/shelf';
import { getItemById } from '@/lib/db/queries';
import { validateInput } from '@/lib/utils/validation';

// 3. Internal relative imports (components in same feature)
import { ItemCard } from './ItemCard';
import { useSearch } from './useSearch';

// 4. Styles (if any)
import styles from './Component.module.css';
```

### Path Aliases

Always use the `@/` alias for imports from project root:

```typescript
// ✅ GOOD
import { Item } from '@/lib/types/shelf';

// ❌ BAD
import { Item } from '../../../lib/types/shelf';
```

---

## Quick Reference

| Pattern | Example | Location |
|---------|---------|----------|
| API Route | `export async function POST()` | `app/api/*/route.ts` |
| DB Query | `export async function getUser()` | `lib/db/queries.ts` |
| Component | `export function ItemCard()` | `components/*/Component.tsx` |
| Hook | `export function useSearch()` | `lib/hooks/useSearch.ts` |
| Type | `export interface Item` | `lib/types/shelf.ts` |
| Validation | `export function validateX()` | `lib/utils/validation.ts` |
| Test | `describe('Component')` | `*.test.ts(x)` |
