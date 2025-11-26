# Quick Start: Google OAuth & Multi-Shelf

## 1. Setup Environment Variables

Add to `.env.local`:
```
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

## 2. Apply Database Migration

**For existing databases** (has users/items):
1. Go to Neon SQL Editor
2. Copy entire content of `lib/db/MIGRATION_001_google_oauth.sql`
3. Execute
4. Verify with test queries

**For fresh databases**:
1. Go to Neon SQL Editor
2. Copy entire content of `lib/db/schema.sql`
3. Execute

## 3. Test the Flow

### Local Development
```bash
npm run dev
```

Visit: `http://localhost:3000`

### Test Scenario
1. Click "Get Started" button
2. You're redirected to `/login`
3. Click "Sign in with Google"
4. Complete Google auth
5. You should see `/dashboard` with shelves

## 4. Create a Shelf
1. On dashboard, click "+ Create Shelf"
2. Enter shelf name (required)
3. Add optional description
4. Click "Create Shelf"
5. You're redirected to shelf page

## 5. Verify Setup

### Database Check
Run these in Neon SQL Editor:
```sql
-- Check users table has new columns
SELECT id, email, google_id, username FROM users LIMIT 1;

-- Check shelves table exists
SELECT id, user_id, name FROM shelves LIMIT 1;

-- Check items has shelf_id
SELECT id, shelf_id, title FROM items LIMIT 1;
```

### Browser Check
1. Sign in with Google
2. Check network tab - verify no errors
3. Check Application tab - verify `bookshelf_session` cookie exists
4. Check database - new user row created with google_id

---

## Key Routes

### Authentication
- `GET /login` - Login page
- `GET /api/auth/google` - Start OAuth flow
- `GET /api/auth/google/callback` - OAuth callback (redirects to dashboard)
- `POST /api/auth/logout` - Logout

### User Dashboard
- `GET /dashboard` - User's all shelves
- `GET /api/shelf/dashboard` - API (returns shelves + item counts)

### Shelf Management
- `POST /api/shelf/create` - Create shelf
- `GET /api/shelf/[shelfId]` - View shelf
- `PATCH /api/shelf/[shelfId]` - Update shelf
- `DELETE /api/shelf/[shelfId]` - Delete shelf
- `GET /api/shelf/share/[shareToken]` - Public shelf

### Items
- `POST /api/items` - Create item (needs shelf_id)
- `PATCH /api/items/[id]` - Update item
- `DELETE /api/items/[id]` - Delete item
- `POST /api/items/reorder` - Reorder items

---

## Common Tasks

### Debug: User not created
```sql
SELECT * FROM users WHERE email = 'user@example.com';
```

### Debug: Session not set
Check browser cookies for `bookshelf_session` cookie.

### Debug: OAuth fails
1. Verify Google credentials in `.env.local`
2. Check Google Console redirect URI matches exactly
3. Clear browser cookies and try again

### Test API directly
```bash
# Get dashboard (if authenticated)
curl -b "bookshelf_session=YOUR_TOKEN" http://localhost:3000/api/shelf/dashboard

# Create shelf
curl -X POST http://localhost:3000/api/shelf/create \
  -H "Content-Type: application/json" \
  -b "bookshelf_session=YOUR_TOKEN" \
  -d '{"name":"My Shelf","description":"Test"}'
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Shelf not found" 404 | Check shelf UUID is correct, verify user owns it |
| "Unauthorized" 401 | Missing/invalid session cookie, sign in again |
| "Forbidden" 403 | User doesn't own shelf, verify permissions |
| OAuth redirect loop | Check Google credentials, clear cookies |
| "Invalid state token" | CSRF protection triggered, clear cookies and retry |
| Database errors | Run migration script, verify schema applied |

---

## Next Steps

- [ ] Test full authentication flow
- [ ] Create test shelves
- [ ] Integrate item operations (add/edit/delete)
- [ ] Test public sharing
- [ ] Deploy to staging
- [ ] Get user feedback
- [ ] Deploy to production

---

## Files to Review

**If issues arise, check these in order**:

1. `.env.local` - Credentials correct?
2. `lib/db/schema.sql` or `MIGRATION_001_google_oauth.sql` - Migration applied?
3. `app/api/auth/google/route.ts` - OAuth initiation correct?
4. `app/api/auth/google/callback/route.ts` - Callback handling correct?
5. `app/dashboard/page.tsx` - Dashboard loading shelves?
6. `app/shelf/[shelfId]/page.tsx` - Shelf detail page working?

---

## Support

See full docs in:
- `GOOGLE_AUTH_PRD.md` - Requirements
- `GOOGLE_AUTH_TASKS.md` - Detailed task breakdown
- `GOOGLE_AUTH_IMPLEMENTATION_COMPLETE.md` - Full implementation guide
- `GOOGLE_AUTH_PROGRESS.md` - What was completed
- `MIGRATION_GOOGLE_AUTH.md` - Database migration details
