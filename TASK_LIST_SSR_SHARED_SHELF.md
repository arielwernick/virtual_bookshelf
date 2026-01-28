# Task List: Server-Side Render Shared Shelf Pages

**Issue:** #126 - feat: Server-side render shared shelf pages for AI/crawler readability  
**Status:** In Progress  
**Branch:** `feature/ssr-shared-shelf`

---

## Overview

Refactor `/s/[shareToken]` to server-render item content for AI/crawler readability while preserving client-side interactivity.

## Design Decisions

1. **Scope:** Only `/s/[shareToken]` (public share) - not embed or authenticated views
2. **Filter behavior:** CSS-based show/hide (acceptable for crawlers, keeps complexity low)
3. **Modal:** Client-only (clicking items requires JS, but content is visible without it)
4. **Strategy:** Hybrid SSR with client hydration for interactivity

---

## Tasks

### 1. Create Static Item Card Component
- [ ] **1.1** Create `components/shelf/ItemCardStatic.tsx` - Server-renderable item card
  - No `'use client'` directive
  - No onClick handlers, no useState
  - Renders all visible content: image, title, creator, type badge, notes, rating
  - Uses CSS-only hover effects
  - Add data attributes for item type (for CSS filtering)

### 2. Create Static Shelf Grid Component  
- [ ] **2.1** Create `components/shelf/ShelfGridStatic.tsx` - Server-renderable shelf grid
  - No `'use client'` directive
  - No drag-and-drop (view-only)
  - Renders items in shelf rows visually
  - Simpler layout without dynamic resize calculations

### 3. Refactor Shared Shelf Page
- [ ] **3.1** Update `app/s/[shareToken]/page.tsx` to render static content
  - Render header (shelf name, description, item count) directly in server component
  - Render `ShelfGridStatic` with items
  - Wrap interactive elements with client component

- [ ] **3.2** Create `app/s/[shareToken]/SharedShelfInteractive.tsx` - Client wrapper
  - Handles ItemModal state
  - Provides click handlers to static grid via children pattern
  - Manages filter tab state (if implementing filters)

### 4. Add CSS-based Filtering (Optional Enhancement)
- [ ] **4.1** Add filter tabs that work via CSS
  - Data attributes on items: `data-type="book"`
  - CSS classes to hide/show items based on active filter
  - Progressive enhancement: works without JS via URL params or just shows all

### 5. Testing & Verification
- [ ] **5.1** Manual verification: View page source shows item content
- [ ] **5.2** Test with JavaScript disabled - items should be visible
- [ ] **5.3** Verify interactive features still work with JS enabled
- [ ] **5.4** Test with curl/fetch to confirm crawlers see content

### 6. Documentation & Cleanup
- [ ] **6.1** Update any relevant documentation
- [ ] **6.2** Close issue #126 with summary

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  /s/[shareToken]/page.tsx (Server Component)            │
│  - Fetches shelf + items from DB                        │
│  - Renders JSON-LD schema                               │
│  - Renders static header                                │
│  - Renders ShelfGridStatic                              │
│  - Wraps with SharedShelfInteractive for JS features    │
└─────────────────────────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         ▼                               ▼
┌─────────────────────┐    ┌─────────────────────────────┐
│ ShelfGridStatic     │    │ SharedShelfInteractive      │
│ (Server Component)  │    │ (Client Component)          │
│ - Renders items     │    │ - ItemModal state           │
│ - No interactivity  │    │ - Click handler context     │
└─────────────────────┘    │ - Filter state (optional)   │
         │                 └─────────────────────────────┘
         ▼
┌─────────────────────┐
│ ItemCardStatic      │
│ (Server Component)  │
│ - Title, creator    │
│ - Image, badge      │
│ - Notes, rating     │
└─────────────────────┘
```

## Verification Checklist

After implementation, verify:

- [ ] `curl https://your-domain/s/[token]` returns HTML with item titles/creators
- [ ] ChatGPT can describe items when given the URL
- [ ] Page renders items with JavaScript disabled
- [ ] Clicking items still opens modal (with JS enabled)
- [ ] No visual regression from current design
