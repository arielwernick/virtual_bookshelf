# Virtual Bookshelf - GitHub Copilot Instructions

## Project Overview

Virtual Bookshelf is a Next.js application that allows users to curate and share their favorite books, podcasts, and music in a digital bookshelf. Users can organize items into custom shelves, share them publicly via unique URLs, and embed their shelves on external sites.

## Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Next.js | 16.0.3 |
| UI Library | React | 19.2.0 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| Database | PostgreSQL (Neon Serverless) | @neondatabase/serverless 1.x |
| Authentication | jose (JWT) + bcryptjs | jose 6.x, bcryptjs 3.x |
| Testing | Vitest + Testing Library | vitest 4.x |
| Linting | ESLint | 9.x with eslint-config-next |

## Build, Test, and Lint Commands

```bash
# Development
npm run dev          # Start development server

# Build
npm run build        # Build the application for production

# Testing
npm run test         # Run Vitest in watch mode
npm run test:run     # Run tests once (CI mode)
npm run test:ci      # Run tests with coverage

# Linting
npm run lint         # Run ESLint
```

## Directory Structure

```
/
├── app/                    # Next.js App Router
│   ├── api/               # API route handlers
│   │   ├── auth/          # Authentication endpoints (login, signup, logout, google)
│   │   ├── items/         # Item CRUD operations
│   │   ├── search/        # Search functionality
│   │   └── shelf/         # Shelf management
│   ├── dashboard/         # Authenticated user dashboard
│   ├── embed/             # Embeddable shelf views
│   ├── login/             # Login page
│   ├── signup/            # Signup page
│   ├── s/                 # Public shelf view (share token)
│   ├── shelf/             # Shelf detail pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/
│   ├── shelf/             # Shelf-related components
│   │   ├── AddItemForm.tsx
│   │   ├── ItemCard.tsx
│   │   ├── ItemModal.tsx
│   │   ├── ShareModal.tsx
│   │   ├── ShelfGrid.tsx
│   │   └── ShelfTitleEditor.tsx
│   ├── ui/                # Generic UI components
│   ├── Navigation.tsx
│   └── Confetti.tsx
├── docs/                  # Documentation
│   ├── ADMIN_DEMO_SETUP.md
│   ├── DEPLOYMENT_CHECKLIST.md
│   ├── MIGRATION.md
│   ├── MIGRATION_GOOGLE_AUTH.md
│   ├── OAUTH_TROUBLESHOOTING.md
│   └── QUICK_START.md
├── lib/
│   ├── api/               # API client helpers
│   ├── constants/         # Application constants
│   ├── db/
│   │   ├── client.ts      # Neon database client
│   │   ├── queries.ts     # Database query functions
│   │   └── schema.sql     # Database schema
│   ├── styles/            # Style utilities
│   ├── types/
│   │   └── shelf.ts       # TypeScript type definitions
│   └── utils/
│       ├── env.ts         # Environment utilities
│       ├── password.ts    # Password hashing (bcrypt)
│       ├── session.ts     # JWT session management
│       └── validation.ts  # Input validation
├── prds/                  # Product Requirement Documents
│   ├── BUTTON_HOVER_ENHANCEMENT.md
│   ├── GOOGLE_AUTH_PRD.md
│   ├── LINKEDIN_REDESIGN_PRD.md
│   ├── prd-responsive-card-layouts.md
│   ├── prd-virtual-bookshelf.md
│   ├── SHELF_DESCRIPTION.md
│   ├── SHELF_RENAME_PRD.md
│   └── UNIT_TESTING_PRD.md
├── test/
│   └── setup.ts           # Vitest setup file
├── public/                # Static assets
└── __mocks__/             # Test mocks
```

## Coding Conventions

### TypeScript

- **Type definitions** are centralized in `lib/types/shelf.ts`
- Use explicit interfaces for all data structures
- Prefer `interface` over `type` for object shapes
- Use strict TypeScript (no implicit `any`)

```typescript
// Example from lib/types/shelf.ts
export interface Item {
  id: string;
  shelf_id: string;
  user_id: string | null;
  type: ItemType;
  title: string;
  creator: string;
  image_url: string | null;
  external_url: string | null;
  notes: string | null;
  order_index: number;
  created_at: Date;
  updated_at: Date;
}
```

### API Routes

- Use Next.js 16 Route Handlers in `app/api/`
- Return consistent `ApiResponse<T>` format
- Always validate inputs before processing
- Use try-catch with proper error logging

```typescript
// Example pattern from app/api/auth/login/route.ts
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate inputs
    const validation = validateInput(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid input' },
        { status: 400 }
      );
    }

    // Process request...
    
    return NextResponse.json({
      success: true,
      data: { /* response data */ },
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: 'Operation failed' },
      { status: 500 }
    );
  }
}
```

### React Components

- Use functional components with hooks
- Mark client components with `'use client'` directive
- Use Tailwind CSS for styling
- Follow component file naming: `ComponentName.tsx` with test file `ComponentName.test.tsx`

```typescript
// Example component structure
'use client';

import { useState } from 'react';
import { Item } from '@/lib/types/shelf';

interface ItemCardProps {
  item: Item;
  onClick?: () => void;
  editMode?: boolean;
  onDelete?: () => void;
}

export function ItemCard({ item, onClick, editMode, onDelete }: ItemCardProps) {
  // Component implementation
}
```

### Testing Patterns

- Use Vitest with Testing Library
- Create helper functions for mock data
- Group tests with `describe` blocks
- Test rendering, interactions, and edge cases

```typescript
// Example test structure from components/shelf/ItemCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Helper to create mock data
function createMockItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'item-1',
    type: 'book',
    title: 'The Great Gatsby',
    creator: 'F. Scott Fitzgerald',
    // ... default values
    ...overrides,
  };
}

describe('ItemCard', () => {
  describe('Rendering', () => {
    it('renders item title', () => {
      render(<ItemCard item={createMockItem({ title: 'Test Title' })} />);
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });
  });
});
```

### Import Aliases

Use the `@/` alias for imports from the project root:

```typescript
import { Item } from '@/lib/types/shelf';
import { sql } from '@/lib/db/client';
import { getSession } from '@/lib/utils/session';
```

## Database Operations (Neon PostgreSQL)

### Connection

The database client uses lazy initialization to avoid connection issues during build:

```typescript
// From lib/db/client.ts
import { neon, NeonQueryFunction } from '@neondatabase/serverless';

let _sql: NeonQueryFunction<false, false> | null = null;

function getSql(): NeonQueryFunction<false, false> {
  if (!_sql) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    _sql = neon(databaseUrl);
  }
  return _sql;
}
```

### Query Patterns

- Use tagged template literals for SQL queries
- Always use parameterized queries (automatic with Neon's template literals)
- Return typed results with explicit casting

```typescript
// Example query pattern from lib/db/queries.ts
export async function getUserByUsername(username: string): Promise<User | null> {
  const result = await sql`
    SELECT * FROM users
    WHERE username = ${username}
    LIMIT 1
  `;
  return result.length > 0 ? (result[0] as User) : null;
}
```

### Schema

The database schema is defined in `lib/db/schema.sql`. Key tables:

- **users**: User accounts with password or Google OAuth
- **shelves**: User-created shelves with share tokens
- **items**: Books, podcasts, and music entries

### Environment Variables

Required for database operations:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `SESSION_SECRET` - JWT signing secret

## Authentication

### Session Management

JWT-based sessions using the `jose` library:

- Sessions stored in HTTP-only cookies
- 7-day expiration
- Contains: `userId`, `username`, `email`

```typescript
// From lib/utils/session.ts
export interface SessionData {
  userId: string;
  username: string | null;
  email?: string;
}

// Get current session
const session = await getSession();

// Set session after login
await setSessionCookie({ userId, username, email });

// Clear session on logout
await clearSession();
```

### Password Handling

Uses `bcryptjs` for password hashing:

```typescript
import { hashPassword, verifyPassword } from '@/lib/utils/password';

const hash = await hashPassword(password);
const isValid = await verifyPassword(password, hash);
```

## GitHub Actions CI/CD

The project uses GitHub Actions (`.github/workflows/test.yml`) for:

1. **Test job**: Runs `npm run test:ci` with coverage
2. **Lint job**: Runs `npm run lint`
3. **Build job**: Runs `npm run build` (depends on test and lint)

Build requires mock environment variables:
```yaml
env:
  DATABASE_URL: postgresql://test:test@localhost:5432/test
  SESSION_SECRET: test-secret-for-build
```

## Item Types

The application supports three item types:

```typescript
export type ItemType = 'book' | 'podcast' | 'music';
```

Each type has distinct styling (blue for books, purple for podcasts, green for music).

## Special Considerations

### Server vs Client Components

- API routes and data fetching are server-side by default
- Interactive components must use `'use client'` directive
- Session access requires server context (`cookies()` from `next/headers`)

### Validation

Always validate user inputs using utilities from `lib/utils/validation.ts`:

```typescript
import { validateUsername, validatePassword } from '@/lib/utils/validation';

const usernameValidation = validateUsername(username);
if (!usernameValidation.valid) {
  // Handle error
}
```

### Error Handling

- Log errors with `console.error` for debugging
- Return user-friendly error messages in API responses
- Never expose internal error details to clients

### Image Handling

- Item images are stored as URLs (`image_url` field)
- Use lazy loading for images: `loading="lazy"`
- Provide fallback icons when no image is available
