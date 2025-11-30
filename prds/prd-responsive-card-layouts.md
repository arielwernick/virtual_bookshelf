# PRD: Responsive Card Layouts by Content Type

## Introduction/Overview
The Virtual Bookshelf currently displays all media items (books, audiobooks, music albums, podcasts) using identical card dimensions, which creates visual distortion for content with different natural aspect ratios. Spotify albums are naturally square (1:1), while Google Books are naturally rectangular (2:3). This feature introduces content-aware card layouts that respect these natural aspect ratios, improving visual presentation and user experience across all media types and providers.

## Goals
1. Improve visual presentation by using aspect ratios appropriate to each content type
2. Provide a unified, professional appearance across the shelf using masonry layout
3. Create an extensible system for future content types and providers
4. Maintain consistent user experience across all existing shelves without requiring user action

## User Stories
- As a user, I want my bookshelf to look professional and properly proportioned, with book covers appearing as tall rectangles and album covers appearing as squares
- As a user, I want the layout to automatically adjust to my screen size while maintaining the correct proportions for each item
- As a shelf curator, I want new content providers to be able to specify their own aspect ratios without code changes
- As a developer, I want a clear, extensible system for managing item dimensions across different content types

## Functional Requirements
1. The system must support multiple aspect ratio configurations:
   - Books: 2:3 (portrait rectangle)
   - Audiobooks: 1:1 (square)
   - Podcasts: 1:1 (square)
   - Music/Albums: 1:1 (square)
2. The shelf grid must use CSS Grid Masonry layout that automatically adjusts to different aspect ratios
3. All items must use `object-fit: cover` with a background color to maintain proper dimensions while preserving image content
4. A media type configuration system must exist to define aspect ratios for each content type
5. All existing shelves must automatically display with the new layout on next load
6. The layout must be responsive and work on mobile, tablet, and desktop viewports
7. Item cards must maintain their proportions while resizing based on viewport width
8. The system must gracefully handle missing or broken images

## Non-Goals (Out of Scope)
- Allowing users to customize aspect ratios per item
- Adding animations or transitions to the layout changes
- Creating an admin interface to manage aspect ratios (configuration will be code-based)
- Supporting custom aspect ratios per provider (content type drives the aspect ratio)
- Migrating historical user data or resetting existing shelves

## Design Considerations
- **Masonry Layout:** Use CSS Grid with `auto-rows: masonry` (or fallback to `grid-auto-rows: <dynamic-height>`) to handle varying aspect ratios
- **Mobile-First:** Design should work seamlessly from 320px width upward
- **Graceful Degradation:** If masonry isn't supported, fallback to standard grid with consistent sizing
- **Image Handling:** Use `object-fit: cover` to maintain aspect ratio while filling the card container
- **Spacing:** Maintain consistent gap between cards across all viewport sizes

## Technical Considerations
- Utilize Next.js Image component for optimization
- Create a configuration/constants file for aspect ratios by media type
- Update the shelf data structure to include or derive media type information
- Consider CSS Grid for layout (native browser support, no external libraries needed)
- May need to adjust existing ShelfCard component to accept dynamic aspect ratio
- Database schema may need a `media_type` field on shelf items if not already present

## Success Metrics
1. All items display with correct aspect ratios (square for albums/audiobooks/podcasts, rectangle for books)
2. Masonry layout loads without visual jumps or layout shifts
3. Layout is responsive and maintains proportions across all tested viewport sizes
4. No broken images or error states visible to users
5. Page load performance is not negatively impacted
6. All existing shelves automatically display with new layout

## Open Questions
1. Should the media type be stored in the database, derived from the source provider, or configured elsewhere?
2. What is the expected card width range for different viewports (mobile, tablet, desktop)?
3. Should there be a fallback mechanism if media_type data is missing for existing items?
4. Are there any other content types or providers beyond books, audiobooks, podcasts, and music albums?
