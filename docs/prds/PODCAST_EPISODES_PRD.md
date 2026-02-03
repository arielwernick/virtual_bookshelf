# PRD: Podcast Episodes Support
*Product Requirement Document*

## Executive Summary

**What:** Add support for individual podcast episodes alongside existing podcast shows
**For Whom:** Virtual Bookshelf users who want to curate specific podcast episodes they love
**Why:** Users currently can only add entire podcast shows, but often have favorite specific episodes they want to highlight and share

## Problem Statement

Currently, users can add "podcasts" to their shelves, but this actually adds the entire show. Many users have specific favorite episodes that were transformative or memorable - like a particular Huberman Lab episode about sleep, or a specific interview episode. They can't currently showcase these individual episodes.

**User Pain Points:**
- Can't add the specific episode that changed their thinking
- Have to use notes field to specify which episode they mean (poor UX)
- Can't browse a podcast's episodes to find the one they want
- Missing metadata like episode duration and release date

## Solution Overview

Implement a hybrid UX where users can search for podcasts and then either:
1. **Add the entire show** (current behavior, unchanged)
2. **Browse episodes** and add a specific episode

### User Flow
```
Search "huberman" → Shows list appears
Each show has: [Add Show] button + "Browse Episodes →" link
Click "Browse Episodes" → Episodes list for that show
Each episode has: [Add Episode] button
Back button returns to show search
```

## Target Users

**Primary:** Power users who listen to podcasts regularly
- Want to curate their absolute favorite episodes
- Share specific episodes that impacted them
- Care about discoverability and metadata

**Secondary:** Casual users who discover this feature organically
- Might explore episodes when adding shows
- Benefit from seeing episode durations

## Success Metrics

- **Adoption:** % of podcast additions that are episodes vs shows
- **Engagement:** Episodes added per user who uses the feature
- **Discovery:** Episodes browsed per show search
- **Retention:** Users who add episodes continue using the feature

## User Stories

**As a podcast listener,** I want to search for a podcast show and browse its episodes so I can add the specific episode that changed my perspective.

**As a content curator,** I want to see episode metadata (duration, date) so I can make informed decisions about what to add to my shelf.

**As a shelf viewer,** I want to see clearly when an item is a specific episode vs entire show so I understand what's being recommended.

## Functional Requirements

### 1. Database Schema Updates
- Add `'podcast_episode'` to ItemType enum
- Update database constraint: `CHECK (type IN ('book', 'podcast', 'podcast_episode', 'music'))`
- Episodes store parent show information in creator field

### 2. Spotify API Integration  
- New function: `getShowEpisodes(showId: string)` 
- Endpoint: GET `/v1/shows/{id}/episodes`
- Pagination support (Spotify returns max 50 episodes)
- Extract: name, duration_ms, release_date, images, external_urls

### 3. New API Route
- `GET /api/search/episodes?showId={id}&offset=0&limit=20`
- Returns paginated episode list for a show
- Includes metadata: duration, release date, image, Spotify URL

### 4. UI/UX Updates
- Show search results include "Browse Episodes →" link
- Episode browser (modal or inline view) with:
  - Back navigation to show search
  - Episode list with duration badges
  - "Load More" for pagination
  - Add button per episode

### 5. Display Enhancements
- Episodes use purple styling (same as podcasts) 
- Show duration badge (e.g., "1h 52m")
- Creator shows parent podcast name
- Clear visual distinction from podcast shows

## Non-Functional Requirements

- **Performance:** Episode search completes within 2 seconds
- **Reliability:** Graceful handling of Spotify API rate limits
- **Usability:** Clear navigation between shows and episodes
- **Consistency:** Matches existing podcast styling and behavior

## Technical Architecture

### Data Flow
1. User searches podcasts (existing)
2. Results show "Browse Episodes" option (new)
3. Episodes API calls Spotify shows endpoint (new)
4. Episode list displays with metadata (new)
5. Adding episode creates item with type='podcast_episode' (new)

### Database Changes
```sql
-- Update items table constraint
ALTER TABLE items DROP CONSTRAINT items_type_check;
ALTER TABLE items ADD CONSTRAINT items_type_check 
  CHECK (type IN ('book', 'podcast', 'podcast_episode', 'music'));
```

### Type Updates
```typescript
// lib/types/shelf.ts
export type ItemType = 'book' | 'podcast' | 'podcast_episode' | 'music';
```

## Edge Cases & Error Handling

- **No episodes found:** Show empty state with explanation
- **API timeout:** Display retry option with loading state
- **Rate limiting:** Queue requests and show progress indicator
- **Large episode lists:** Implement pagination/infinite scroll
- **Missing metadata:** Graceful fallbacks for duration/images

## Out of Scope (Future Enhancements)

- Episode search by name across all podcasts
- Episode playback preview within the app
- Episode descriptions in the UI
- Podcast subscription management
- Cross-platform episode sync (Apple Podcasts, etc.)

## Acceptance Criteria

**Must Have:**
- [ ] Podcast search shows "Browse Episodes" link
- [ ] Episode browser displays list with metadata
- [ ] Users can add individual episodes  
- [ ] Episodes display with duration badges
- [ ] Back navigation works correctly
- [ ] Existing podcast (show) functionality unchanged

**Should Have:**
- [ ] Pagination for large episode lists
- [ ] Loading states for all API calls
- [ ] Error handling with user-friendly messages
- [ ] Works on both standard and top5 shelves

**Could Have:**
- [ ] Episode search within show (filter by name)
- [ ] Sort episodes by date/popularity
- [ ] Bulk add multiple episodes

## Timeline & Dependencies

**Week 1:** Database migration + Type definitions
**Week 2:** Spotify API integration + Episodes endpoint  
**Week 3:** UI components + Episode browser
**Week 4:** Testing + Polish + Documentation

**Dependencies:**
- Spotify API access (existing)
- Database migration coordination
- Component library patterns (existing)

## Risk Assessment

**Low Risk:** Database schema change (additive only)
**Medium Risk:** Spotify API rate limits during episode browsing
**High Risk:** UI complexity of navigation between shows/episodes

**Mitigation Strategies:**
- Implement API caching for episode lists
- Progressive enhancement (graceful degradation if API fails)
- User testing for navigation flow clarity