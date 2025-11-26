# OAuth Sign-In Troubleshooting

## Symptoms

### 404 After "Continue with Google"
**Symptom**: Click "Continue with Google" → Google login → 404 error page

**Likely causes**:
1. Database migration not applied
2. `SESSION_SECRET` environment variable missing
3. `DATABASE_URL` environment variable missing
4. Google credentials invalid
5. User creation failing in database

## Debug Steps

### Step 1: Check Environment Variables
Verify `.env.local` has ALL of these:
```
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
DATABASE_URL=postgresql://user:password@host/database
SESSION_SECRET=your_secret_key_here
```

**Note**: `SESSION_SECRET` is required! Without it, session creation fails.

### Step 2: Test Session API
After you see the 404, check browser console. Open browser DevTools → Network tab and look for any failed requests.

Then run:
```bash
# Check if session is being set
curl http://localhost:3000/api/auth/debug
```

This should show either:
- `{"authenticated": true, ...}` - Session is set ✅
- `{"authenticated": false}` - Session not created ❌

### Step 3: Check Database Migration
In Neon SQL Editor, run:
```sql
-- Check if shelves table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'shelves';

-- Check users table has email column
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'email';

-- Verify email constraint
SELECT * FROM users LIMIT 1;
```

If these fail, run the migration:
1. Copy entire content of `lib/db/MIGRATION_001_google_oauth.sql`
2. Paste into Neon SQL Editor
3. Execute
4. Run checks again

### Step 4: Check Callback Logs
The callback logs helpful info. In your terminal where `npm run dev` is running, look for:
```
Email lookup result: { email: '...', userFound: false }
Creating new user: { email: '...', username: '...' }
User created: { userId: '...', email: '...' }
```

If you DON'T see these logs, the callback isn't being called. Check:
- Google redirect URI matches exactly: `http://localhost:3000/api/auth/google/callback`
- No typos in Google credentials
- Browser cookies enabled

### Step 5: Verify Dashboard Route
Once authenticated, check if `/dashboard` is accessible:
```bash
# Get session token from browser devtools
# Copy the bookshelf_session cookie value
export TOKEN="your_token_here"

# Test dashboard API
curl -H "Cookie: bookshelf_session=$TOKEN" \
  http://localhost:3000/api/shelf/dashboard
```

Should return:
```json
{
  "success": true,
  "data": {
    "user_id": "...",
    "email": "...",
    "shelves": []
  }
}
```

## Common Issues & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid state token` | CSRF token mismatch | Clear cookies, try again |
| `Missing authorization code` | OAuth params not passed | Check Google callback URL |
| `DATABASE_URL not set` | Missing env variable | Add to `.env.local` |
| `SESSION_SECRET not set` | Missing env variable | Add a random string to `.env.local` |
| `Failed to exchange token` | Invalid credentials | Verify Google Client ID/Secret |
| 404 on `/dashboard` | User not created | Check database for new user row |
| Redirects to `/login` | Session not set/verified | Check cookies, verify SECRET key |

## Complete Test Flow

1. **Clear browser data** (Cookies, Cache)
   - DevTools → Application → Clear storage

2. **Verify `.env.local` has**:
   - GOOGLE_CLIENT_ID
   - GOOGLE_CLIENT_SECRET
   - GOOGLE_REDIRECT_URI
   - DATABASE_URL
   - SESSION_SECRET

3. **Run dev server**:
   ```bash
   npm run dev
   ```

4. **Open browser**:
   ```
   http://localhost:3000
   ```

5. **Click "Get Started"** → redirects to `/login`

6. **Click "Continue with Google"** → redirects to Google login

7. **Enter Google credentials** → redirects back to `/api/auth/google/callback`

8. **Check terminal logs** for:
   ```
   Email lookup result: ...
   User created: ...
   ```

9. **Check if redirected to `/dashboard`** ✅

10. **Check database** for new user:
    ```sql
    SELECT id, email, google_id, username FROM users 
    ORDER BY created_at DESC LIMIT 1;
    ```

## If Still Getting 404

1. Check browser DevTools → Console for JavaScript errors
2. Check terminal for Node.js errors
3. Run: `curl http://localhost:3000/api/auth/debug` to see session status
4. Check `.env.local` is in project root (not `.env`)
5. Make sure `SESSION_SECRET` is set (can be any random string)
6. Restart `npm run dev` after changing env variables

## Production Notes

- Remove `/api/auth/debug` endpoint in production
- Change `SESSION_SECRET` to a secure random string
- Set `GOOGLE_REDIRECT_URI` to production URL
- Ensure database backups before running migrations
- Test thoroughly in staging first
