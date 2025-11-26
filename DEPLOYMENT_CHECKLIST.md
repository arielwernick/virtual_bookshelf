# Deployment Checklist: Google OAuth & Multi-Shelf

Use this checklist to deploy to staging and production.

---

## Pre-Deployment (LOCAL TESTING)

### Environment & Dependencies
- [ ] Google OAuth credentials obtained from Google Cloud Console
- [ ] `.env.local` has all required variables:
  - [ ] `GOOGLE_CLIENT_ID`
  - [ ] `GOOGLE_CLIENT_SECRET`
  - [ ] `GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback`
- [ ] `npm install` run successfully
- [ ] No TypeScript errors: `npm run build`
- [ ] No ESLint errors: `npm run lint`

### Database Preparation
- [ ] Database backup taken (if migrating existing data)
- [ ] Review `MIGRATION_001_google_oauth.sql` if existing DB
- [ ] Review `schema.sql` if fresh DB
- [ ] Test queries ready to verify migration

### Local Testing
- [ ] `npm run dev` starts without errors
- [ ] Home page loads: `http://localhost:3000`
- [ ] Login page loads: `http://localhost:3000/login`
- [ ] Google OAuth button renders correctly
- [ ] Full OAuth flow tested:
  - [ ] Click "Get Started"
  - [ ] Redirected to `/login`
  - [ ] Click "Sign in with Google"
  - [ ] Google consent screen appears
  - [ ] After approval, redirected to `/dashboard`
- [ ] Dashboard loads with authenticated user:
  - [ ] User email displayed in header
  - [ ] "Create Shelf" button visible
  - [ ] "Sign Out" button works
- [ ] Create shelf works:
  - [ ] Form displays name + description fields
  - [ ] Submit creates shelf
  - [ ] Redirected to shelf page
  - [ ] Shelf appears in database
- [ ] Shelf management works:
  - [ ] Can view shelf details
  - [ ] Can edit shelf metadata
  - [ ] Can delete shelf (with confirmation)
  - [ ] Can share shelf

### Database Verification (Local)
Run these queries to verify structure:
```sql
-- Users table has new columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Should include: id, username, email, password_hash, google_id, share_token, etc.

-- Shelves table exists
SELECT * FROM shelves LIMIT 1;

-- Items table has shelf_id
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'items' 
ORDER BY ordinal_position;

-- Should include: id, shelf_id, user_id, type, title, creator, etc.
```

---

## Staging Deployment

### Pre-Deployment
- [ ] Feature branch ready: `feature/google-auth-workos`
- [ ] All commits clean and well-documented
- [ ] No sensitive data in commits
- [ ] README updated if needed

### GitHub
- [ ] Create Pull Request to staging branch
- [ ] Code review completed
- [ ] All CI checks passing
- [ ] Merge to staging branch

### Vercel (Staging)
- [ ] Staging environment exists or created
- [ ] Add environment variables to Vercel:
  - [ ] `GOOGLE_CLIENT_ID`
  - [ ] `GOOGLE_CLIENT_SECRET`
  - [ ] `GOOGLE_REDIRECT_URI=https://staging.yourdomain.com/api/auth/google/callback`
- [ ] Update Google Console:
  - [ ] Add staging callback URI: `https://staging.yourdomain.com/api/auth/google/callback`
- [ ] Deploy triggers automatically (or manually trigger)
- [ ] Deployment completes successfully
- [ ] No errors in Vercel logs

### Database (Staging)
- [ ] Create staging database (separate from production)
- [ ] If fresh database:
  - [ ] Run `schema.sql` in Neon SQL Editor
  - [ ] Verify tables created
- [ ] If migrating from existing:
  - [ ] Run `MIGRATION_001_google_oauth.sql`
  - [ ] Verify migration completed
  - [ ] Test queries pass

### Staging Testing (QA)
#### OAuth Flow
- [ ] Visit staging URL
- [ ] "Get Started" button works
- [ ] Google OAuth consent screen appears
- [ ] Can complete Google login
- [ ] Session created with google_id
- [ ] Redirected to dashboard
- [ ] Email displayed correctly

#### Dashboard
- [ ] Loads without errors
- [ ] Shows user email
- [ ] "Create Shelf" form visible
- [ ] Create shelf with name only
- [ ] Create shelf with name + description
- [ ] Shelves appear in grid
- [ ] Click shelf navigates to shelf page
- [ ] Sign out works

#### Shelf Management
- [ ] View shelf page
- [ ] Edit button appears (if owner)
- [ ] Edit name and save
- [ ] Edit description and save
- [ ] Delete shelf shows confirmation
- [ ] Delete shelf removes from grid
- [ ] Share button works
- [ ] Public shelf accessible via share token

#### Data Verification
```sql
-- Check user created with google_id
SELECT id, email, google_id FROM users LIMIT 1;

-- Check shelf created
SELECT id, user_id, name FROM shelves LIMIT 1;

-- Check items still accessible
SELECT id, shelf_id, title FROM items LIMIT 1;
```

#### Browser DevTools
- [ ] No console errors
- [ ] No network errors (all 200/3xx status)
- [ ] Session cookie set: `bookshelf_session`
- [ ] Cookie is httpOnly
- [ ] Cookie is Secure (HTTPS)
- [ ] Cookie domain is correct

#### Performance
- [ ] Dashboard loads < 2 seconds
- [ ] Shelf page loads < 2 seconds
- [ ] No memory leaks (check DevTools)

### Sign-Off
- [ ] QA tests passed
- [ ] No critical bugs found
- [ ] Performance acceptable
- [ ] Ready for production

---

## Production Deployment

### Pre-Deployment
- [ ] All staging tests passed
- [ ] Bugs fixed and re-tested
- [ ] Documentation updated
- [ ] Feature branch up-to-date with main

### GitHub
- [ ] Create Pull Request from `feature/google-auth-workos` to `main`
- [ ] Final code review
- [ ] All CI checks passing
- [ ] At least one approval
- [ ] Merge to main branch

### Google Cloud Console
- [ ] Production callback URI configured:
  - [ ] `https://yourdomain.com/api/auth/google/callback`
- [ ] Credentials valid and not expired
- [ ] Authorized JavaScript origins include your domain

### Vercel (Production)
- [ ] Environment variables updated for production:
  - [ ] `GOOGLE_CLIENT_ID` (production value)
  - [ ] `GOOGLE_CLIENT_SECRET` (production value)
  - [ ] `GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback`
- [ ] Deploy main branch
- [ ] Deployment succeeds
- [ ] No errors in Vercel logs
- [ ] Health check: Can access homepage

### Database (Production)
- [ ] Production database backup taken
- [ ] If fresh database:
  - [ ] Run `schema.sql` in Neon SQL Editor
  - [ ] Verify all tables created
- [ ] If migrating existing database:
  - [ ] Backup taken before migration
  - [ ] Run `MIGRATION_001_google_oauth.sql`
  - [ ] Verify migration step-by-step:
    ```sql
    -- Users updated
    SELECT COUNT(*) as user_count FROM users WHERE email IS NOT NULL;
    
    -- Shelves created
    SELECT COUNT(*) as shelf_count FROM shelves;
    
    -- Items migrated
    SELECT COUNT(*) as item_count FROM items WHERE shelf_id IS NOT NULL;
    ```

### Production Testing (Smoke Test)
#### OAuth
- [ ] Visit production URL
- [ ] "Get Started" → Google login works
- [ ] User created with google_id
- [ ] Session persists across page reloads

#### Dashboard
- [ ] Loads with authenticated user
- [ ] Create shelf works
- [ ] Multiple shelves work
- [ ] Dashboard reflects new shelf

#### Data
- [ ] Check database, new user exists
- [ ] Check database, new shelf exists
- [ ] Legacy data (if any) still accessible

#### Monitoring
- [ ] Check Vercel logs for errors
- [ ] Check Sentry/error tracking (if enabled)
- [ ] Monitor performance metrics

### Announcement
- [ ] Update website/docs if needed
- [ ] Notify users of OAuth change
- [ ] Create blog post if major feature
- [ ] Update support docs

---

## Post-Deployment

### Monitoring (First 24 Hours)
- [ ] Check error logs hourly
- [ ] Monitor database size
- [ ] Monitor API response times
- [ ] Check user signups working

### Monitoring (First Week)
- [ ] Daily error log review
- [ ] Database backup verification
- [ ] User feedback review
- [ ] Performance metrics stable

### Rollback Plan (If Needed)
1. Revert to previous version: `git revert <commit>`
2. Push to main (or switch previous version in Vercel)
3. Restore database backup if data corruption
4. Test OAuth disabled on old route
5. Notify users of issue

---

## Success Criteria

✅ All tests passed
✅ No critical errors in logs
✅ Users can sign in with Google
✅ Users can create multiple shelves
✅ Dashboard shows all shelves
✅ Existing data preserved (if migrating)
✅ Performance acceptable
✅ No security issues

---

## Rollback Checklist (If Needed)

- [ ] Identify reason for rollback
- [ ] Create rollback ticket
- [ ] Revert code to previous version
- [ ] Restore database backup (if needed)
- [ ] Notify team and users
- [ ] Monitor rollback environment
- [ ] Investigate root cause
- [ ] Document lessons learned

---

## Sign-Off

- [ ] Feature Owner: ___________________ Date: ___________
- [ ] Tech Lead: ___________________ Date: ___________
- [ ] QA: ___________________ Date: ___________
- [ ] DevOps: ___________________ Date: ___________

---

## Notes

```
[Space for deployment notes, issues, blockers, etc.]




```

---

## References

- Feature branch: `feature/google-auth-workos`
- Commits: 14 feature commits
- Documentation: See `QUICK_START.md` and `GOOGLE_AUTH_IMPLEMENTATION_COMPLETE.md`
- Issues: See GitHub issues if any
- Rollback commit: [previous stable commit SHA]
