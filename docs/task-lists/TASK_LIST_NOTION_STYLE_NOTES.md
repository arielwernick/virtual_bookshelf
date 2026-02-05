# Task List: Notion-Style Notes Feature

**PRD:** [PRD_NOTION_STYLE_NOTES.md](../prds/PRD_NOTION_STYLE_NOTES.md)  
**Branch:** `feature/notion-style-notes`  
**Status:** In Progress

---

## Phase 1: UI Polish

### 1. NoteEditorModal Redesign
> The heart of the notes experience—make it feel calm, spacious, and premium.

- [ ] **1.1** Remove amber/yellow theming from header icon and background
- [ ] **1.2** Simplify header: use minimal icon, cleaner typography
- [ ] **1.3** Increase modal width and textarea size for more breathing room
- [ ] **1.4** Restyle textarea: clean border, better focus states, larger padding
- [ ] **1.5** Show character count only when approaching limit (80%+)
- [ ] **1.6** Update buttons to minimal Notion-style (grayscale primary, subtle secondary)
- [ ] **1.7** Add smooth transition/animation when modal opens

### 2. ItemCard Note Preview
> Make note previews feel integrated, not tacked on.

- [ ] **2.1** Remove quotation marks from note display
- [ ] **2.2** Update text styling: regular weight, better line-height
- [ ] **2.3** Add subtle inline note icon (smaller, refined)
- [ ] **2.4** Adjust colors for better hierarchy (slightly muted, not gray-500)

### 3. ItemModal Note Display
> Full note display should be readable and elegant.

- [ ] **3.1** Replace amber box with clean gray/neutral card
- [ ] **3.2** Simplify header: small icon + "Note" label (minimal caps styling)
- [ ] **3.3** Remove italic styling and quotation marks
- [ ] **3.4** Improve typography: regular weight, `leading-relaxed`
- [ ] **3.5** Add subtle border instead of background color

### 4. ItemCardStatic (SSR) Consistency
> Ensure shared/embed views match the new design.

- [ ] **4.1** Mirror ItemCard changes: remove quotes, update styling
- [ ] **4.2** Add inline note icon matching ItemCard design

### 5. Testing & Polish

- [ ] **5.1** Test all note displays in dark mode
- [ ] **5.2** Verify SSR rendering works correctly
- [ ] **5.3** Test keyboard accessibility in editor modal
- [ ] **5.4** Visual review: ensure design feels cohesive

### 6. Final Verification

- [ ] **6.1** Run test suite: `npm run test:run`
- [ ] **6.2** Run lint: `npm run lint`
- [ ] **6.3** Build verification: `npm run build`
- [ ] **6.4** Manual QA: create/edit/delete notes, check all displays

---

## Acceptance Criteria

1. ✅ NoteEditorModal feels spacious and Notion-like (no amber theme)
2. ✅ Note previews on cards use clean typography without quotes
3. ✅ Full note display in modal uses neutral colors, not amber
4. ✅ All components work in both light and dark mode
5. ✅ SSR/static components match interactive ones
6. ✅ All existing tests pass
7. ✅ No accessibility regressions

---

## Files to Modify

| File | Changes |
|------|---------|
| `components/shelf/NoteEditorModal.tsx` | Complete UI redesign |
| `components/shelf/ItemCard.tsx` | Note preview styling |
| `components/shelf/ItemModal.tsx` | Note display section |
| `components/shelf/ItemCardStatic.tsx` | SSR note preview |

## Design Tokens Reference

```tsx
// Neutral note container
className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-lg"

// Note text
className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed"

// Minimal label
className="text-xs font-medium uppercase tracking-wide text-gray-500"

// Editor focus
className="focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent"
```
