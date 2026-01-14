# Add Any Link Feature

## Feature Request

### Problem Statement
Users currently can only add structured content (books, podcasts, music, videos) to their shelves. There's no way to save and share interesting articles, blog posts, or social content from sites like NYT, WSJ, Substack, or LinkedIn. Users have to manually enter titles and have no image support for these items.

### Proposed Solution
Add a "Link" item type that accepts any URL and automatically extracts metadata (title, image, source) using the **Microlink API** - the same approach used by WhatsApp, Slack, and iMessage for link previews.

### User Story
As a **Virtual Bookshelf user**, I want **to paste any URL and have it automatically populate with the page's title and preview image** so that **I can curate and share interesting content alongside my books and podcasts**.

### Mockup / Examples
Same as how these apps unfurl links:
- WhatsApp link previews
- iMessage link cards
- Slack URL unfurling
- Notion link embeds

### Alternatives Considered
1. **Manual entry only** - Current workaround, but tedious and no images
2. **Custom OG scraping** - Complex, blocked by many sites (LinkedIn, Twitter)
3. **Browser extension** - More complex, separate project

---

## Product Requirements Document

### Overview
Extend Virtual Bookshelf to support a new "Link" item type that uses the Microlink API to extract metadata from any URL, enabling users to save web content with automatic title and image extraction.

### Goals
1. Enable saving any URL to a shelf with minimal friction
2. Automatically extract title, image, and publisher via Microlink API
3. Provide graceful fallbacks when metadata is incomplete
4. Maintain consistent UX with existing item types

### Non-Goals
- Full-text content extraction (just metadata)
- Paywall bypassing
- Self-hosted OG scraping (use Microlink instead)
- Browser extension

### Technical Approach: Microlink API

**Why Microlink?**
- Free tier: 50 requests/day (plenty for personal use)
- Handles edge cases we'd struggle with (LinkedIn, Twitter, paywalls)
- One API call replaces ~100 lines of scraping code
- Same approach used by Slack, Notion, etc.

**API Call:**
```typescript
const response = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`);
const { status, data } = await response.json();
// data.title, data.image?.url, data.publisher - done!
```

### Requirements

#### Functional Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| F1 | User can select "Link" as an item type | Must Have |
| F2 | User can paste any valid URL | Must Have |
| F3 | System fetches metadata via Microlink API | Must Have |
| F4 | Fallback to domain name if publisher missing | Must Have |
| F5 | Display link items with image preview in shelf | Must Have |
| F6 | Link opens original URL in new tab | Must Have |
| F7 | Validate URL format before fetching | Must Have |
| F8 | Show loading state during metadata fetch | Must Have |
| F9 | Fall back to manual entry if Microlink fails | Should Have |

#### Non-Functional Requirements
| ID | Requirement |
|----|-------------|
| NF1 | Metadata fetch should complete in < 5 seconds |
| NF2 | Graceful error handling for failed fetches |
| NF3 | Compatible with Edge runtime |
| NF4 | No API key required (free tier) |

### User Flow
1. User clicks "Add Item" on a shelf
2. User selects "Link" tab (orange-themed button)
3. User pastes URL into input field
4. User clicks "Add Link" button
5. System calls Microlink API, extracts metadata
6. Item is created and appears on shelf with image preview
7. (Error case) If Microlink fails, show option to add manually

### Edge Cases
| Scenario | Handling |
|----------|----------|
| Microlink returns error | Show error with "Add manually" option |
| No image in response | Display without image (icon fallback) |
| No title in response | Use URL as title |
| Rate limited (50/day) | Show error: "Daily limit reached, try manual entry" |
| Invalid URL format | Validate before fetch, show inline error |

---

## Technical Implementation Plan

### Architecture Overview
```
┌───────────────┐     ┌─────────────────────────┐     ┌─────────────┐
│  LinkUrlForm  │────▶│ POST /api/items/from-url │────▶│  Database   │
│  (Component)  │     │   (Extended API Route)   │     │   (items)   │
└───────────────┘     └─────────────────────────┘     └─────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │  Microlink API   │
                        │  (External)      │
                        └──────────────────┘
```

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `lib/types/shelf.ts` | Modify | Add `'link'` to `ItemType` |
| `lib/db/schema.sql` | Modify | Update CHECK constraint (documentation) |
| `lib/db/MIGRATION_004_link_type.sql` | Create | Migration script for existing DBs |
| `lib/api/microlink.ts` | Create | Microlink API wrapper (simple) |
| `app/api/items/from-url/route.ts` | Modify | Extend to handle generic URLs via Microlink |
| `components/shelf/forms/LinkUrlForm.tsx` | Create | URL input form component |
| `components/shelf/AddItemForm.tsx` | Modify | Add Link tab and integrate form |
| `components/shelf/ItemCard.tsx` | Modify | Add styling for link type |

### Database Migration
```sql
-- MIGRATION_004_link_type.sql
-- Add 'link' to items type constraint

ALTER TABLE items DROP CONSTRAINT items_type_check;
ALTER TABLE items ADD CONSTRAINT items_type_check 
  CHECK (type IN ('book', 'podcast', 'music', 'podcast_episode', 'video', 'link'));
```

### API Design

#### Extend `POST /api/items/from-url`
The existing endpoint handles YouTube URLs. We extend it to:
1. Try YouTube extraction first (existing logic)
2. If not a YouTube URL, call Microlink API
3. Create item with returned metadata

**Request:**
```json
{
  "url": "https://nytimes.com/article",
  "shelf_id": "uuid"
}
```

**Response (success):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "link",
    "title": "Article Title",
    "creator": "The New York Times",
    "image_url": "https://static.nytimes.com/og-image.jpg",
    "external_url": "https://nytimes.com/article"
  }
}
```

### Microlink Integration
```typescript
// lib/api/microlink.ts
export interface MicrolinkData {
  title: string;
  image: string | null;
  publisher: string;
  description: string | null;
  url: string;
}

export async function fetchLinkMetadata(url: string): Promise<MicrolinkData> {
  const response = await fetch(
    `https://api.microlink.io?url=${encodeURIComponent(url)}`
  );
  const { status, data } = await response.json();
  
  if (status !== 'success') {
    throw new Error('Failed to fetch link metadata');
  }
  
  return {
    title: data.title || new URL(url).hostname,
    image: data.image?.url || null,
    publisher: data.publisher || new URL(url).hostname,
    description: data.description || null,
    url: data.url || url,
  };
}
```

---

## Task List

### ⚠️ Manual Pre-requisites (Run in Neon Console)
Before starting implementation, the following SQL must be run manually in the Neon database console:

```sql
-- MIGRATION_004_link_type.sql
-- Run this in Neon Console BEFORE deploying code changes

ALTER TABLE items DROP CONSTRAINT items_type_check;
ALTER TABLE items ADD CONSTRAINT items_type_check 
  CHECK (type IN ('book', 'podcast', 'music', 'podcast_episode', 'video', 'link'));
```

**Agent Note:** Pause and confirm with user that this migration has been run before proceeding with Phase 1 tasks.

---

### Phase 1: Backend
- [ ] **1.0** ⏸️ WAIT: Confirm DB migration has been run in Neon Console
- [ ] **1.1** Add `'link'` to `ItemType` in `lib/types/shelf.ts`
- [ ] **1.2** Create migration script `lib/db/MIGRATION_004_link_type.sql` (for documentation)
- [ ] **1.3** Update `schema.sql` documentation with new type
- [ ] **1.4** Create `lib/api/microlink.ts` with `fetchLinkMetadata()` function
- [ ] **1.5** Extend `app/api/items/from-url/route.ts` to handle non-YouTube URLs
- [ ] **1.6** Write tests for Microlink integration

### Phase 2: Frontend
- [ ] **2.1** Create `components/shelf/forms/LinkUrlForm.tsx` (orange theme)
- [ ] **2.2** Integrate LinkUrlForm into `AddItemForm.tsx` as new tab
- [ ] **2.3** Add link styling to `ItemCard.tsx` (orange theme)
- [ ] **2.4** Add link styling to `Top5ItemCard.tsx`

### Phase 3: Polish & Testing
- [ ] **3.1** Test with real URLs (NYT, Substack, LinkedIn, Medium)
- [ ] **3.2** Manual E2E testing
- [ ] **3.3** Run full test suite and lint

---

## Test URLs for Validation
```
# Should work well
https://www.nytimes.com/2024/01/01/technology/ai-news.html
https://substack.com/@example/article-title
https://medium.com/@author/article-title
https://www.linkedin.com/posts/...  (Microlink handles this!)

# Edge cases
https://example.com (minimal metadata)
```

---

## Success Criteria
1. ✅ User can add any public URL as a "Link" item
2. ✅ Title and image are automatically extracted via Microlink
3. ✅ Graceful fallbacks when metadata is missing
4. ✅ All existing tests pass
5. ✅ Works in both light and dark mode

---

## Limitations (Document for Users)
- Free Microlink tier: 50 requests/day
- Some sites may still block metadata extraction
- Images are hotlinked (not stored)

---

## References
- [Microlink API Documentation](https://microlink.io/docs/api/getting-started/overview)
- Existing implementation: [from-url/route.ts](../app/api/items/from-url/route.ts) (YouTube)
- Existing form pattern: [VideoUrlForm.tsx](../components/shelf/forms/VideoUrlForm.tsx)
