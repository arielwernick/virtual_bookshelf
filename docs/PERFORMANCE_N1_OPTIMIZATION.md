# Home Page N+1 Query Optimization

## Summary
Fixed N+1 query pattern on the home page by creating a single optimized query that JOINs shelves and items.

## Problem
The home page was fetching demo shelves in a loop, causing an N+1 query pattern:
- 1 query to fetch all shelves
- N additional queries to fetch items for each shelf

For 5 demo shelves, this resulted in **6 database queries**.

## Solution
Created `getShelvesWithItems()` function that uses a single SQL query with a LATERAL JOIN to fetch both shelves and their items in one database call.

### Key Implementation Details

**New Function:** `lib/db/queries.ts::getShelvesWithItems()`
- Uses PostgreSQL's `LATERAL` join to efficiently fetch limited items per shelf
- Leverages `json_agg()` to aggregate items as JSON array
- Respects limits for both shelves and items per shelf
- Returns strongly-typed `ShelfWithItems[]` result

**Updated Page:** `app/page.tsx::getDemoShelvesData()`
- Replaced N+1 pattern with single optimized query call
- Maintained backwards compatibility with legacy single-shelf mode

### SQL Query Pattern
```sql
SELECT 
  s.id as shelf_id,
  s.user_id,
  s.name,
  -- ... other shelf fields
  COALESCE(
    json_agg(
      CASE WHEN i.id IS NOT NULL THEN
        json_build_object(...)
      END
      ORDER BY i.order_index ASC
    ) FILTER (WHERE i.id IS NOT NULL),
    '[]'::json
  ) as items
FROM (
  SELECT * FROM shelves
  WHERE user_id = ${userId} AND is_public = true
  ORDER BY created_at DESC
  LIMIT ${maxShelves}
) s
LEFT JOIN LATERAL (
  SELECT * FROM items
  WHERE shelf_id = s.id
  ORDER BY order_index ASC
  LIMIT ${maxItemsPerShelf}
) i ON true
GROUP BY s.id, s.user_id, s.name, ...
```

## Performance Impact

### Before Optimization
- **Queries:** 6 (1 for shelves + 5 for items)
- **Pattern:** N+1

### After Optimization
- **Queries:** 1
- **Pattern:** Single JOIN with aggregation
- **Improvement:** 83% reduction in database queries (6 → 1)

### Query Count Scaling
| Shelves | Before | After | Reduction |
|---------|--------|-------|-----------|
| 1       | 2      | 1     | 50%       |
| 5       | 6      | 1     | 83%       |
| 10      | 11     | 1     | 91%       |

## Database Index
The optimization leverages the existing composite index on `items(shelf_id, order_index)`:
```sql
CREATE INDEX IF NOT EXISTS idx_items_order ON items(shelf_id, order_index);
```

This index was already present in the schema (created during initial setup) and is critical for:
- Efficient filtering by `shelf_id` in the LATERAL join
- Ordered retrieval by `order_index`

## Testing
- Added 5 comprehensive unit tests in `lib/db/queries.test.ts`
- All existing tests pass (507 tests)
- Verified correct data transformation from SQL result to TypeScript types

## Files Changed
1. `lib/types/shelf.ts` - Added `ShelfWithItems` interface
2. `lib/db/queries.ts` - Added `getShelvesWithItems()` function
3. `app/page.tsx` - Updated to use optimized query
4. `lib/db/queries.test.ts` - Added unit tests
5. `lib/db/MIGRATION_005_n1_query_optimization.sql` - Documentation

## Backwards Compatibility
✅ The legacy single-shelf mode (using `DEMO_SHELF_TOKEN`) still works unchanged
✅ All existing functionality preserved
✅ API contracts unchanged

## Future Considerations
- Consider applying similar optimization to other pages that fetch multiple shelves
- Monitor query performance in production with database query logging
- Potential for adding caching layer if needed (out of scope for this optimization)
