# Task: Share Public Shelf Feature

## Objective
Add the ability for users to share a read-only public link of their bookshelf. Visitors should be able to view items and notes but without any edit capabilities.

## Requirements
1. Generate a unique, permanent share token for each user shelf
2. Create a public share link with pattern `/s/[shareToken]`
3. Add a "Share Shelf" button/modal on the public shelf page
4. Share modal should display:
   - Shareable URL (copyable)
   - Embed code (if needed in future)
5. The shared public view should show:
   - All items in a read-only grid
   - Item details and notes when clicked
   - NO edit buttons or delete options
   - Clean, minimal header showing it's a shared shelf
6. Allow viewing without authentication

## Success Criteria
- [ ] Share token added to users table and generated on user creation
- [ ] Query function to get user by share token
- [ ] API endpoint `/api/shelf/share/[shareToken]` to fetch shelf data
- [ ] New route `/s/[shareToken]` for shared shelf viewing
- [ ] "Share Shelf" button added to public shelf page
- [ ] Share modal with copy-to-clipboard functionality
- [ ] Shared view is identical to public view but with clear attribution
- [ ] No edit buttons visible on shared view
