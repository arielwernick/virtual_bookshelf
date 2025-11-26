# LinkedIn Redesign - Task Breakdown

## Phase 1: Global Styling Foundation

### Task 1.1: Update globals.css with LinkedIn Color Palette
- [ ] Define CSS custom properties for LinkedIn colors
- [ ] Update base body/text colors
- [ ] Set default font sizes and weights
- Estimate: 15 min
- Verification: Color scheme applied to page

### Task 1.2: Create Button Utility Classes
- [ ] Create `.btn-primary` for main CTA buttons
- [ ] Create `.btn-secondary` for secondary actions
- [ ] Create `.btn-ghost` for tertiary actions
- [ ] Add hover/focus/disabled states to all
- Estimate: 30 min
- Verification: All button variants render correctly

### Task 1.3: Create Card/Container Utility Classes
- [ ] Create `.card` for content containers
- [ ] Create `.input-base` for form inputs
- [ ] Apply to components
- Estimate: 20 min
- Verification: Cards and inputs styled consistently

---

## Phase 2: Component Updates

### Task 2.1: Update Navigation.tsx
- [ ] Apply LinkedIn blue to sticky header
- [ ] Update logo styling
- [ ] Update button styling (back button)
- Estimate: 15 min
- Verification: Nav matches LinkedIn aesthetic

### Task 2.2: Update ItemCard Component
- [ ] Apply LinkedIn card styling to item cards
- [ ] Update badge colors/styling
- [ ] Enhance hover effects
- Estimate: 20 min
- Verification: Cards display with LinkedIn styling

### Task 2.3: Update Modal Components
- [ ] Update Modal.tsx styling
- [ ] Update ShareModal styling
- [ ] Update ItemModal styling
- Estimate: 25 min
- Verification: Modals render with new styling

### Task 2.4: Update Form Components
- [ ] AddItemForm: buttons, inputs
- [ ] ShelfTitleEditor: inputs, buttons
- Estimate: 25 min
- Verification: Forms are functional and styled

---

## Phase 3: Page Updates

### Task 3.1: Update Landing Page (app/page.tsx)
- [ ] Hero section - update buttons to LinkedIn style
- [ ] Feature cards - apply card styling
- [ ] CTA section - update buttons
- Estimate: 30 min
- Verification: Page matches LinkedIn design

### Task 3.2: Update Shelf View Page
- [ ] Header section - apply LinkedIn styling
- [ ] Share/Edit buttons - use new button classes
- [ ] Filter tabs - update styling
- [ ] Footer - update styling
- Estimate: 30 min
- Verification: All buttons and sections styled

### Task 3.3: Update Edit Shelf Page
- [ ] Login form - apply input styling
- [ ] Title/description editors - update styling
- [ ] Action buttons - use new button classes
- [ ] Password input styling
- Estimate: 30 min
- Verification: Form inputs and buttons styled

### Task 3.4: Update Shared Shelf Page
- [ ] Apply same styling as shelf view
- Estimate: 15 min
- Verification: Shared view matches main shelf view

---

## Phase 4: Polish & Testing

### Task 4.1: Verify Mobile Responsiveness
- [ ] Test on mobile devices/responsive mode
- [ ] Verify touch targets are adequate
- [ ] Check spacing and layout
- Estimate: 20 min
- Verification: Mobile experience is good

### Task 4.2: Accessibility Check
- [ ] Verify color contrast ratios
- [ ] Check focus states visible
- [ ] Test keyboard navigation
- Estimate: 20 min
- Verification: No accessibility issues

### Task 4.3: Cross-Browser Testing
- [ ] Test Chrome, Firefox, Safari
- [ ] Check for rendering differences
- Estimate: 15 min
- Verification: Consistent across browsers

### Task 4.4: Final Polish
- [ ] Review all hover states
- [ ] Check all transitions are smooth
- [ ] Update any missed components
- Estimate: 20 min
- Verification: Design is cohesive

---

## Total Estimate: ~5-6 hours

## Priority Order
1. Phase 1 (Foundation) - Must complete first
2. Phase 2 (Components) - Can parallelize
3. Phase 3 (Pages) - Follows from components
4. Phase 4 (Polish) - Final pass

## Rollback Plan
- All changes are styling only
- No database or functionality changes
- Easy to revert via git if needed
