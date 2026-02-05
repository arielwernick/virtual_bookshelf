# PRD: Notion-Style Notes Feature

## Overview

**Problem Statement:** The current notes feature in Virtual Bookshelf is functional but lacks polish. Notes are displayed as simple italic text in a yellow box. The editing experience is a basic textarea with a 500-character limit. This doesn't feel premium or match the elegance of apps like Notion.

**Solution:** Transform the notes experience to be crisp, elegant, and Notion-inspired—with smooth typography, subtle interactions, and a refined editing experience.

## Goals

1. **Elevated Visual Design** - Notes should feel sophisticated and readable, not like an afterthought
2. **Better Editing Experience** - The note editor should feel spacious, calm, and focused
3. **Rich Text Support (Phase 2)** - Future: Basic markdown/formatting support
4. **Consistency** - Notes should look elegant in all contexts (card preview, modal, editor)

## User Stories

1. **As a user**, I want to see my notes displayed beautifully so my shelf feels curated and personal
2. **As a user**, I want the note editor to feel focused and distraction-free when I'm writing
3. **As a user**, I want subtle visual feedback when interacting with notes

## Current State Analysis

### What Exists Today

| Component | Current Implementation |
|-----------|----------------------|
| **NoteEditorModal** | Basic textarea, amber theme, 500 char limit |
| **ItemCard (preview)** | Italic text in quotes, gray styling, line-clamp-2 |
| **ItemModal (full display)** | Amber box with icon, italic quoted text |
| **ItemCardStatic** | Same as ItemCard, SSR-compatible |

### Pain Points

1. **Editor**: Basic textarea feels cramped; no visual hierarchy
2. **Display**: Quotes around everything feels dated; amber boxes are too prominent
3. **Typography**: Italic text is hard to read at small sizes
4. **Transitions**: No micro-interactions or polish

## Design Direction: Notion-Inspired

### Core Principles (Notion's Style)

1. **Minimal Chrome** - Let content breathe, reduce visual noise
2. **Typography First** - Beautiful, readable text with proper hierarchy
3. **Subtle Depth** - Light shadows, gentle borders, no harsh colors
4. **Smooth Transitions** - Everything feels alive but not distracting

### Color Palette

- Primary text: `gray-900` / `gray-100` (dark mode)
- Secondary text: `gray-600` / `gray-400`  
- Muted backgrounds: `gray-50` / `gray-900` (subtle, not amber)
- Accent: `gray-200` borders, not yellow/amber boxes
- Focus: Subtle blue ring or underline

## Feature Specifications

### 1. Note Display (ItemCard Preview)

**Before:**
```
"This was a great book..." (italic, gray, quoted)
```

**After:**
- Remove quotes - they feel old-fashioned
- Use regular weight text with slightly muted color
- Add a subtle note icon inline (small, refined)
- Smooth typography with proper line-height

```tsx
<div className="flex items-start gap-1.5 mt-2">
  <svg className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
    {item.notes}
  </p>
</div>
```

### 2. Note Display (ItemModal)

**Before:**
- Amber box with border
- Note icon + "Notes" label
- Italic quoted text

**After:**
- Clean white/dark card with subtle border
- Minimal header (just a small icon)
- Regular text, good line-height
- Optional: Show character count or "Read more" for long notes

```tsx
<div className="mt-6 space-y-2">
  <div className="flex items-center gap-1.5 text-gray-500">
    <svg className="w-4 h-4" /> {/* Pencil or note icon */}
    <span className="text-xs font-medium uppercase tracking-wide">Note</span>
  </div>
  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-800">
    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
      {item.notes}
    </p>
  </div>
</div>
```

### 3. Note Editor Modal

**Key Changes:**
- Larger, more spacious modal
- Simplified header (no yellow icon)
- Full-width textarea with generous padding
- Character count as subtle indicator (only when approaching limit)
- Smooth focus states

**Design Tokens:**
```tsx
// Modal container
className="max-w-lg w-full"

// Textarea
className="w-full min-h-[160px] p-4 text-base leading-relaxed 
  bg-white dark:bg-gray-900 
  border border-gray-200 dark:border-gray-700 
  rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-white 
  focus:border-transparent resize-none 
  placeholder:text-gray-400"

// Character counter (shows at 80%+)
{notes.length > MAX_NOTES_LENGTH * 0.8 && (
  <span className="text-xs text-gray-400">
    {notes.length}/{MAX_NOTES_LENGTH}
  </span>
)}
```

### 4. Micro-interactions

- Fade in/out for modal
- Textarea grows with content (auto-resize)
- Subtle hover states on buttons
- Focus ring animations

## Success Metrics

- **Visual Quality**: Notes feel integrated with Notion-quality design
- **Usability**: Editor is comfortable for writing longer thoughts
- **Consistency**: Same design language across all note displays

## Implementation Phases

### Phase 1: UI Polish (This PR)
1. Redesign `NoteEditorModal` with Notion-style aesthetics
2. Update note display in `ItemCard` (remove quotes, cleaner styling)
3. Update note display in `ItemModal` (minimal amber, better typography)
4. Update `ItemCardStatic` for SSR consistency
5. Add subtle transitions/animations

### Phase 2: Enhanced Editing (Future)
- Auto-expanding textarea
- Basic markdown support (bold, italic, bullet lists)
- Link detection and rendering

## Technical Considerations

- All changes are UI-only; no database schema changes
- Must maintain SSR compatibility for `ItemCardStatic`
- Keep accessibility: focus management, keyboard nav, ARIA labels
- Test in both light and dark modes

## Design References

- **Notion**: Clean cards, subtle borders, typography-focused
- **Linear**: Minimal UI, smooth transitions
- **Raycast**: Dark mode excellence, focus states

## Out of Scope

- Rich text editor (Tiptap, etc.) - future phase
- Note tagging or categories
- Note search/filtering
- Longer character limits (500 is sufficient for now)
