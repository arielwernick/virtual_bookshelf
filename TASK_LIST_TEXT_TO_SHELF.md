# Task List: Text-to-Shelf Import Feature

**PRD**: [prds/TEXT_TO_SHELF_PRD.md](prds/TEXT_TO_SHELF_PRD.md)  
**Branch**: `feature/text-to-shelf-import`  
**Estimated Effort**: 3-4 days

---

## Phase 1: Core Parsing Logic ✅

### Task 1.1: Create URL extraction utility ✅
**File**: `lib/utils/textParser.ts`  
**Description**: Extract all URLs from pasted text using regex  
**Acceptance Criteria**:
- [x] Extracts http:// and https:// URLs
- [x] Handles URLs with query params and fragments
- [x] Returns URLs in order of appearance
- [x] Dedupes identical URLs
- [x] Unit tests pass (33 tests)

### Task 1.2: Create context parser ✅
**File**: `lib/utils/textParser.ts`  
**Description**: Parse text around each URL to extract title and description  
**Acceptance Criteria**:
- [x] Splits text into chunks (one per URL)
- [x] Identifies title line (handles `→`, numbers, shortest line heuristics)
- [x] Captures description lines as notes
- [x] Strips common prefixes (numbers, arrows, bullets)
- [x] Handles edge case: URL with no surrounding text
- [x] Unit tests with LinkedIn post format

### Task 1.3: Create URL resolver utility ✅
**File**: `lib/utils/urlResolver.ts`  
**Description**: Follow redirects for shortened URLs  
**Acceptance Criteria**:
- [x] Resolves lnkd.in, bit.ly, t.co, tinyurl.com
- [x] Uses HEAD request to minimize data transfer
- [x] Timeout after 5 seconds per URL
- [x] Returns original URL on failure
- [x] Handles non-shortened URLs (pass through)
- [x] Unit tests pass (22 tests)

---

## Phase 2: API Endpoints ✅

### Task 2.1: Create parse endpoint ✅
**File**: `app/api/import/parse/route.ts`  
**Description**: Accept text, return extracted URLs with parsed context  
**Acceptance Criteria**:
- [x] POST endpoint accepts `{ text: string }`
- [x] Returns `{ items: ParsedItem[] }`
- [x] Validates text is not empty
- [x] Limits to 50 URLs max
- [x] Works for both authenticated and anonymous users

### Task 2.2: Create resolve endpoint ✅
**File**: `app/api/import/resolve/route.ts`  
**Description**: Batch resolve shortened URLs  
**Acceptance Criteria**:
- [x] POST endpoint accepts `{ urls: string[] }`
- [x] Returns `{ resolved: Record<string, string> }`
- [x] Parallel resolution with concurrency limit (5)
- [x] Timeout handling per URL
- [ ] Rate limiting: 1 request/IP/day for anonymous (deferred to Phase 4)

### Task 2.3: Create metadata fetch endpoint ✅
**File**: `app/api/import/metadata/route.ts`  
**Description**: Batch fetch metadata for resolved URLs  
**Acceptance Criteria**:
- [x] POST endpoint accepts `{ urls: string[] }`
- [x] Uses existing Microlink integration
- [x] Returns metadata for each URL
- [x] Handles partial failures gracefully
- [x] Respects Microlink rate limits

### Task 2.4: Create shelf creation endpoint ✅
**File**: `app/api/import/create/route.ts`  
**Description**: Create shelf with multiple items in one request  
**Acceptance Criteria**:
- [x] POST endpoint accepts `{ title, items[] }`
- [x] Requires authentication
- [x] Creates shelf and all items in sequence
- [x] Returns shelf ID and share token
- [x] Sets item types based on URL domain (via itemTypeDetector.ts)

---

## Phase 3: Import Page UI ✅

### Task 3.1: Create import page layout ✅
**File**: `app/import/page.tsx`  
**Description**: Basic page structure with textarea input  
**Acceptance Criteria**:
- [x] Route accessible at /import
- [x] Large textarea for pasting text
- [x] "Extract Links" button
- [x] Responsive layout
- [x] Clear instructions/placeholder text

### Task 3.2: Create parsed items preview component ✅
**File**: `components/import/ParsedItemPreview.tsx`  
**Description**: Show extracted items with title, description, URL  
**Acceptance Criteria**:
- [x] Displays parsed title (or domain as fallback)
- [x] Shows description/notes preview
- [x] Shows resolved URL domain
- [x] Checkbox to include/exclude item
- [x] Loading state during metadata fetch

### Task 3.3: Create import preview list component ✅
**File**: `components/import/ImportPreviewList.tsx`  
**Description**: List of all parsed items with batch controls  
**Acceptance Criteria**:
- [x] Renders ParsedItemPreview for each item
- [x] "Select All" / "Deselect All" controls
- [x] Shows count: "16 links found, 14 selected"
- [x] Shelf title input field
- [x] "Create Shelf" button (disabled until ready)

### Task 3.4: Implement extraction flow ✅
**File**: `app/import/page.tsx`  
**Description**: Wire up paste → parse → resolve → metadata flow  
**Acceptance Criteria**:
- [x] "Extract Links" triggers parse API
- [x] Auto-resolves shortened URLs
- [x] Fetches metadata in batches
- [x] Shows progress indicator
- [x] Handles errors gracefully

### Task 3.5: Implement shelf creation flow ✅
**File**: `app/import/page.tsx`  
**Description**: Create shelf from selected items  
**Acceptance Criteria**:
- [x] Authenticated: Creates shelf, redirects to it
- [x] Anonymous: Shows "Sign up to save" prompt
- [x] Stores preview in localStorage for post-signup
- [x] Success confetti animation
- [x] Error handling with retry option

---

## Phase 4: Anonymous Rate Limiting (Removed for now)

### Task 4.1: Create rate limit utility ✅
**File**: `lib/utils/importRateLimit.ts`  
**Description**: IP-based rate limiting for anonymous users  
**Acceptance Criteria**:
- [x] Hash IP address for privacy
- [x] Check limit before processing
- [x] Store in database (simple table)
- [x] 1 resolve/IP/24 hours for anonymous
- [x] Bypass for authenticated users

### Task 4.2: Create rate limit database table ✅
**File**: `lib/db/schema.sql` (add migration)  
**Description**: Table to track anonymous import attempts  
**Acceptance Criteria**:
- [x] Table: `import_rate_limits`
- [x] Columns: id, ip_hash, limit_type, created_at
- [x] Index on ip_hash + limit_type + created_at
- [x] Index for cleanup operations

### Task 4.3: Apply rate limiting to resolve endpoint ✅
**File**: `app/api/import/resolve/route.ts`  
**Description**: Check rate limit before processing  
**Acceptance Criteria**:
- [x] Returns 429 if limit exceeded
- [x] Clear error message: "Sign up to continue"
- [x] Includes retry-after header
- [x] Records attempts for anonymous users only

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
- [x] On mount, check localStorage for `pending_import`
- [x] If found AND user is now authenticated, restore state
- [ ] Show "Welcome back! Ready to save your shelf"
- [ ] Auto-focus "Create Shelf" button
- [x] Clear localStorage after successful creation

### Task 5.3: Add return URL to signup/login flow ✅
**File**: `app/login/page.tsx`, `app/signup/page.tsx`  
**Description**: Redirect back to /import after auth  
**Acceptance Criteria**:
- [x] Accept `?returnTo=/import` query param
- [x] Redirect to returnTo after successful auth
- [x] Validate returnTo is internal URL (security)
- [x] Preserve returnTo in signup/login cross-links

---

## Phase 6: Item Type Detection ✅

### Task 6.1: Create URL-to-type mapping utility ✅
**File**: `lib/utils/itemTypeDetector.ts`  
**Description**: Detect item type from URL domain/path  
**Acceptance Criteria**:
- [x] Spotify show/episode → podcast
- [x] Spotify album/track → music
- [x] YouTube/youtu.be → link
- [x] Amazon book/goodreads → book
- [x] Default → link
- [x] Unit tests for each pattern (28 tests)

### Task 6.2: Apply type detection during import ✅
**File**: `app/api/import/create/route.ts`  
**Description**: Set item type based on URL  
**Acceptance Criteria**:
- [x] Call itemTypeDetector for each item
- [x] Store detected type in items table
- [x] Fallback to 'link' if unknown

---

## Phase 7: Polish & Edge Cases ✅

### Task 7.1: Add loading states and progress ✅
**File**: `app/import/page.tsx`  
**Description**: Show progress during multi-step process  
**Acceptance Criteria**:
- [x] "Extracting links..." state
- [x] "Resolving shortened URLs..." state  
- [x] "Fetching metadata..." with progress (3/16)
- [x] Preview items with loading state

### Task 7.2: Handle Microlink quota exceeded ✅
**File**: `app/api/import/metadata/route.ts`  
**Description**: Graceful degradation when quota hit  
**Acceptance Criteria**:
- [x] Catch MicrolinkQuotaExceededError
- [x] Return partial results (items processed so far)
- [x] Show warning in UI for quota-limited items
- [x] Items still usable (URL + parsed text only)

### Task 7.3: Add import link to navigation ✅
**File**: `components/Navigation.tsx`  
**Description**: Make import discoverable  
**Acceptance Criteria**:
- [x] Add "Import" link in dashboard nav (for logged-in users)
- [ ] Consider adding to homepage CTA
- [x] Mobile-friendly placement

### Task 7.4: Write integration tests ✅
**File**: `app/import/page.test.tsx`  
**Description**: Test full import flow  
**Acceptance Criteria**:
- [x] Test paste → extract → preview flow
- [x] Test authenticated save flow
- [x] Test anonymous rate limit
- [x] Test localStorage restoration
- [x] Test item selection controls
- [x] Test error handling

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
