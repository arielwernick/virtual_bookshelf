# Rotating Shelf Preview - PRD

## Overview

Replace the single demo shelf on the landing page with a rotating carousel of shelf previews from the admin user's account. This allows showcasing multiple shelves and adds visual interest to the home page.

## Problem Statement

Currently, the landing page displays a single static demo shelf configured via `DEMO_SHELF_TOKEN`. This approach:
- Only shows one shelf at a time
- Requires manual env var changes to feature different shelves
- Doesn't showcase the variety of shelves a user can create

## Proposed Solution

Fetch **all public shelves** from the admin user's account and display them in a rotating carousel on the landing page.

## User Stories

1. **As a visitor**, I want to see multiple example shelves so I understand the variety of content I can curate.
2. **As an admin**, I want to create multiple demo shelves and have them all featured without changing env vars.
3. **As a visitor**, I want to navigate between example shelves to explore different content types.

## Technical Design

### Configuration Change

**Current:** `DEMO_SHELF_TOKEN` (single shelf token)

**New:** `DEMO_USER_ID` (admin user's ID)

This allows fetching all public shelves from the admin account dynamically.

### New Database Query

```typescript
// Get all public shelves for the admin user
export async function getPublicShelvesByUserId(userId: string): Promise<Shelf[]> {
  const result = await sql`
    SELECT * FROM shelves
    WHERE user_id = ${userId}
    AND is_public = true
    ORDER BY created_at DESC
  `;
  return result as Shelf[];
}
```

### New Component: `RotatingDemoShelf`

Replace `DemoShelf` with a new `RotatingDemoShelf` component that:

1. Accepts an array of shelves with their items
2. Displays one shelf at a time with smooth transitions
3. Shows navigation indicators (dots or arrows)
4. Auto-rotates every 5-8 seconds (configurable)
5. Pauses rotation on hover
6. Allows manual navigation

### UI Design Options

#### Option A: Carousel with Arrows
```
    [←]  Shelf Name: "My Book Picks"  [→]
    ┌─────────────────────────────────────┐
    │  📚 📚 📚 📚 📚 📚  │
    └─────────────────────────────────────┘
                    ● ○ ○
```

#### Option B: Swipeable Cards (Mobile-Friendly)
```
    ┌─────────────────────────────────────┐
    │  📚 Shelf: "My Book Picks"         │
    │  📚 📚 📚 📚 📚 📚  │
    │  ─── shelf wood ───                │
    └─────────────────────────────────────┘
    Swipe or click arrows to see more →
```

#### Option C: Tab-Style Navigation
```
    [ Books ] [ Podcasts ] [ Music Mix ]
    ┌─────────────────────────────────────┐
    │  📚 📚 📚 📚 📚 📚  │
    │  ─── shelf wood ───                │
    └─────────────────────────────────────┘
```

**Selected: Option B** - Swipeable cards with mobile-friendly design.

### Data Flow

```
1. page.tsx (Server Component)
   ├── Read DEMO_USER_ID from env
   ├── Fetch all public shelves for user
   ├── For each shelf, fetch items (limited to 12)
   └── Pass array to RotatingDemoShelf

2. RotatingDemoShelf (Client Component)
   ├── State: activeIndex, isHovering
   ├── Effect: auto-rotate timer
   ├── Render: current shelf with transitions
   └── Navigation: dots/arrows
```

### Props Interface

```typescript
interface ShelfPreview {
  shelf: Shelf;
  items: Item[];
}

interface RotatingDemoShelfProps {
  shelves: ShelfPreview[];
  autoRotateInterval?: number; // ms, default 6000
}
```

### Fallback Behavior

- If `DEMO_USER_ID` not set → Hide demo section entirely
- If admin has no public shelves → Hide demo section
- If admin has only 1 public shelf → Show static (like current behavior)
- If admin has 2+ public shelves → Show rotating carousel

### Accessibility

- Keyboard navigation (left/right arrows)
- Pause button for auto-rotation
- Screen reader announcements for slide changes
- Focus management when navigating

### Performance Considerations

- Lazy load images for non-active shelves
- Limit to 5-6 shelves max in rotation
- Pre-fetch adjacent shelf images
- Use CSS transitions, not JS animations

## Migration Path

1. **Phase 1**: Add new query + component (backward compatible)
2. **Phase 2**: Update env var from `DEMO_SHELF_TOKEN` to `DEMO_USER_ID`
3. **Phase 3**: Remove old `DemoShelf` component after verification

## Open Questions

1. ~~Should we limit the number of shelves in rotation?~~ **Yes, max 5**
2. ~~Should rotation pause when user interacts?~~ **Yes**
3. ~~Should we show shelf descriptions in the preview?~~ **No, keep minimal**
4. ~~Auto-rotate interval?~~ **3 seconds**

## Success Metrics

- Visitors see variety of shelf types
- Click-through rate to example shelves
- Reduced admin overhead for updating demo content

## Timeline Estimate

- Database query: 30 min
- RotatingDemoShelf component: 2-3 hours
- Page integration: 30 min
- Testing: 1 hour
- **Total: ~4-5 hours**
