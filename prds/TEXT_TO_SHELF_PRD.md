# Text-to-Shelf Import Feature PRD

## Overview

Allow users to paste any text containing links (social media posts, newsletters, notes) and automatically generate a shelf with extracted items, including contextual descriptions parsed from surrounding text.

## Problem Statement

Users discover curated lists of resources on social media (LinkedIn, Twitter, newsletters) but have no easy way to:
1. Save these lists in an organized, visual format
2. Access them later without scrolling through feeds
3. Share them as beautiful, browsable collections

Currently, users must manually add each item one-by-one.

## Solution

A "Text to Shelf" import page where users paste any text. The system:
1. Extracts all URLs from the text
2. Resolves shortened URLs (lnkd.in, bit.ly, t.co)
3. Parses contextual text around each URL for titles/descriptions
4. Fetches metadata for each URL
5. Creates a shelf with all items, preserving order

## User Flow

```
┌─────────────────────────────────────────────────────────┐
│  /import                                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📋 Paste any text with links                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │ (large textarea)                               │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [ Extract Links ]                                      │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  Found 16 links                                         │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ☑ THE CODE                                       │  │
│  │   "Scale at global level. Teaches you how to..." │  │
│  │   → thecodebytes.com                             │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ ☑ Airbnb Tech Blog                               │  │
│  │   "Product engineering done right."              │  │
│  │   → airbnb.tech/blog                             │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ ☐ (uncheck to exclude)                           │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  Shelf title: [ Engineering Blogs _____________ ]      │
│                                                         │
│  [ Create Shelf ]                                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Text Parsing Algorithm

### Input Example (LinkedIn post format):

```
1 → THE CODE
Scale at global level.
Teaches you how to code with AI and AI Agents
https://lnkd.in/dcibJhzQ

2 → Airbnb Tech Blog
Product engineering done right.
User focused systems.
https://airbnb.tech/blog/
```

### Parsing Strategy:

1. **Split text by URLs** using regex: `https?://[^\s]+`
2. **For each URL, look backwards** at preceding lines (until previous URL or start)
3. **Identify title**: First non-empty line, often contains `→`, numbers, or is shortest
4. **Identify description**: Remaining lines before URL become notes
5. **Handle edge cases**: URLs with no context get metadata-only

### Parsed Output:

```typescript
interface ParsedItem {
  url: string;
  resolvedUrl?: string;       // After following redirects
  parsedTitle?: string;       // From surrounding text
  parsedDescription?: string; // From surrounding text
  // After metadata fetch:
  fetchedTitle?: string;      // From page metadata
  fetchedImage?: string;      // From page og:image
  fetchedPublisher?: string;  // From page metadata
}
```

### Title Priority:
1. Use `parsedTitle` from text if available and meaningful
2. Fall back to `fetchedTitle` from page metadata
3. Fall back to domain name

### Notes Field:
- Combine `parsedDescription` with user ability to edit

## Technical Implementation

### New Files:

```
lib/
  utils/
    textParser.ts          # URL extraction and context parsing
    urlResolver.ts         # Short URL resolution (lnkd.in, bit.ly, t.co)
app/
  import/
    page.tsx               # Import page (client component)
  api/
    import/
      parse/route.ts       # Extract URLs + context from text
      resolve/route.ts     # Resolve shortened URLs
      create/route.ts      # Batch create shelf with items
```

### API Endpoints:

#### POST /api/import/parse
```typescript
// Request
{ text: string }

// Response
{
  success: true,
  items: ParsedItem[]
}
```

#### POST /api/import/resolve
```typescript
// Request
{ urls: string[] }

// Response
{
  success: true,
  resolved: { [shortUrl: string]: string }
}
```

#### POST /api/import/create
```typescript
// Request
{
  title: string,
  items: Array<{
    url: string,
    title: string,
    notes?: string,
    image_url?: string
  }>
}

// Response
{
  success: true,
  shelf: { id: string, share_token: string }
}
```

### URL Shortener Resolution:

Common shorteners to handle:
- `lnkd.in` (LinkedIn)
- `bit.ly`
- `t.co` (Twitter)
- `goo.gl` (Google, deprecated but still exists)
- `tinyurl.com`
- `ow.ly` (Hootsuite)

Resolution approach:
```typescript
async function resolveUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
    });
    return response.url;
  } catch {
    return url; // Return original if resolution fails
  }
}
```

### Rate Limiting Considerations:

- Microlink free tier: 50 requests/day
- For posts with 15+ links, may hit limits
- Solutions:
  1. Batch intelligently (resolve URLs first, dedupe)
  2. Cache resolved URLs
  3. Show partial results with "upgrade" prompt
  4. Queue processing for large imports

## Item Type Detection

Based on resolved URL domain, assign item type:

| Domain Pattern | Item Type |
|---------------|-----------|
| `spotify.com/show`, `spotify.com/episode` | podcast |
| `spotify.com/album`, `spotify.com/track` | music |
| `youtube.com`, `youtu.be` | link (video) |
| `amazon.com/dp/`, `goodreads.com/book` | book |
| Everything else | link |

## Edge Cases

1. **Duplicate URLs**: Dedupe before processing
2. **Invalid URLs**: Skip with warning
3. **Failed metadata fetch**: Use parsed text as fallback
4. **No context text**: Use metadata only
5. **Very long posts**: Limit to 50 items per import
6. **Private/paywalled URLs**: Show error for that item

## Authentication & Conversion Funnel

### Anonymous Users (Try Before Sign Up)
- **Can**: Paste text, extract links, see preview with metadata
- **Cannot**: Save/publish the shelf
- **Rate limit**: 1 import preview per IP address per day
- **Prompt**: "This looks great! Sign up to save your shelf"

### Why This Works:
1. User experiences the magic (extracted links + beautiful preview)
2. They've invested time—don't want to lose it
3. Sign up feels like unlocking, not a gate

### Implementation:
```typescript
// Track anonymous previews by IP
// Store in Redis or simple DB table:
interface ImportPreview {
  ip_hash: string;        // Hashed IP for privacy
  created_at: Date;
  preview_data: string;   // JSON of parsed items (for restoration after signup)
  converted: boolean;     // Did they sign up?
}
```

### Post-Signup Flow:
1. User signs up/logs in
2. Restore their preview data from session/localStorage
3. Create shelf automatically
4. Redirect to their new shelf

### Logged In Users:
- No rate limit on previews
- Can save immediately
- Shelf created under their account

## Success Metrics

- Time to create shelf from social post: < 30 seconds
- Items successfully parsed with context: > 80%
- User completes import flow: > 70%

## Future Enhancements

1. **Browser extension**: Right-click "Send to Virtual Bookshelf"
2. **Bookmarklet**: One-click import from any page
3. **API for bots**: Enable Slack/Discord/Telegram integrations
4. **AI enhancement**: Use LLM to improve title/description extraction
5. **Import from URL**: Paste a social media post URL, we fetch and parse it

## Out of Scope (V1)

- Direct social media API integration (scraping posts)
- Image upload for items
- Editing items during import (edit after creation)
- Import from file (CSV, JSON)

## Design Notes

- Keep UI minimal: textarea → preview → create
- Show progress during URL resolution (can be slow)
- Allow unchecking items user doesn't want
- Mobile-friendly (people find posts on phone)

## Open Questions

1. Should anonymous imports be allowed? (spam risk vs. conversion)
2. Default shelf visibility: public or private?
3. Where does /import link live in nav? (dashboard only vs. global)
