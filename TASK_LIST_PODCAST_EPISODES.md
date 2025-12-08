# Task List: Podcast Episodes Support
*Implementation Tasks for PRD: Podcast Episodes Support*

## Task Hierarchy

### 1. Foundation Tasks (Database & Types)

#### 1.1 Database Schema Migration
- **Task:** Create migration file to add `podcast_episode` type
- **Description:** Update the items table constraint to include 'podcast_episode' alongside existing types
- **Files:** `lib/db/MIGRATION_003_podcast_episodes.sql`
- **Acceptance Criteria:**
  - Migration file creates new constraint safely
  - Supports rollback if needed
  - Doesn't break existing podcast items
- **Dependencies:** None
- **Estimated Time:** 30 minutes

#### 1.2 Update TypeScript Types  
- **Task:** Add `podcast_episode` to ItemType definition
- **Description:** Extend existing type system to support episodes alongside shows
- **Files:** `lib/types/shelf.ts`
- **Acceptance Criteria:**
  - ItemType includes 'podcast_episode'
  - All existing code still compiles
  - Type safety maintained
- **Dependencies:** None  
- **Estimated Time:** 15 minutes

### 2. Spotify API Integration

#### 2.1 Implement getShowEpisodes Function
- **Task:** Add Spotify API function to fetch episodes for a show
- **Description:** Create new function using Spotify's "Get Show Episodes" endpoint with pagination support
- **Files:** `lib/api/spotify.ts`
- **Acceptance Criteria:**
  - Function accepts showId parameter
  - Returns formatted episode data (title, creator, duration, image, etc.)
  - Supports offset/limit pagination
  - Handles API errors gracefully
- **Dependencies:** Task 1.2 (types)
- **Estimated Time:** 2 hours

#### 2.2 Add Episode Interface Types
- **Task:** Define TypeScript interfaces for episode data
- **Description:** Create types for Spotify episode responses and our internal episode format
- **Files:** `lib/types/shelf.ts`, `lib/api/spotify.ts`  
- **Acceptance Criteria:**
  - SpotifyEpisode interface matches API response
  - Episode interface includes duration_ms, release_date
  - Proper typing for episode search results
- **Dependencies:** Task 1.2
- **Estimated Time:** 45 minutes

### 3. API Route Development

#### 3.1 Create Episodes Search Route
- **Task:** Implement `/api/search/episodes` endpoint  
- **Description:** New API route to fetch episodes for a specific show with pagination
- **Files:** `app/api/search/episodes/route.ts`
- **Acceptance Criteria:**
  - Accepts showId, offset, limit query parameters
  - Returns paginated episode results
  - Includes proper error handling and validation
  - Consistent with existing API patterns
- **Dependencies:** Task 2.1, 2.2
- **Estimated Time:** 1.5 hours

#### 3.2 Update Items API for Episodes
- **Task:** Ensure POST `/api/items` supports podcast_episode type
- **Description:** Verify and update item creation to handle episode-specific data
- **Files:** `app/api/items/route.ts`
- **Acceptance Criteria:**
  - Validates podcast_episode type
  - Handles episode-specific metadata
  - Updates database correctly
  - Returns appropriate responses
- **Dependencies:** Task 1.1, 1.2
- **Estimated Time:** 1 hour

### 4. UI Component Development

#### 4.1 Add Browse Episodes Link to Search Results
- **Task:** Modify podcast search results to include episode browse option
- **Description:** Update search result display to show "Browse Episodes →" link for podcast shows
- **Files:** `components/shelf/AddItemForm.tsx`
- **Acceptance Criteria:**
  - Shows "Add Show" button (existing behavior)
  - Shows "Browse Episodes →" link for podcasts only
  - Link triggers episode browser view
  - Maintains existing styling and layout
- **Dependencies:** Task 2.1
- **Estimated Time:** 2 hours

#### 4.2 Create Episode Browser Component  
- **Task:** Build episode list view component
- **Description:** New component to display paginated list of episodes for a show
- **Files:** `components/shelf/EpisodeBrowser.tsx`
- **Acceptance Criteria:**
  - Displays episode list with metadata (title, duration, date)
  - Shows "Add Episode" button for each episode
  - Implements "Load More" pagination
  - Includes back navigation to show search
  - Responsive design matches existing components
- **Dependencies:** Task 3.1, 4.1
- **Estimated Time:** 4 hours

#### 4.3 Episode Duration Formatting Utility
- **Task:** Create helper function to format episode duration
- **Description:** Utility to convert duration_ms to human-readable format (e.g., "1h 52m")
- **Files:** `lib/utils/duration.ts`
- **Acceptance Criteria:**
  - Handles hours, minutes, seconds appropriately
  - Returns consistent format ("1h 52m", "42m", "3h 15m") 
  - Handles edge cases (0 duration, very long episodes)
- **Dependencies:** None
- **Estimated Time:** 45 minutes

### 5. Display & Styling Updates

#### 5.1 Update ItemCard for Episodes
- **Task:** Enhance ItemCard to display episode-specific information
- **Description:** Add duration badge and clear episode vs show distinction
- **Files:** `components/shelf/ItemCard.tsx`
- **Acceptance Criteria:**
  - Episodes show duration badge (e.g., "1h 52m")
  - Uses purple styling consistent with podcasts
  - Creator shows parent podcast name
  - Clear visual distinction from podcast shows
- **Dependencies:** Task 4.3
- **Estimated Time:** 2 hours

#### 5.2 Update Top5ItemCard for Episodes
- **Task:** Apply episode support to Top5 shelf item cards
- **Description:** Ensure episode display works correctly in Top5 shelf format
- **Files:** `components/shelf/Top5ItemCard.tsx`
- **Acceptance Criteria:**
  - Duration badge displays properly in compact format
  - Styling consistent with Top5 design patterns
  - Episode metadata fits within space constraints
- **Dependencies:** Task 5.1
- **Estimated Time:** 1 hour

### 6. Integration & State Management

#### 6.1 Update AddItemForm State Management
- **Task:** Add state management for episode browsing mode
- **Description:** Extend form state to handle show/episode navigation and selection
- **Files:** `components/shelf/AddItemForm.tsx`
- **Acceptance Criteria:**
  - Tracks current view (show search vs episode browser)
  - Manages selected show for episode browsing
  - Handles navigation state properly
  - Maintains search query during navigation
- **Dependencies:** Task 4.1, 4.2
- **Estimated Time:** 2 hours

#### 6.2 Error Handling & Loading States
- **Task:** Implement comprehensive error handling and loading states
- **Description:** Add loading indicators and error messages for all new API calls
- **Files:** `components/shelf/AddItemForm.tsx`, `components/shelf/EpisodeBrowser.tsx`
- **Acceptance Criteria:**
  - Loading spinners for episode fetching
  - Error messages for API failures
  - Retry mechanisms for failed requests
  - Graceful degradation when episodes unavailable
- **Dependencies:** Task 6.1
- **Estimated Time:** 2 hours

### 7. Testing & Quality Assurance

#### 7.1 Unit Tests for Episode Functions  
- **Task:** Write tests for new episode-related functions
- **Description:** Test coverage for Spotify API functions and episode utilities
- **Files:** `lib/api/spotify.test.ts`, `lib/utils/duration.test.ts`
- **Acceptance Criteria:**
  - Tests for getShowEpisodes function
  - Tests for duration formatting utility
  - Mock Spotify API responses
  - Edge case coverage (empty results, API errors)
- **Dependencies:** Task 2.1, 4.3
- **Estimated Time:** 2 hours

#### 7.2 Component Tests for Episode UI
- **Task:** Test episode browser and updated item cards
- **Description:** React Testing Library tests for new episode components
- **Files:** `components/shelf/EpisodeBrowser.test.tsx`, updated ItemCard tests
- **Acceptance Criteria:**
  - Episode browser rendering tests
  - Episode card display tests  
  - Navigation interaction tests
  - Loading and error state tests
- **Dependencies:** Task 4.2, 5.1
- **Estimated Time:** 3 hours

#### 7.3 End-to-End Testing
- **Task:** Manual testing of complete episode flow
- **Description:** Test full user journey from search to adding episodes
- **Acceptance Criteria:**
  - Search → Browse Episodes → Add Episode workflow works
  - Episodes display correctly in shelves
  - Navigation works on all device sizes
  - Error scenarios handled gracefully
- **Dependencies:** All previous tasks
- **Estimated Time:** 2 hours

### 8. Documentation & Cleanup

#### 8.1 Update API Documentation
- **Task:** Document new episodes endpoint and updated types
- **Description:** Add endpoint documentation and usage examples  
- **Files:** Add to existing API docs or README
- **Acceptance Criteria:**
  - Episodes endpoint documented with parameters
  - Example request/response included
  - Integration notes for other developers
- **Dependencies:** Task 3.1
- **Estimated Time:** 1 hour

#### 8.2 Database Migration Documentation
- **Task:** Document database changes and migration steps
- **Description:** Clear instructions for applying the podcast_episode migration
- **Files:** Update migration docs
- **Acceptance Criteria:**
  - Migration steps clearly documented
  - Rollback procedures included
  - Production deployment notes
- **Dependencies:** Task 1.1
- **Estimated Time:** 45 minutes

## Task Dependencies Graph

```
1.1 (DB Migration) → 1.2 (Types) → 2.1 (Spotify API)
                                      ↓
2.2 (Episode Types) → 3.1 (API Route) → 4.1 (Browse Link)
                      ↓                    ↓
                   3.2 (Items API)      4.2 (Episode Browser)
                                          ↓
4.3 (Duration Utils) → 5.1 (ItemCard) → 5.2 (Top5Card)
                         ↓
4.1 + 4.2 → 6.1 (State Management) → 6.2 (Error Handling)
                                         ↓
                                    7.1, 7.2, 7.3 (Testing)
                                         ↓
                                    8.1, 8.2 (Documentation)
```

## Implementation Priority

**Phase 1 (Foundation):** Tasks 1.1, 1.2, 2.1, 2.2
**Phase 2 (API):** Tasks 3.1, 3.2, 4.3  
**Phase 3 (UI):** Tasks 4.1, 4.2, 5.1
**Phase 4 (Polish):** Tasks 5.2, 6.1, 6.2
**Phase 5 (Quality):** Tasks 7.1, 7.2, 7.3, 8.1, 8.2

## Estimated Total Time: 28 hours (3.5 developer days)