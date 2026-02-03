# Item Rating System PRD

## Overview
Add a 0-5 star rating system to Virtual Bookshelf items to allow users to rate and display their opinions about books, podcasts, music, and other content.

## Problem
Currently, users are manually adding ratings in their item notes (e.g., "[Rating: 5] This was one of the most impactful..."). This approach is:
- Inconsistent in format
- Not searchable or filterable
- Not visually prominent
- Requires parsing text to extract ratings

## Solution
Implement a dedicated rating field with star display that:
- Allows users to set 0-5 star ratings on items
- Displays stars visually on item cards
- Stores ratings as a separate database field
- Provides consistent rating experience across all item types

## Target Users
- **Primary**: Existing Virtual Bookshelf users who want to rate their items
- **Secondary**: New users who expect modern rating functionality

## User Stories

### Core Rating Functionality
1. **As a user**, I want to set a 0-5 star rating for any item so I can express my opinion
2. **As a user**, I want to see star ratings displayed on item cards so I can quickly see my ratings
3. **As a user**, I want to edit existing ratings so I can update my opinion over time
4. **As a user**, I want to remove ratings (set to 0) so I can indicate "not rated"

### Visual Design
5. **As a user**, I want to see filled/unfilled stars so ratings are immediately recognizable
6. **As a user**, I want ratings to be visible but not overwhelming the item design
7. **As a user**, I want rating interactions to be intuitive (click stars to set rating)

## Technical Requirements

### Database Schema Changes
- Add `rating` field to `items` table as `INTEGER CHECK (rating >= 0 AND rating <= 5)`
- Default value: `NULL` (no rating)
- Migrate existing items with `rating = NULL`

### API Changes
- Update item creation/update endpoints to accept rating
- Add rating to all item response objects
- Maintain backward compatibility (rating optional)

### UI Components
- Add star display component (read-only and interactive modes)
- Integrate rating into ItemCard component
- Add rating input to AddItemForm and ItemModal
- Support dark mode styling

### Type Definitions
- Update `Item` interface with optional `rating?: number | null`
- Update `CreateItemData` and `UpdateItemData` interfaces
- Ensure type safety throughout

## Success Metrics
- 50%+ of items have ratings within 2 weeks of launch
- No performance degradation on shelf loading
- Zero breaking changes to existing functionality
- User feedback indicates improved item organization

## Technical Considerations

### Performance
- Rating queries should not slow down shelf loading
- Star rendering should be lightweight
- Database indexes may not be needed initially (low query volume)

### UX Design
- Stars should be visible but not dominate the card design
- Rating should be optional (users shouldn't feel forced to rate)
- Quick rating (hover/click) vs detailed rating modal

### Backward Compatibility
- Existing items continue working without ratings
- API responses include rating field (null for existing items)
- No breaking changes to current workflows

## Out of Scope
- Rating aggregation or statistics
- Public rating displays (keeping personal nature of shelves)
- Rating-based sorting/filtering (future enhancement)
- Rating imports from external services
- Bulk rating operations

## Implementation Phases

### Phase 1: Core Infrastructure
- Database schema update
- Type definition changes
- API endpoint modifications

### Phase 2: UI Components
- Star display component
- Rating input integration
- ItemCard rating display

### Phase 3: Polish & Testing
- Visual refinement
- Edge case handling
- Comprehensive testing

## Open Questions
1. Should rating be prominently displayed or subtle?
2. Should we support half-stars (0.5, 1.5, etc.) or integer-only?
3. How should rating interact with existing notes display?
4. Should we provide quick rating on hover or require click interaction?

## Dependencies
- Requires database migration
- May need coordination with ongoing podcast episodes feature
- Should consider future filtering/sorting features in design