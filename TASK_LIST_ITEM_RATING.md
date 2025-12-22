# Item Rating System - Implementation Plan

## Phase 1: Database Foundation

### 1. Database Schema & Migration
**Parent Task**: Set up database infrastructure for ratings

#### 1.1 Add rating column to items table
- **What**: Add `rating INTEGER CHECK (rating >= 0 AND rating <= 5)` column to items table
- **File**: `lib/db/schema.sql`
- **Verification**: Run schema update in Neon console, verify column exists
- **Dependencies**: None

### 2. TypeScript Type Updates  
**Parent Task**: Update all TypeScript interfaces to support ratings

#### 2.1 Update Item interface with rating field
- **What**: Add `rating?: number | null` to Item interface
- **File**: `lib/types/shelf.ts`
- **Verification**: No TypeScript errors, rating field available in Item type
- **Dependencies**: 1.1 complete

#### 2.2 Update CreateItemData interface
- **What**: Add optional `rating?: number` to CreateItemData
- **File**: `lib/types/shelf.ts`  
- **Verification**: Can pass rating in item creation, TypeScript validates
- **Dependencies**: 2.1 complete

#### 2.3 Update UpdateItemData interface
- **What**: Add optional `rating?: number` to UpdateItemData
- **File**: `lib/types/shelf.ts`
- **Verification**: Can pass rating in item updates, TypeScript validates
- **Dependencies**: 2.1 complete

## Phase 2: Core Components

### 3. Create Star Rating Components
**Parent Task**: Build reusable star rating UI components

#### 3.1 Create StarDisplay component (read-only)
- **What**: Component to display 0-5 stars (filled/unfilled) for given rating
- **File**: `components/ui/StarDisplay.tsx`
- **Props**: `rating: number | null, size?: 'sm' | 'md' | 'lg'`
- **Verification**: Renders correct number of filled/unfilled stars
- **Dependencies**: None

#### 3.2 Create StarInput component (interactive)
- **What**: Component for setting ratings with click interaction
- **File**: `components/ui/StarInput.tsx`
- **Props**: `value: number | null, onChange: (rating: number | null) => void, size?: 'sm' | 'md' | 'lg'`
- **Verification**: Can click to set rating, visual feedback works
- **Dependencies**: 3.1 complete (may reuse star rendering logic)

### 4. Database Query Updates
**Parent Task**: Update all database operations to handle rating field

#### 4.1 Update item creation queries
- **What**: Modify `createItem` function to accept and store rating
- **File**: `lib/db/queries.ts`
- **Verification**: Can create items with rating, stored in database correctly
- **Dependencies**: 1.1, 2.2 complete

#### 4.2 Update item update queries  
- **What**: Modify `updateItem` function to accept and update rating
- **File**: `lib/db/queries.ts`
- **Verification**: Can update item rating, changes persist in database
- **Dependencies**: 1.1, 2.3 complete

## Phase 3: API Integration

### 5. API Endpoint Updates
**Parent Task**: Update all item-related API endpoints to support ratings

#### 5.1 Update POST /api/items endpoint
- **What**: Accept rating field in request body, pass to createItem
- **File**: `app/api/items/route.ts`
- **Verification**: Can create items with rating via API
- **Dependencies**: 4.1 complete

#### 5.2 Update PUT /api/items/[id] endpoint
- **What**: Accept rating field in request body, pass to updateItem  
- **File**: `app/api/items/[id]/route.ts`
- **Verification**: Can update item rating via API
- **Dependencies**: 4.2 complete

## Phase 4: UI Integration

### 6. Integrate Rating into Existing Components
**Parent Task**: Add rating functionality to all relevant UI components

#### 6.1 Add rating display to ItemCard
- **What**: Show StarDisplay component on ItemCard when rating exists
- **File**: `components/shelf/ItemCard.tsx`
- **Design**: Small stars below creator name, before notes indicator
- **Verification**: Ratings display correctly on shelf grids
- **Dependencies**: 3.1 complete

#### 6.2 Add rating input to AddItemForm
- **What**: Include StarInput component in add item form
- **File**: `components/shelf/AddItemForm.tsx`
- **Design**: Add rating field after creator input
- **Verification**: Can set rating when adding new items
- **Dependencies**: 3.2, 5.1 complete

#### 6.3 Add rating input to ItemModal  
- **What**: Include StarInput component in edit item modal
- **File**: `components/shelf/ItemModal.tsx`
- **Design**: Add rating field in appropriate position
- **Verification**: Can edit rating for existing items
- **Dependencies**: 3.2, 5.2 complete

## Phase 5: Testing & Polish

### 7. Comprehensive Testing
**Parent Task**: Ensure feature works correctly and doesn't break existing functionality

#### 7.1 Test database migration
- **What**: Verify schema changes work without data loss
- **Verification**: Existing items unaffected, new rating column accessible
- **Dependencies**: 1.1 complete

#### 7.2 Test API endpoints
- **What**: Test all CRUD operations with rating field
- **Verification**: Can create, read, update items with ratings via API
- **Dependencies**: 5.1, 5.2 complete

#### 7.3 Test UI components
- **What**: Test StarDisplay and StarInput components in isolation
- **Verification**: Components work correctly, handle edge cases
- **Dependencies**: 3.1, 3.2 complete

#### 7.4 Test full user workflow
- **What**: End-to-end testing of rating feature
- **Verification**: Can add ratings to items, see them on shelves, edit them
- **Dependencies**: 6.1, 6.2, 6.3 complete

#### 7.5 Test backward compatibility
- **What**: Ensure existing functionality works unchanged
- **Verification**: Existing items without ratings display normally
- **Dependencies**: All previous tasks complete

## Implementation Notes

### Database Migration Strategy
- Add column with default `NULL` value (non-breaking)
- Existing items will have `rating = NULL` (no rating)
- New items can optionally include rating

### Visual Design Considerations
- Stars should be small and subtle (not overwhelming the card)
- Use consistent sizing across all components
- Support dark mode styling
- Consider placement to not interfere with existing layout

### Error Handling
- Validate rating is 0-5 integer on both client and server
- Handle `null` rating gracefully (show no stars)
- Provide clear feedback for invalid ratings

### Performance Considerations  
- Star components should be lightweight
- Avoid re-rendering stars unnecessarily
- Consider SVG icons vs Unicode stars for consistency

## Success Criteria
- [ ] Can add rating when creating items
- [ ] Can edit rating for existing items  
- [ ] Ratings display correctly on item cards
- [ ] No breaking changes to existing functionality
- [ ] All TypeScript types are accurate
- [ ] Database performance unaffected