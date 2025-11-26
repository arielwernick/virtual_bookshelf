# Product Requirement Document: LinkedIn-Inspired UI Redesign

## Overview
Transform Virtual Bookshelf's user interface to match LinkedIn's modern, clean design aesthetic while maintaining the lightweight architecture. The application will keep all existing functionality (shelves for books, podcasts, music) but adopt LinkedIn's visual language for buttons, cards, interactions, and layout patterns.

## Current State
- Minimalist gray/white design with dark gray (#171717) accents
- Rounded boxes with subtle shadows
- Dark buttons (#171717) with hover effects
- Card-based item display (book/podcast/music covers)
- Tab-based filtering

## Target Design (LinkedIn-Inspired)
- **Color Palette**: Navy blue (#0A66C2) as primary, with gray accents (#E4E6EB background, #666666 text)
- **Typography**: Clean sans-serif (maintain Geist), proper hierarchy
- **Buttons**: 
  - Primary: Navy blue with white text, no border radius (LinkedIn style - 4px)
  - Secondary: Ghost buttons with borders
  - Hover states: Subtle background shifts
- **Cards**: Minimal shadow, light gray backgrounds (#F3F5F7), proper spacing
- **Navigation**: Sticky top nav with logo, minimal styling
- **Interactions**: 
  - Smooth transitions
  - Hover states on clickable items
  - Subtle loading indicators
  - Ghost button hovers (background fill)

## Scope
### Pages to Update
1. **Landing Page** (`app/page.tsx`)
   - Hero section with LinkedIn-style buttons
   - Feature cards
   - CTA buttons

2. **Shelf View** (`app/shelf/[username]/page.tsx`)
   - Header with shelf title and stats
   - Share/Edit buttons with LinkedIn styling
   - Item cards with LinkedIn hover effects

3. **Edit Shelf** (`app/shelf/[username]/edit/page.tsx`)
   - Form inputs (LinkedIn gray styling)
   - Action buttons (Add Item, Save, etc.)
   - Description editor with character count

4. **Navigation** (`components/Navigation.tsx`)
   - Updated header styling
   - Logo treatment

5. **Components**
   - Button utilities (primary, secondary, ghost)
   - Item cards with hover effects
   - Modal styling
   - Form inputs

## Design Specifications

### Colors
```
Primary Blue: #0A66C2 (LinkedIn blue)
Light Gray BG: #F3F5F7
Medium Gray: #666666 (text)
Light Gray: #E4E6EB (borders)
White: #FFFFFF
```

### Typography
- Font Family: Geist (maintain current)
- Body: 14px, #666666
- Headings: Weights 600-700, #333333

### Buttons
- Primary: bg-[#0A66C2] text-white, 4px radius, hover: #004182
- Secondary: border border-[#D3D3D3], text-[#666666], hover: bg-[#F3F5F7]
- Ghost: bg-transparent, text-[#0A66C2], hover: bg-[#F3F5F7]

### Cards
- Background: #FFFFFF with 1px border #E4E6EB
- Shadow: 0 1px 2px rgba(0,0,0,0.05)
- Border Radius: 8px

### Spacing
- Maintain current padding/margins
- Use Tailwind utilities

## Not In Scope
- Changes to database schema
- Changes to authentication system
- New features
- Item images/cover art styling

## Success Criteria
1. All pages visually match LinkedIn design language
2. Buttons are consistently styled across app
3. Hover/focus states are present and smooth
4. No functionality changes
5. Lightweight (no additional dependencies)
6. Mobile responsive maintained
7. Accessibility preserved (color contrast, focus states)

## Implementation Approach
1. Create Tailwind utility classes or global CSS for consistent styling
2. Update component styling incrementally
3. Test across pages
4. Verify mobile responsiveness
5. Check color contrast and accessibility
