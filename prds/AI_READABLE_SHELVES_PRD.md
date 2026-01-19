# AI-Readable Shelves with Schema.org Markup
## Product Requirement Document

**Status:** In Development  
**Date:** January 18, 2026  
**Feature Branch:** `feature/ai-readable-shelves`

---

## Overview

Add JSON-LD schema.org markup to public shelf pages to make shelf metadata easily readable by LLMs (ChatGPT, Claude, etc.) and accessibility tools. This enables users to share shelves with AI assistants without losing structured information about items, creators, and notes.

## Problem Statement

Users today share Virtual Bookshelf URLs with LLMs to discuss their collections. Without structured metadata in the page, LLMs must parse the HTML/DOM to extract information, leading to:
- Incomplete or inaccurate data extraction
- Poor accessibility for screen readers
- Missed SEO opportunities

## Solution

Embed JSON-LD schema.org markup in the `<head>` of public shelf pages that:
- Follows schema.org standards for `Collection` and item types (Book, Podcast, MusicRecording)
- Includes all relevant shelf and item metadata
- Is automatically generated server-side
- Requires zero changes to existing UI or routes

## Goals

1. **AI Readability**: LLMs can parse shelf metadata directly from page source
2. **Accessibility**: Structured data improves screen reader experience
3. **Standards Compliance**: Uses widely-adopted schema.org format
4. **Zero Breaking Changes**: No new routes, endpoints, or UI modifications
5. **SEO**: Improves search engine understanding of content

## Scope

### In Scope
- Add JSON-LD `<script>` tag to public shelf pages (`/s/[shareToken]`)
- Support shelf metadata: name, description, creator
- Support item metadata: title, creator, type, notes, URL
- Generate schema automatically from existing database query

### Out of Scope
- Embed routes or endpoints (can add in future phase)
- API endpoints for text format (can add in future phase)
- Microdata or RDFa formats (stick with JSON-LD)
- Rating system integration (future enhancement)

## Data Structure

### Schema Mapping

**Shelf → Collection**
```json
{
  "@type": "Collection",
  "name": "Shelf Title",
  "description": "Optional shelf description",
  "creator": {
    "@type": "Person",
    "name": "Username"
  },
  "itemListElement": [...]
}
```

**Items → Type-specific**
```json
// Book
{
  "@type": "Book",
  "name": "Title",
  "author": { "@type": "Person", "name": "Author" },
  "description": "User notes",
  "url": "external URL if available"
}

// Podcast
{
  "@type": "PodcastSeries",
  "name": "Podcast Name",
  "creator": { "@type": "Person", "name": "Creator" },
  "description": "User notes"
}

// Music
{
  "@type": "MusicRecording",
  "name": "Album/Song",
  "byArtist": { "@type": "Person", "name": "Artist" },
  "description": "User notes"
}
```

## Implementation

### Files to Create
- `lib/utils/schemaMarkup.ts` - Utility to generate JSON-LD markup

### Files to Modify
- `app/s/[shareToken]/page.tsx` - Add schema markup to page

### Changes Required
1. Create schema generation utility (40-60 lines)
2. Call utility in shelf page component (3-5 lines)
3. Add `<script>` tag with JSON-LD in page `<head>` (1-2 lines)

## Acceptance Criteria

- [ ] JSON-LD schema is valid according to schema.org specification
- [ ] Shelf page renders `<script type="application/ld+json">` in `<head>`
- [ ] All items are included in `itemListElement` array
- [ ] Item types (Book, Podcast, MusicRecording) are correctly mapped
- [ ] Markup includes shelf name, description, and creator
- [ ] Markup includes item title, creator, and notes
- [ ] LLM can parse and extract all metadata from page source
- [ ] No console errors or TypeScript violations
- [ ] Existing shelf functionality unchanged

## Timeline

- **Planning**: 30 min
- **Implementation**: 1-2 hours
- **Testing**: 30 min
- **Total**: 2-3 hours

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Schema invalid or malformed | Validate against schema.org; test in JSON-LD validator |
| Performance impact | Generate on-demand server-side; minimal overhead |
| Missing edge cases | Handle null/undefined fields gracefully |

## Success Metrics

1. JSON-LD validator shows no errors
2. LLM can successfully extract all shelf items and metadata
3. Zero regressions in existing shelf views
4. Zero console warnings or errors

---

## References
- [schema.org Collection](https://schema.org/Collection)
- [schema.org Book](https://schema.org/Book)
- [schema.org PodcastSeries](https://schema.org/PodcastSeries)
- [schema.org MusicRecording](https://schema.org/MusicRecording)
- [JSON-LD Specification](https://json-ld.org/)
