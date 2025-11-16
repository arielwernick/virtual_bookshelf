# Task List: Virtual Bookshelf MVP

## Relevant Files

- `lib/db/schema.sql` - PostgreSQL schema definition for users and items tables
- `lib/db/client.ts` - Neon database connection and client setup
- `lib/api/spotify.ts` - Spotify API integration for music/podcast search
- `lib/api/googleBooks.ts` - Google Books API integration for book search
- `lib/types/shelf.ts` - TypeScript types for User, Item, ShelfItem
- `lib/utils/password.ts` - Simple password hashing utilities
- `app/api/shelf/[username]/route.ts` - API route to fetch shelf data
- `app/api/shelf/[username]/items/route.ts` - API route for CRUD operations on items
- `app/api/shelf/create/route.ts` - API route to create new shelf/username
- `app/api/shelf/auth/route.ts` - API route for simple password verification
- `app/api/search/books/route.ts` - API route for book search
- `app/api/search/music/route.ts` - API route for music/podcast search
- `app/shelf/[username]/page.tsx` - Public shelf display page
- `app/shelf/[username]/edit/page.tsx` - Shelf editing page
- `components/shelf/ShelfGrid.tsx` - Grid display of shelf items
- `components/shelf/ItemCard.tsx` - Individual item card component
- `components/shelf/ItemModal.tsx` - Modal for item details
- `components/shelf/AddItemForm.tsx` - Form to add items with search
- `components/shelf/SearchResults.tsx` - Search results display component
- `components/ui/Button.tsx` - Reusable button component
- `components/ui/Input.tsx` - Reusable input component
- `components/ui/Modal.tsx` - Reusable modal component
- `.env.local` - Environment variables for API keys and database URL
- `package.json` - Dependencies (will add @neondatabase/serverless, bcrypt, etc.)

### Notes

- Use `npm run dev` to start the development server
- Use `npm run build` to check for TypeScript errors
- Database migrations can be run manually through Neon console initially
- Test API routes using browser or Postman/Thunder Client

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch for this feature (e.g., `git checkout -b feature/virtual-bookshelf-mvp`)

- [x] 1.0 Set up database schema and Neon integration
  - [x] 1.1 Create Neon project and database via Neon dashboard (https://neon.tech)
  - [x] 1.2 Create `lib/db/schema.sql` with users and items table definitions
  - [x] 1.3 Run schema SQL in Neon SQL Editor to create tables
  - [x] 1.4 Install Neon database package: `npm install @neondatabase/serverless`
  - [x] 1.5 Create `lib/db/client.ts` with Neon connection setup
  - [x] 1.6 Add `DATABASE_URL` to `.env.local` from Neon dashboard
  - [x] 1.7 Test database connection with a simple query

- [x] 2.0 Implement API integrations (Spotify, Google Books)
  - [x] 2.1 Create Spotify App at https://developer.spotify.com/dashboard to get API credentials
  - [x] 2.2 Add `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` to `.env.local`
  - [x] 2.3 Create `lib/api/spotify.ts` with functions for Spotify API authentication and search
  - [x] 2.4 Create `lib/api/googleBooks.ts` with functions for Google Books API search
  - [x] 2.5 Test Spotify search functionality (albums, podcasts)
  - [x] 2.6 Test Google Books search functionality

- [ ] 3.0 Build backend API routes for shelf management
  - [x] 3.1 Create `lib/types/shelf.ts` with TypeScript interfaces for User, Item, ShelfData
  - [x] 3.2 Install bcrypt for password hashing: `npm install bcrypt @types/bcrypt`
  - [x] 3.3 Create `lib/utils/password.ts` with hash and verify functions
  - [ ] 3.4 Create `app/api/shelf/create/route.ts` - POST endpoint to create new shelf with username
  - [ ] 3.5 Create `app/api/shelf/auth/route.ts` - POST endpoint to verify shelf owner password
  - [ ] 3.6 Create `app/api/shelf/[username]/route.ts` - GET endpoint to fetch public shelf data
  - [ ] 3.7 Create `app/api/shelf/[username]/items/route.ts` - POST/PUT/DELETE endpoints for item management
  - [ ] 3.8 Test all API routes with sample data

- [ ] 4.0 Create user profile and shelf data models
  - [ ] 4.1 Create helper functions in `lib/db/queries.ts` for database operations
  - [ ] 4.2 Implement `createUser(username, passwordHash)` function
  - [ ] 4.3 Implement `getUserByUsername(username)` function
  - [ ] 4.4 Implement `createItem(userId, itemData)` function
  - [ ] 4.5 Implement `getItemsByUserId(userId)` function
  - [ ] 4.6 Implement `updateItem(itemId, itemData)` function
  - [ ] 4.7 Implement `deleteItem(itemId)` function
  - [ ] 4.8 Implement `updateItemOrder(itemId, newOrder)` function

- [ ] 5.0 Implement public shelf display page
  - [ ] 5.1 Create `app/shelf/[username]/page.tsx` as dynamic route
  - [ ] 5.2 Fetch shelf data using username parameter in server component
  - [ ] 5.3 Create `components/shelf/ShelfGrid.tsx` to display items in grid layout
  - [ ] 5.4 Create `components/shelf/ItemCard.tsx` for individual item display with cover art
  - [ ] 5.5 Add filter/tab functionality to switch between Books, Podcasts, Music
  - [ ] 5.6 Handle empty state when shelf has no items
  - [ ] 5.7 Add meta tags for social sharing (Open Graph, Twitter Cards)
  - [ ] 5.8 Test responsive layout on mobile, tablet, desktop

- [ ] 6.0 Build shelf editing interface
  - [ ] 6.1 Create `app/shelf/[username]/edit/page.tsx` for edit mode
  - [ ] 6.2 Add password verification before showing edit interface
  - [ ] 6.3 Reuse `ShelfGrid` component with edit mode prop
  - [ ] 6.4 Add delete button to each item card in edit mode
  - [ ] 6.5 Add reorder functionality (up/down arrows or drag-and-drop)
  - [ ] 6.6 Add "Add Item" button that opens add item form
  - [ ] 6.7 Implement password prompt component for authentication
  - [ ] 6.8 Add "View Public Shelf" link to navigate back to public view

- [ ] 7.0 Implement item add/search functionality
  - [ ] 7.1 Create `app/api/search/books/route.ts` - GET endpoint that calls Google Books API
  - [ ] 7.2 Create `app/api/search/music/route.ts` - GET endpoint that calls Spotify API
  - [ ] 7.3 Create `components/shelf/AddItemForm.tsx` with item type selector (Book/Podcast/Music)
  - [ ] 7.4 Create `components/shelf/SearchResults.tsx` to display search results
  - [ ] 7.5 Add search input with debounce for real-time search
  - [ ] 7.6 Add manual entry option with fields: title, creator, image URL, notes
  - [ ] 7.7 Add "Add to Shelf" button for each search result
  - [ ] 7.8 Handle adding item to database and refresh shelf display

- [ ] 8.0 Create item detail modal/overlay
  - [ ] 8.1 Create `components/ui/Modal.tsx` reusable modal component
  - [ ] 8.2 Create `components/shelf/ItemModal.tsx` for item details
  - [ ] 8.3 Display full-size cover art, title, creator in modal
  - [ ] 8.4 Display user notes/blurb if available
  - [ ] 8.5 Add external link to Spotify/Goodreads if available
  - [ ] 8.6 Add close button and click-outside-to-close functionality
  - [ ] 8.7 Test modal on mobile devices

- [ ] 9.0 Add styling and responsive design
  - [ ] 9.1 Create global color palette inspired by Barnes & Noble (warm, neutral tones)
  - [ ] 9.2 Style `ShelfGrid` with proper spacing and grid layout
  - [ ] 9.3 Style `ItemCard` with hover effects and smooth transitions
  - [ ] 9.4 Create `components/ui/Button.tsx` with consistent styling
  - [ ] 9.5 Create `components/ui/Input.tsx` with consistent styling
  - [ ] 9.6 Ensure all components are responsive (mobile-first approach)
  - [ ] 9.7 Add loading states for API calls
  - [ ] 9.8 Test accessibility (keyboard navigation, screen reader compatibility)
  - [ ] 9.9 Update app metadata in `app/layout.tsx` (title, description)

- [ ] 10.0 Deploy to Vercel with environment configuration
  - [ ] 10.1 Create Vercel account and link GitHub repository
  - [ ] 10.2 Add environment variables in Vercel dashboard (DATABASE_URL, SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET)
  - [ ] 10.3 Deploy to Vercel and verify deployment succeeds
  - [ ] 10.4 Test deployed app with sample shelf creation
  - [ ] 10.5 Verify API routes work in production
  - [ ] 10.6 Test database connection in production
  - [ ] 10.7 Set up custom domain (optional)

- [ ] 11.0 Testing and bug fixes
  - [ ] 11.1 Create test shelf with username
  - [ ] 11.2 Add 10+ items of different types (books, podcasts, music)
  - [ ] 11.3 Test search functionality for all item types
  - [ ] 11.4 Test manual item entry
  - [ ] 11.5 Test item reordering
  - [ ] 11.6 Test item deletion
  - [ ] 11.7 Test modal functionality
  - [ ] 11.8 Test responsive design on real mobile device
  - [ ] 11.9 Fix any bugs found during testing
  - [ ] 11.10 Share shelf URL and gather feedback from 3-5 users
