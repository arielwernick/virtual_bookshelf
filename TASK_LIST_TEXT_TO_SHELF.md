# Task List: Text-to-Shelf Import Feature

**PRD**: [prds/TEXT_TO_SHELF_PRD.md](prds/TEXT_TO_SHELF_PRD.md)  
**Branch**: `feature/text-to-shelf-import`  
**Estimated Effort**: 3-4 days

---

## Phase 1: Core Parsing Logic

### Task 1.1: Create URL extraction utility
**File**: `lib/utils/textParser.ts`  
**Description**: Extract all URLs from pasted text using regex  
**Acceptance Criteria**:
- [ ] Extracts http:// and https:// URLs
- [ ] Handles URLs with query params and fragments
- [ ] Returns URLs in order of appearance
- [ ] Dedupes identical URLs
- [ ] Unit tests pass

### Task 1.2: Create context parser
**File**: `lib/utils/textParser.ts`  
**Description**: Parse text around each URL to extract title and description  
**Acceptance Criteria**:
- [ ] Splits text into chunks (one per URL)
- [ ] Identifies title line (handles `→`, numbers, shortest line heuristics)
- [ ] Captures description lines as notes
- [ ] Strips common prefixes (numbers, arrows, bullets)
- [ ] Handles edge case: URL with no surrounding text
- [ ] Unit tests with LinkedIn post format

### Task 1.3: Create URL resolver utility
**File**: `lib/utils/urlResolver.ts`  
**Description**: Follow redirects for shortened URLs  
**Acceptance Criteria**:
- [ ] Resolves lnkd.in, bit.ly, t.co, tinyurl.com
- [ ] Uses HEAD request to minimize data transfer
- [ ] Timeout after 5 seconds per URL
- [ ] Returns original URL on failure
- [ ] Handles non-shortened URLs (pass through)
- [ ] Unit tests pass

---

## Phase 2: API Endpoints

### Task 2.1: Create parse endpoint
**File**: `app/api/import/parse/route.ts`  
**Description**: Accept text, return extracted URLs with parsed context  
**Acceptance Criteria**:
- [ ] POST endpoint accepts `{ text: string }`
- [ ] Returns `{ items: ParsedItem[] }`
- [ ] Validates text is not empty
- [ ] Limits to 50 URLs max
- [ ] Works for both authenticated and anonymous users

### Task 2.2: Create resolve endpoint
**File**: `app/api/import/resolve/route.ts`  
**Description**: Batch resolve shortened URLs  
**Acceptance Criteria**:
- [ ] POST endpoint accepts `{ urls: string[] }`
- [ ] Returns `{ resolved: Record<string, string> }`
- [ ] Parallel resolution with concurrency limit (5)
- [ ] Timeout handling per URL
- [ ] Rate limiting: 1 request/IP/day for anonymous

### Task 2.3: Create metadata fetch endpoint
**File**: `app/api/import/metadata/route.ts`  
**Description**: Batch fetch metadata for resolved URLs  
**Acceptance Criteria**:
- [ ] POST endpoint accepts `{ urls: string[] }`
- [ ] Uses existing Microlink integration
- [ ] Returns metadata for each URL
- [ ] Handles partial failures gracefully
- [ ] Respects Microlink rate limits

### Task 2.4: Create shelf creation endpoint
**File**: `app/api/import/create/route.ts`  
**Description**: Create shelf with multiple items in one request  
**Acceptance Criteria**:
- [ ] POST endpoint accepts `{ title, items[] }`
- [ ] Requires authentication
- [ ] Creates shelf and all items in transaction
- [ ] Returns shelf ID and share token
- [ ] Sets item types based on URL domain

---

## Phase 3: Import Page UI

### Task 3.1: Create import page layout
**File**: `app/import/page.tsx`  
**Description**: Basic page structure with textarea input  
**Acceptance Criteria**:
- [ ] Route accessible at /import
- [ ] Large textarea for pasting text
- [ ] "Extract Links" button
- [ ] Responsive layout
- [ ] Clear instructions/placeholder text

### Task 3.2: Create parsed items preview component
**File**: `components/import/ParsedItemPreview.tsx`  
**Description**: Show extracted items with title, description, URL  
**Acceptance Criteria**:
- [ ] Displays parsed title (or "Untitled")
- [ ] Shows description/notes preview
- [ ] Shows resolved URL domain
- [ ] Checkbox to include/exclude item
- [ ] Loading state during metadata fetch

### Task 3.3: Create import preview list component
**File**: `components/import/ImportPreviewList.tsx`  
**Description**: List of all parsed items with batch controls  
**Acceptance Criteria**:
- [ ] Renders ParsedItemPreview for each item
- [ ] "Select All" / "Deselect All" controls
- [ ] Shows count: "16 links found, 14 selected"
- [ ] Shelf title input field
- [ ] "Create Shelf" button (disabled until ready)

### Task 3.4: Implement extraction flow
**File**: `app/import/page.tsx`  
**Description**: Wire up paste → parse → resolve → metadata flow  
**Acceptance Criteria**:
- [ ] "Extract Links" triggers parse API
- [ ] Auto-resolves shortened URLs
- [ ] Fetches metadata in batches
- [ ] Shows progress indicator
- [ ] Handles errors gracefully

### Task 3.5: Implement shelf creation flow
**File**: `app/import/page.tsx`  
**Description**: Create shelf from selected items  
**Acceptance Criteria**:
- [ ] Authenticated: Creates shelf, redirects to it
- [ ] Anonymous: Shows "Sign up to save" prompt
- [ ] Stores preview in localStorage for post-signup
- [ ] Success confetti animation
- [ ] Error handling with retry option

---

## Phase 4: Anonymous Rate Limiting

### Task 4.1: Create rate limit utility
**File**: `lib/utils/rateLimit.ts`  
**Description**: IP-based rate limiting for anonymous users  
**Acceptance Criteria**:
- [ ] Hash IP address for privacy
- [ ] Check limit before processing
- [ ] Store in database (simple table)
- [ ] 1 preview/IP/24 hours for anonymous
- [ ] Bypass for authenticated users

### Task 4.2: Create rate limit database table
**File**: `lib/db/schema.sql` (add migration)  
**Description**: Table to track anonymous import attempts  
**Acceptance Criteria**:
- [ ] Table: `import_rate_limits`
- [ ] Columns: id, ip_hash, created_at
- [ ] Index on ip_hash + created_at
- [ ] Cleanup job for old entries (optional)

### Task 4.3: Apply rate limiting to resolve endpoint
**File**: `app/api/import/resolve/route.ts`  
**Description**: Check rate limit before processing  
**Acceptance Criteria**:
- [ ] Returns 429 if limit exceeded
- [ ] Clear error message: "Sign up to continue"
- [ ] Includes retry-after header
- [ ] Logs rate limit hits for monitoring

---

## Phase 5: Post-Signup Restoration

### Task 5.1: Store preview data before signup redirect
**File**: `app/import/page.tsx`  
**Description**: Save parsed items to localStorage  
**Acceptance Criteria**:
- [ ] Serialize preview state to JSON
- [ ] Store under key `pending_import`
- [ ] Include shelf title
- [ ] Set expiry (24 hours)

### Task 5.2: Restore preview after authentication
**File**: `app/import/page.tsx`  
**Description**: Check for pending import on page load  
**Acceptance Criteria**:
- [ ] On mount, check localStorage for `pending_import`
- [ ] If found AND user is now authenticated, restore state
- [ ] Show "Welcome back! Ready to save your shelf"
- [ ] Auto-focus "Create Shelf" button
- [ ] Clear localStorage after successful creation

### Task 5.3: Add return URL to signup/login flow
**File**: `app/login/page.tsx`, `app/signup/page.tsx`  
**Description**: Redirect back to /import after auth  
**Acceptance Criteria**:
- [ ] Accept `?returnTo=/import` query param
- [ ] Redirect to returnTo after successful auth
- [ ] Validate returnTo is internal URL (security)

---

## Phase 6: Item Type Detection

### Task 6.1: Create URL-to-type mapping utility
**File**: `lib/utils/itemTypeDetector.ts`  
**Description**: Detect item type from URL domain/path  
**Acceptance Criteria**:
- [ ] Spotify show/episode → podcast
- [ ] Spotify album/track → music
- [ ] YouTube/youtu.be → link
- [ ] Amazon book/goodreads → book
- [ ] Default → link
- [ ] Unit tests for each pattern

### Task 6.2: Apply type detection during import
**File**: `app/api/import/create/route.ts`  
**Description**: Set item type based on URL  
**Acceptance Criteria**:
- [ ] Call itemTypeDetector for each item
- [ ] Store detected type in items table
- [ ] Fallback to 'link' if unknown

---

## Phase 7: Polish & Edge Cases

### Task 7.1: Add loading states and progress
**File**: `app/import/page.tsx`  
**Description**: Show progress during multi-step process  
**Acceptance Criteria**:
- [ ] "Extracting links..." state
- [ ] "Resolving shortened URLs..." state  
- [ ] "Fetching metadata..." with progress (3/16)
- [ ] Skeleton loaders for preview items

### Task 7.2: Handle Microlink quota exceeded
**File**: `app/api/import/metadata/route.ts`  
**Description**: Graceful degradation when quota hit  
**Acceptance Criteria**:
- [ ] Catch MicrolinkQuotaExceededError
- [ ] Return partial results (items processed so far)
- [ ] Show warning: "Some items couldn't load previews"
- [ ] Items still usable (URL + parsed text only)

### Task 7.3: Add import link to navigation
**File**: `components/Navigation.tsx`  
**Description**: Make import discoverable  
**Acceptance Criteria**:
- [ ] Add "Import" link in dashboard nav
- [ ] Consider adding to homepage CTA
- [ ] Mobile-friendly placement

### Task 7.4: Write integration tests
**File**: `app/import/page.test.tsx`  
**Description**: Test full import flow  
**Acceptance Criteria**:
- [ ] Test paste → extract → preview flow
- [ ] Test authenticated save flow
- [ ] Test anonymous rate limit
- [ ] Test post-signup restoration

---

## Phase 8: Documentation

### Task 8.1: Update README with import feature
**File**: `README.md`  
**Description**: Document new import capability  
**Acceptance Criteria**:
- [ ] Add to features list
- [ ] Brief usage explanation
- [ ] Link to /import

---

## Verification Checklist

After all tasks complete:
- [ ] Paste LinkedIn post with 15+ links → all extracted
- [ ] Shortened URLs resolved correctly
- [ ] Titles/descriptions parsed from context
- [ ] Anonymous user sees preview, prompted to sign up
- [ ] After signup, shelf is created with all items
- [ ] Rate limit prevents abuse
- [ ] Mobile responsive
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] Lint passes
