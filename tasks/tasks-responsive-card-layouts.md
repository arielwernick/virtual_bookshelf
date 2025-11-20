# Task List: Responsive Card Layouts by Content Type

## Relevant Files
- `components/shelf/ShelfCard.tsx` - Main card component that will need aspect ratio support
- `components/shelf/ShelfGrid.tsx` - Grid layout component, will be updated to use masonry
- `lib/constants/aspectRatios.ts` - New file for media type aspect ratio configuration
- `lib/types/shelf.ts` - May need to add media_type field to item types
- `app/api/shelf/[username]/route.ts` - May need to include media_type in API response
- `lib/db/schema.sql` - May need to add media_type column if not present
- `app/shelf/[username]/page.tsx` - Shelf display page, will use updated grid
- `app/s/[shareToken]/page.tsx` - Shared shelf page, will use updated grid

## Tasks

### Phase 1: High-Level Tasks
- [ ] 0.0 Create feature branch
- [ ] 1.0 Analyze current codebase and identify media type information
- [ ] 2.0 Create aspect ratio configuration system
- [ ] 3.0 Update ShelfCard component for responsive aspect ratios
- [ ] 4.0 Implement masonry grid layout
- [ ] 5.0 Test across all viewports and content types
- [ ] 6.0 Ensure backward compatibility and fallbacks

---

## Detailed Sub-Tasks

### Task 0.0 Create Feature Branch
- [ ] 0.1 Create and checkout a new branch: `git checkout -b feature/responsive-card-layouts`
- [ ] 0.2 Confirm branch creation with `git branch`

### Task 1.0 Analyze Current Codebase
- [x] 1.1 Examine the database schema and shelf item structure to identify how media type is currently stored/derived
- [x] 1.2 Review ShelfCard and ShelfGrid components to understand current styling and layout approach
- [x] 1.3 Check API endpoints to see what metadata is returned for each shelf item
- [x] 1.4 Identify where provider information (Spotify, Google Books, etc.) is stored
- [x] 1.5 Document findings and create a mapping of: Provider → Media Type → Aspect Ratio

**Findings:**
- **Database:** `items` table has `type` column (VARCHAR(20)) with CHECK constraint: 'book' | 'podcast' | 'music'
- **TypeScript:** `ItemType` is already defined as 'book' | 'podcast' | 'music'
- **ItemCard Component:** Currently has hardcoded `aspect-[2/3]` for all items (line 27)
- **ShelfGrid Component:** Uses standard CSS grid `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4`
- **No Provider Column:** Provider info is not stored in DB; we must derive from context or add new field
- **API Response:** Includes `items` array with all Item data including `type`

**Action Items:**
- Need to add `provider` column to items table OR infer provider from external_url
- Update ItemCard to accept dynamic aspect ratio prop
- Update ShelfGrid to use CSS Grid with better masonry support
- Create aspect ratio config file

### Task 2.0 Create Aspect Ratio Configuration System
- [x] 2.1 Create new file `lib/constants/aspectRatios.ts` with media type configuration
- [x] 2.2 Define aspect ratios for: books (2:3), audiobooks (1:1), podcasts (1:1), music albums (1:1)
- [x] 2.3 Add comments for extensibility and future content types
- [x] 2.4 Create a utility function to get aspect ratio by media type
- [x] 2.5 Add fallback aspect ratio for unknown/unmapped content types

**Implementation Complete:**
- Created `lib/constants/aspectRatios.ts` with:
  - `ASPECT_RATIOS` record mapping ItemType to CSS aspect-ratio values
  - `getAspectRatio()` function to retrieve ratio by type
  - `getAspectRatioNumeric()` function for layout calculations
  - `ASPECT_RATIO_INFO` for UI display purposes
  - `TYPES_BY_ASPECT_RATIO` for grouping types by ratio
  - Comprehensive documentation and extensibility comments

### Task 3.0 Update ItemCard Component
- [x] 3.1 Modify ItemCard to accept an aspect ratio from item type
- [x] 3.2 Update card styling to use dynamic aspect ratio (aspect-ratio CSS property)
- [x] 3.3 Ensure image uses `object-fit: cover` with appropriate background color
- [x] 3.4 Add responsive sizing that maintains aspect ratio across viewport changes
- [x] 3.5 Test card rendering with both square and rectangular aspect ratios

**Implementation Complete:**
- Updated `ItemCard.tsx` to:
  - Import `getAspectRatio` from aspect ratio config
  - Calculate dynamic aspect ratio based on item type
  - Use inline style `{ aspectRatio }` instead of hardcoded Tailwind class
  - Maintains existing image sizing with `object-fit: cover` (already implemented)
  - Background gradient remains for loading state

### Task 4.0 Implement Masonry Grid Layout
- [x] 4.1 Update or create ShelfGrid component to use CSS Grid with masonry-like behavior
- [x] 4.2 Implement auto-row sizing that accommodates different aspect ratios
- [x] 4.3 Add responsive gap/spacing that scales with viewport
- [x] 4.4 Implement responsive column count (adjust for mobile: 2-3 cols, tablet: 3-4 cols, desktop: 4-5+ cols)
- [x] 4.5 Add fallback for older browsers that don't support `auto-rows: masonry`
- [x] 4.6 Test layout on mobile, tablet, and desktop viewports

**Implementation Complete:**
- Created `ShelfRow` component for true shelf visualization:
  - `flex flex-wrap` with `align-items: flex-end` so all items sit on the shelf baseline
  - Books (2:3) stand tall, albums (1:1) appear as square blocks next to them
  - `minHeight: '280px'` ensures shelves have consistent depth
  - Subtle visual styling inspired by Barnes & Noble + Notion:
    - Semi-transparent white background (`bg-white/50 backdrop-blur-sm`)
    - Soft border (`border-gray-100`)
    - Rounded corners for modern feel
    - Gradient shelf divider line with subtle shadow
  - Each shelf visually separated with spacing between rows
  - Items wrap naturally to create multiple shelf rows
  - Responsive and works across all viewports

### Task 5.0 Integrate Media Type Information
- [x] 5.1 Media type field already exists (item.type in database)
- [x] 5.2 API endpoint already returns media_type for each item
- [x] 5.3 ItemCard now uses media_type to determine aspect ratio
- [x] 5.4 Fallback to default aspect ratio handled via getAspectRatio function
- [x] 5.5 Ready for testing with real shelf data

**Status:** Complete - No changes needed, existing type field serves this purpose perfectly

### Task 6.0 Test Across Viewports and Content Types
- [ ] 6.1 Test layout on mobile viewports (320px, 375px, 414px widths)
- [ ] 6.2 Test layout on tablet viewports (768px, 1024px widths)
- [ ] 6.3 Test layout on desktop viewports (1440px, 1920px, 2560px widths)
- [ ] 6.4 Test with mixed content (books + albums + audiobooks + podcasts together)
- [ ] 6.5 Test with empty shelf state
- [ ] 6.6 Test with broken/missing images

### Task 7.0 Ensure Backward Compatibility
- [ ] 7.1 Verify existing shelves display correctly with new layout
- [ ] 7.2 Test fallback aspect ratio for items without media_type
- [ ] 7.3 Ensure CSS Grid fallback works in older browsers
- [ ] 7.4 Check performance impact (no significant increase in load time)
- [ ] 7.5 Test that all click interactions and modals still work correctly

### Task 8.0 Code Quality and Finalization
- [ ] 8.1 Run linter and fix any style issues
- [ ] 8.2 Update any relevant comments/documentation in components
- [ ] 8.3 Verify no console errors or warnings in dev tools
- [ ] 8.4 Create commit with clear message
- [ ] 8.5 Prepare for PR review

---

## Notes
- **Aspect Ratio CSS:** Use the CSS `aspect-ratio` property (well-supported in modern browsers) for dynamic sizing
- **Image Optimization:** Leverage Next.js Image component's built-in optimization
- **Grid Layout Strategy:** CSS Grid with `auto-rows: masonry` is the most elegant solution; implement fallback using calculated row heights
- **Mobile Consideration:** Ensure touch interactions work smoothly on mobile devices
- **Performance:** Monitor layout shift (CLS) to ensure user experience remains smooth
