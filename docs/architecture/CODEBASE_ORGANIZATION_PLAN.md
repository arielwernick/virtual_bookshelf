# Codebase Organization & Documentation Plan

## Overview

This document outlines a comprehensive plan to organize the Virtual Bookshelf codebase, improve documentation, establish code patterns, and identify anti-patterns for refactoring.

**Date:** February 2, 2026  
**Branch:** `chore/codebase-organization-documentation`

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Organizational Issues](#organizational-issues)
3. [Proposed Directory Structure](#proposed-directory-structure)
4. [Code Pattern Documentation](#code-pattern-documentation)
5. [Anti-Patterns & Refactoring Guide](#anti-patterns--refactoring-guide)
6. [Implementation Tasks](#implementation-tasks)
7. [README Updates](#readme-updates)

---

## Current State Analysis

### Strengths ✅

1. **Clear Type System**: Centralized types in `lib/types/shelf.ts`
2. **Consistent API Response Format**: Using `ApiResponse<T>` pattern
3. **Good Test Coverage**: 34 test files across components, utils, and APIs
4. **Well-documented Copilot Instructions**: Comprehensive `.github/copilot-instructions.md`
5. **Validation Utilities**: Centralized input validation in `lib/utils/validation.ts`
6. **Logger Pattern**: Consistent logging via `createLogger()` factory
7. **Database Query Layer**: Clean abstraction in `lib/db/queries.ts`

### Issues Found 🚨

| Category | Issue | Location | Severity |
|----------|-------|----------|----------|
| **Root Clutter** | 7 TASK_LIST_*.md files in root | `/` | Medium |
| **Root Clutter** | Acceptance criteria files in root | `/` | Medium |
| **Test Routes** | Debug/test API routes in production | `app/api/test-*` | High |
| **Documentation Scatter** | Docs split across `/`, `/docs`, `/prds` | Multiple | Medium |
| **Unused File** | `test-schema-output.ts` in root | `/` | Low |
| **Missing Docs** | No architecture documentation | N/A | Medium |
| **Mixed Concerns** | Migration files mixed with schema | `lib/db/` | Low |

---

## Organizational Issues

### 1. Root Directory Clutter

**Current root contains:**
```
ACCEPTANCE_CRITERIA_VERIFICATION.md   # Should be in docs/
SIMPLIFIED_TEXT_TO_SHELF_PROMPT.md    # Should be archived or in docs/
TASK_LIST_ITEM_RATING.md              # Should be in docs/task-lists/
TASK_LIST_PODCAST_EPISODES.md         # Should be in docs/task-lists/
TASK_LIST_REMOVE_TOP5.md              # Should be in docs/task-lists/
TASK_LIST_SHELF_CONTINUITY.md         # Should be in docs/task-lists/
TASK_LIST_SSR_SHARED_SHELF.md         # Should be in docs/task-lists/
TASK_LIST_TEXT_TO_SHELF.md            # Should be in docs/task-lists/
test-schema-output.ts                 # Should be removed or moved to scripts/
```

### 2. Test/Debug API Routes in Production

**Routes that should be dev-only or removed:**
```
app/api/test-books/          # Debug route
app/api/test-db/             # Debug route
app/api/test-episode-position/
app/api/test-episodes/
app/api/test-spotify/
app/api/test-spotify-auth/
```

### 3. Documentation Structure

**Current state:**
- `/docs/` - Operational docs (setup, migration, security)
- `/prds/` - Product requirement documents (17 files)
- `/` - Task lists and verification docs (scattered)

---

## Proposed Directory Structure

```
/
├── .github/
│   ├── copilot-instructions.md    # ✅ Keep (Copilot context)
│   └── workflows/                  # CI/CD workflows
│
├── app/                            # Next.js App Router
│   ├── api/
│   │   ├── auth/                  # Auth endpoints
│   │   ├── import/                # Import feature
│   │   ├── items/                 # Item CRUD
│   │   ├── og/                    # OG image generation
│   │   ├── search/                # Search endpoints
│   │   └── shelf/                 # Shelf management
│   │   # ❌ Remove: test-* routes (or move to scripts/)
│   ├── dashboard/
│   ├── embed/
│   ├── import/
│   ├── login/
│   ├── s/
│   ├── shelf/
│   ├── signup/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── home/                      # Home page components
│   ├── import/                    # Import feature components
│   ├── shelf/                     # Shelf components
│   ├── ui/                        # Reusable UI components
│   ├── Confetti.tsx
│   ├── Navigation.tsx
│   └── Providers.tsx
│
├── docs/                          # 📚 ALL documentation lives here
│   ├── architecture/              # NEW: Architecture docs
│   │   ├── OVERVIEW.md
│   │   ├── DATABASE.md
│   │   └── API_DESIGN.md
│   ├── guides/                    # Setup & operational guides
│   │   ├── ADMIN_DEMO_SETUP.md
│   │   ├── DEPLOYMENT_CHECKLIST.md
│   │   ├── QUICK_START.md
│   │   └── OAUTH_TROUBLESHOOTING.md
│   ├── migrations/                # Database migration docs
│   │   ├── MIGRATION.md
│   │   └── MIGRATION_GOOGLE_AUTH.md
│   ├── security/                  # Security documentation
│   │   ├── SECURITY_AUDIT.md
│   │   └── security-tasks/
│   ├── performance/               # Performance docs
│   │   ├── N1_OPTIMIZATION_SUMMARY.md
│   │   └── PERFORMANCE_N1_OPTIMIZATION.md
│   ├── prds/                      # 📋 Product requirements (moved from /prds)
│   │   └── [all PRD files]
│   ├── task-lists/                # 📝 Task tracking (moved from root)
│   │   └── [all TASK_LIST files]
│   ├── PATTERNS.md                # NEW: Code patterns guide
│   ├── ANTI_PATTERNS.md           # NEW: Anti-patterns to avoid
│   └── COMPREHENSIVE_AUDIT_DECEMBER_2025.md
│
├── lib/
│   ├── api/                       # External API clients
│   ├── constants/                 # App constants
│   ├── db/
│   │   ├── client.ts
│   │   ├── queries.ts
│   │   ├── schema.sql
│   │   └── migrations/            # SQL migration files (moved)
│   ├── hooks/                     # React hooks
│   ├── styles/                    # Style utilities
│   ├── types/                     # TypeScript types
│   └── utils/                     # Utility functions
│
├── scripts/                       # Development scripts
│   ├── seed-demo.deprecated.ts
│   └── test-db-connection.ts      # Moved from api routes
│
├── test/                          # Test setup & utilities
│
├── public/                        # Static assets
│
├── README.md                      # Project overview
├── CONTRIBUTING.md                # NEW: Contribution guidelines
└── [config files]
```

---

## Code Pattern Documentation

### Pattern 1: API Route Handler

```typescript
// ✅ GOOD: Consistent API route pattern
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/utils/session';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('ResourceName');

export async function POST(request: Request) {
  try {
    // 1. Authentication check
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // 2. Parse and validate input
    const body = await request.json();
    const validation = validateInput(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // 3. Business logic
    const result = await performOperation(body);

    // 4. Return success response
    logger.info('Operation completed', { userId: session.userId });
    return NextResponse.json({ success: true, data: result });

  } catch (error) {
    logger.error('Operation failed', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Pattern 2: Database Query Function

```typescript
// ✅ GOOD: Typed database query
export async function getResourceById(id: string): Promise<Resource | null> {
  const result = await sql`
    SELECT * FROM resources
    WHERE id = ${id}
    LIMIT 1
  `;
  return result.length > 0 ? (result[0] as Resource) : null;
}
```

### Pattern 3: React Component

```typescript
// ✅ GOOD: Well-structured component
'use client';

import { useState } from 'react';
import { Item } from '@/lib/types/shelf';

interface ItemCardProps {
  item: Item;
  onClick?: () => void;
  editMode?: boolean;
}

export function ItemCard({ item, onClick, editMode }: ItemCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Event handlers
  const handleClick = () => {
    if (!editMode && onClick) onClick();
  };

  return (
    <div onClick={handleClick}>
      {/* Component JSX */}
    </div>
  );
}
```

### Pattern 4: Custom Hook

```typescript
// ✅ GOOD: Custom hook pattern
import { useState, useCallback } from 'react';

interface UseFeatureOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useFeature(options: UseFeatureOptions = {}) {
  const [data, setData] = useState<DataType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (params: Params) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiCall(params);
      setData(result);
      options.onSuccess?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options.onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  return { data, isLoading, error, execute };
}
```

### Pattern 5: Test File Structure

```typescript
// ✅ GOOD: Test file organization
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Helper functions at top
function createMockData(overrides = {}): DataType {
  return { id: '1', name: 'Test', ...overrides };
}

describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders correctly with default props', () => {
      // Test implementation
    });
  });

  describe('Interactions', () => {
    it('calls onClick when clicked', () => {
      // Test implementation
    });
  });

  describe('Edge Cases', () => {
    it('handles null data gracefully', () => {
      // Test implementation
    });
  });
});
```

---

## Anti-Patterns & Refactoring Guide

### Anti-Pattern 1: Inline Error Messages

```typescript
// ❌ BAD: Inline error strings
return NextResponse.json(
  { success: false, error: 'Invalid username or password' },
  { status: 401 }
);

// ✅ GOOD: Use constants for error messages
// lib/constants/errors.ts
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid username or password',
  NOT_AUTHENTICATED: 'Not authenticated',
  GOOGLE_ONLY: 'This account uses Google authentication',
} as const;

// In route handler
return NextResponse.json(
  { success: false, error: AUTH_ERRORS.INVALID_CREDENTIALS },
  { status: 401 }
);
```

### Anti-Pattern 2: Test Routes in Production

```typescript
// ❌ BAD: Debug routes exposed in production
// app/api/test-db/route.ts
export async function GET() {
  const isConnected = await testConnection();
  return NextResponse.json({ success: isConnected });
}

// ✅ GOOD: Move to scripts or protect with env check
// scripts/test-db-connection.ts
async function main() {
  const isConnected = await testConnection();
  console.log(isConnected ? '✅ Connected' : '❌ Failed');
  process.exit(isConnected ? 0 : 1);
}

// Or, if API route is needed:
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  // ... debug logic
}
```

### Anti-Pattern 3: Scattered Documentation

```typescript
// ❌ BAD: Documentation in root
/TASK_LIST_FEATURE_X.md
/ACCEPTANCE_CRITERIA.md

// ✅ GOOD: Organized documentation
/docs/task-lists/TASK_LIST_FEATURE_X.md
/docs/verification/ACCEPTANCE_CRITERIA.md
```

### Anti-Pattern 4: Missing Error Boundaries

```typescript
// ❌ BAD: Component without error handling
export function DataDisplay({ data }) {
  return <div>{data.items.map(i => <Item key={i.id} {...i} />)}</div>;
}

// ✅ GOOD: Handle potential undefined/null
export function DataDisplay({ data }) {
  if (!data?.items?.length) {
    return <EmptyState message="No items found" />;
  }
  return <div>{data.items.map(i => <Item key={i.id} {...i} />)}</div>;
}
```

### Anti-Pattern 5: Hardcoded Configuration

```typescript
// ❌ BAD: Hardcoded values
const ITEMS_PER_PAGE = 10;
const API_TIMEOUT = 5000;

// ✅ GOOD: Use constants file
// lib/constants/config.ts
export const CONFIG = {
  PAGINATION: {
    ITEMS_PER_PAGE: 10,
    MAX_ITEMS: 100,
  },
  API: {
    TIMEOUT_MS: 5000,
    RETRY_COUNT: 3,
  },
} as const;
```

### Anti-Pattern 6: Mixed Server/Client Code

```typescript
// ❌ BAD: Server code in client component
'use client';
import { sql } from '@/lib/db/client'; // This won't work!

// ✅ GOOD: Separate concerns
// Server: Use API routes or Server Components
// Client: Fetch from API routes
```

### Anti-Pattern 7: Inconsistent Async/Await

```typescript
// ❌ BAD: Mixed promise handling
async function fetchData() {
  return fetch('/api/data')
    .then(res => res.json())
    .catch(console.error);
}

// ✅ GOOD: Consistent async/await
async function fetchData() {
  try {
    const res = await fetch('/api/data');
    return await res.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}
```

---

## Implementation Tasks

### Phase 1: Directory Reorganization

- [ ] **1.1** Move TASK_LIST files to `docs/task-lists/`
- [ ] **1.2** Move PRD files from `/prds/` to `docs/prds/`
- [ ] **1.3** Move acceptance criteria files to `docs/verification/`
- [ ] **1.4** Remove or relocate root `test-schema-output.ts`
- [ ] **1.5** Reorganize `docs/` subdirectories

### Phase 2: Test Route Cleanup

- [ ] **2.1** Remove `app/api/test-db/` (or add env protection)
- [ ] **2.2** Remove `app/api/test-books/`
- [ ] **2.3** Remove `app/api/test-spotify/`
- [ ] **2.4** Remove `app/api/test-spotify-auth/`
- [ ] **2.5** Remove `app/api/test-episodes/`
- [ ] **2.6** Remove `app/api/test-episode-position/`
- [ ] **2.7** Create script alternatives if needed

### Phase 3: Documentation Creation

- [ ] **3.1** Create `docs/PATTERNS.md` with code patterns
- [ ] **3.2** Create `docs/ANTI_PATTERNS.md` with anti-patterns
- [ ] **3.3** Create `docs/architecture/OVERVIEW.md`
- [ ] **3.4** Create `CONTRIBUTING.md` in root

### Phase 4: README Update

- [ ] **4.1** Update project structure diagram
- [ ] **4.2** Add architecture overview section
- [ ] **4.3** Add links to documentation
- [ ] **4.4** Update feature list with new features
- [ ] **4.5** Add code patterns reference

### Phase 5: Code Quality Improvements

- [ ] **5.1** Create `lib/constants/errors.ts` for error messages
- [ ] **5.2** Audit and consolidate duplicate constants
- [ ] **5.3** Review and update `.github/copilot-instructions.md`

---

## README Updates

### Proposed README Changes

1. **Update Tech Stack** to reflect current versions
2. **Expand Project Structure** with new organization
3. **Add Documentation Section** linking to all docs
4. **Add Architecture Overview** section
5. **Add Code Patterns** quick reference
6. **Update Features** list with recent additions:
   - Podcast episode support
   - Video/link support  
   - Star ratings
   - Text-to-shelf import
   - SSR for shared shelves (AI-readable)

---

## Success Criteria

- [ ] Root directory contains only essential config files
- [ ] All documentation organized in `docs/`
- [ ] No debug/test API routes in production
- [ ] Comprehensive code patterns documented
- [ ] Anti-patterns clearly identified with refactoring guidance
- [ ] README accurately reflects current project state
- [ ] `.github/copilot-instructions.md` updated

---

## Appendix: File Inventory

### Files to Move

| Current Location | New Location |
|------------------|--------------|
| `/TASK_LIST_*.md` (6 files) | `docs/task-lists/` |
| `/ACCEPTANCE_CRITERIA_VERIFICATION.md` | `docs/verification/` |
| `/SIMPLIFIED_TEXT_TO_SHELF_PROMPT.md` | `docs/archive/` or delete |
| `/prds/*.md` (17 files) | `docs/prds/` |
| `/test-schema-output.ts` | Delete or `scripts/` |

### Files to Delete

| File | Reason |
|------|--------|
| `app/api/test-db/route.ts` | Debug route |
| `app/api/test-books/route.ts` | Debug route |
| `app/api/test-spotify/route.ts` | Debug route |
| `app/api/test-spotify-auth/route.ts` | Debug route |
| `app/api/test-episodes/route.ts` | Debug route |
| `app/api/test-episode-position/route.ts` | Debug route |

### Files to Create

| File | Purpose |
|------|---------|
| `docs/PATTERNS.md` | Code patterns guide |
| `docs/ANTI_PATTERNS.md` | Anti-patterns to avoid |
| `docs/architecture/OVERVIEW.md` | System architecture |
| `CONTRIBUTING.md` | Contribution guidelines |
| `lib/constants/errors.ts` | Centralized error messages |
