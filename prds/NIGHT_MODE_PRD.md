# Night Mode / Dark Theme - Product Requirement Document

## Overview

Add comprehensive dark mode support to Virtual Bookshelf that works on both mobile and web browsers, respecting the user's system preferences via `prefers-color-scheme`.

## Problem Statement

Currently, the application has:
- Basic CSS variables for dark mode in `globals.css`
- All component styling uses hardcoded light-mode Tailwind classes (e.g., `bg-white`, `text-gray-900`)
- Users on dark-mode systems see an inconsistent experience

## Goals

1. **Automatic Theme Detection**: Respect `prefers-color-scheme: dark` media query
2. **Consistent Experience**: All UI components adapt to dark mode
3. **Mobile Compatibility**: Works on iOS (Safari), Android (Chrome), and desktop browsers
4. **No Manual Toggle (Phase 1)**: System preference only (toggle can be added later)

## Technical Approach

### Strategy: Tailwind CSS `dark:` Variant

Use Tailwind's built-in dark mode support with `class` strategy, allowing for future manual toggle:

```js
// tailwind.config.ts or inline config
darkMode: 'class'
```

However, since the project uses Tailwind CSS v4 with `@tailwindcss/postcss`, we'll use the CSS-based approach with `@media (prefers-color-scheme: dark)` and Tailwind's `dark:` variant.

### Color Mapping

| Light Mode | Dark Mode | Usage |
|------------|-----------|-------|
| `bg-white` | `bg-gray-900` | Cards, modals, forms |
| `bg-gray-50` | `bg-gray-950` | Page backgrounds |
| `bg-gray-100` | `bg-gray-800` | Secondary backgrounds |
| `text-gray-900` | `text-gray-100` | Primary text |
| `text-gray-700` | `text-gray-300` | Secondary text |
| `text-gray-600` | `text-gray-400` | Tertiary text |
| `text-gray-500` | `text-gray-400` | Muted text |
| `border-gray-200` | `border-gray-700` | Borders |
| `border-gray-300` | `border-gray-600` | Input borders |

### Gradient Backgrounds

```css
/* Light */
bg-gradient-to-br from-gray-50 to-gray-100

/* Dark */
dark:bg-gradient-to-br dark:from-gray-950 dark:to-gray-900
```

## Components to Update

### Core Layout
- [ ] `app/layout.tsx` - Add dark class to html element based on system preference
- [ ] `app/globals.css` - Enhance CSS variables and dark mode defaults

### Navigation
- [ ] `components/Navigation.tsx` - Navbar colors, logo, links

### Pages
- [ ] `app/page.tsx` - Landing page hero, CTAs, footer
- [ ] `app/login/page.tsx` - Login form
- [ ] `app/signup/page.tsx` - Signup form
- [ ] `app/dashboard/page.tsx` - Dashboard, shelf cards, create form
- [ ] `app/shelf/[shelfId]/page.tsx` - Shelf detail page
- [ ] `app/s/[shareToken]/page.tsx` - Public share page
- [ ] `app/embed/[shareToken]/page.tsx` - Embed view

### Shelf Components
- [ ] `components/shelf/ShelfGrid.tsx` - Filter tabs, shelf rows, empty state
- [ ] `components/shelf/ItemCard.tsx` - Item cards
- [ ] `components/shelf/ItemModal.tsx` - Item detail modal
- [ ] `components/shelf/AddItemForm.tsx` - Search and add items
- [ ] `components/shelf/ShareModal.tsx` - Share settings modal
- [ ] `components/shelf/ShelfTitleEditor.tsx` - Title editing
- [ ] `components/shelf/NoteEditorModal.tsx` - Note editing modal
- [ ] `components/shelf/Top5ShelfGrid.tsx` - Top 5 layout
- [ ] `components/shelf/Top5ItemCard.tsx` - Ranked item cards

### UI Components
- [ ] `components/ui/Modal.tsx` - Base modal styling
- [ ] `components/ui/EmptyState.tsx` - Empty state cards
- [ ] `components/ui/Toast.tsx` - Toast notifications
- [ ] `components/ui/SkeletonLoader.tsx` - Loading skeletons

### Home Components
- [ ] `components/home/DemoShelf.tsx` - Demo shelf on landing
- [ ] `components/home/RotatingDemoShelf.tsx` - Rotating shelf carousel

## Implementation Order

### Phase 1: Foundation
1. Configure Tailwind dark mode
2. Update `globals.css` with comprehensive dark mode variables
3. Update `app/layout.tsx` for dark mode class handling

### Phase 2: Core Components
4. Navigation
5. Modal base component
6. Common UI components (EmptyState, Toast, SkeletonLoader)

### Phase 3: Pages
7. Landing page
8. Login/Signup pages
9. Dashboard page
10. Shelf detail page
11. Public share page

### Phase 4: Shelf Components
12. ShelfGrid and ItemCard
13. AddItemForm
14. ItemModal
15. ShareModal
16. Other shelf components

### Phase 5: Testing & Polish
17. Cross-browser testing (Safari, Chrome, Firefox)
18. Mobile testing (iOS Safari, Android Chrome)
19. Visual regression check
20. Accessibility review (contrast ratios)

## Success Criteria

1. All pages render correctly in dark mode
2. No hardcoded light-only colors remain
3. Transitions between modes are smooth (if user changes system setting)
4. Text remains readable (WCAG AA contrast ratios)
5. No visual glitches on mode change

## Out of Scope (Future Enhancements)

- Manual dark/light mode toggle
- User preference persistence
- Per-component theme overrides
- Custom accent colors

## Browser Support

- Chrome 76+ (supports prefers-color-scheme)
- Firefox 67+
- Safari 12.1+ (iOS 13+)
- Edge 79+

## References

- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [MDN prefers-color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)
