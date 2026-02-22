# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest in watch mode
npm run test:run     # Single run (CI)
npm run test:ci      # With coverage report

# Run a single test file
npm run test -- --run path/to/Component.test.tsx

# Run tests matching a pattern
npm run test:run -- --grep "ItemCard"
```

## Architecture Overview

**Virtual Bookshelf** is a Next.js 16 (App Router) full-stack app for curating and sharing collections of books, podcasts, music, videos, and links in styled "shelves."

**Tech stack:** React 19, TypeScript (strict), Tailwind CSS 4, PostgreSQL via Neon Serverless, JWT auth (jose + bcryptjs), @dnd-kit for drag-and-drop, Vitest + Testing Library.

### Key Directories

- `app/api/` — Route handlers (auth, shelf, items, search, import, og)
- `app/dashboard/`, `app/shelf/[shelfId]/` — Authenticated pages
- `app/s/[shareToken]/`, `app/embed/[shareToken]/` — Public/embeddable shelf views
- `components/shelf/` — Core shelf UI (ItemCard, ShelfGrid, AddItemForm, ItemModal, ShareModal)
- `lib/types/shelf.ts` — **All** shared TypeScript types (single source of truth)
- `lib/db/queries.ts` — All database queries, organized by entity
- `lib/db/client.ts` — Neon client with lazy initialization (avoids build-time errors)
- `lib/contexts/ShelfContext.tsx` — React context to reduce prop drilling in shelf components
- `lib/utils/` — session (JWT), validation, password (bcrypt), logger, rateLimit, env
- `lib/constants/errors.ts` — Centralized error message strings
- `docs/architecture/PATTERNS.md` — Detailed code patterns reference
- `docs/architecture/ANTI_PATTERNS.md` — Patterns to avoid

### State Management

The primary global state mechanism is **`ShelfContext`** (`lib/contexts/ShelfContext.tsx`), which distributes `editMode`, `onDeleteItem`, `onEditNote`, and `onItemClick` to avoid prop drilling through `ShelfGrid → ItemCard` layers.

- `useShelf()` — returns context or null (safe, backwards-compatible)
- `useShelfRequired()` — throws if used outside `ShelfProvider` (strict)

Session state lives in HTTP-only JWT cookies (7-day expiry). All other state is local `useState`.

### API Route Pattern

Every route handler follows: authenticate → parse body → validate → authorize → business logic → respond `{ success: true, data }` or `{ success: false, error }`. Use `createLogger('ContextName')` from `lib/utils/logger.ts` and error constants from `lib/constants/errors.ts`.

### Database Pattern

All queries are in `lib/db/queries.ts`. Always use `sql\`...\`` tagged template literals (Neon auto-parameterizes — never interpolate strings directly). Return types: `Promise<Entity | null>` for single records, `Promise<Entity[]>` for lists.

### Item Types

`type ItemType = 'book' | 'podcast' | 'music' | 'podcast_episode' | 'video' | 'link'`

### Testing Patterns

Tests colocate with source: `ComponentName.test.tsx`. Each test file uses:
1. `vi.mock(...)` section at the top
2. `createMockItem/createMockShelf/createMockUser` helper functions with `overrides` spread
3. A `renderComponent(props?)` wrapper function
4. `describe` blocks for Rendering / Interactions / Edge Cases

The `test/setup.ts` polyfills `TextEncoder/TextDecoder` for jose and mocks `next/headers` cookies.

### Environment Variables

Required: `DATABASE_URL`, `SESSION_SECRET`, `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `YOUTUBE_API_KEY`, `NEXT_PUBLIC_BASE_URL`.

The build requires mock env vars to be set (see `.github/workflows/test.yml`).
