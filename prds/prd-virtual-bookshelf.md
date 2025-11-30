# Product Requirements Document: Virtual Bookshelf

## Introduction/Overview

Virtual Bookshelf is a lightweight, embeddable web application that allows users to showcase their personal taste in books, podcasts, and music through a visually appealing digital bookshelf. The application serves as a cultural identity card that can be embedded on personal websites or shared via unique URLs on resumes and professional profiles.

The application recreates the intimate experience of browsing someone's home or office bookshelf, providing insight into their interests, values, and personality through their media choices.

## Goals

1. Create a clean, aesthetically pleasing interface inspired by browsing a Barnes & Noble bookshelf
2. Enable users to easily add books, podcasts, and music from multiple sources (APIs and manual entry)
3. Generate shareable unique URLs for each user's bookshelf (username-based, no authentication initially)
4. Support future extensibility for authentication, reviews, and advanced features
5. Deploy on Vercel with Neon database for scalable, cost-effective hosting
6. Build a solid MVP within 2-3 weeks that can grow incrementally

## User Stories

1. **As a creative professional**, I want to showcase my taste in books and podcasts on my portfolio website, so potential clients can understand my influences and personality.

2. **As a job seeker**, I want to include a link to my virtual bookshelf on my resume, so hiring managers can get a more personal sense of who I am beyond my work experience.

3. **As a user setting up my bookshelf**, I want to easily add books from Goodreads or by searching, so I don't have to manually enter all the details.

4. **As a music lover**, I want to add albums or playlists from Spotify to my shelf, so I can showcase my musical taste alongside my reading preferences.

5. **As a podcast enthusiast**, I want to add my favorite podcasts with their artwork, so visitors can discover what I'm listening to.

6. **As a user adding items**, I want to attach personal notes or blurbs to items, so I can explain why they're meaningful to me (viewable on click).

7. **As a visitor**, I want to browse someone's bookshelf with a clean, visual interface featuring covers and artwork, so the experience feels like walking through a real bookshelf.

8. **As a user**, I want my bookshelf to have a unique, shareable URL (like `/shelf/username`), so I can easily share it without needing to create an account.

## Functional Requirements

### Core MVP Features

1. **User Profile Creation (No Auth)**
   - 1.1 User can claim a unique username (e.g., `/shelf/ariel`)
   - 1.2 System validates username uniqueness
   - 1.3 Simple password protection for editing (stored in database, not full auth)
   - 1.4 Public view requires no authentication

2. **Item Management**
   - 2.1 User can add three types of items: Books, Podcasts, Music
   - 2.2 User can add items via:
     - Search integration with Spotify API (for music/podcasts)
     - Search integration with Goodreads or Google Books API (for books)
     - Manual entry with URL-based image upload
   - 2.3 Each item displays: cover/artwork, title, author/creator
   - 2.4 User can attach optional text notes/blurbs to any item
   - 2.5 User can reorder items (drag-and-drop or simple up/down arrows)
   - 2.6 User can delete items from their shelf

3. **Bookshelf Display**
   - 3.1 Public bookshelf page shows all items in a visual grid/shelf layout
   - 3.2 Design is clean, minimalist, inspired by Barnes & Noble aesthetic
   - 3.3 Items display cover art/artwork prominently
   - 3.4 Clicking an item reveals title, creator, and optional user note in a modal/overlay
   - 3.5 Responsive design works on mobile, tablet, and desktop
   - 3.6 Items are grouped/filterable by type (Books, Podcasts, Music)

4. **Data Storage**
   - 4.1 Store user profiles in Neon PostgreSQL database
   - 4.2 Store shelf items with metadata (type, title, creator, image URL, notes, order)
   - 4.3 Cache API responses where appropriate to reduce external API calls

5. **Sharing & Embedding**
   - 5.1 Each shelf has a unique public URL (`/shelf/[username]`)
   - 5.2 Shelf can be viewed by anyone with the link
   - 5.3 Meta tags for social sharing (Open Graph, Twitter Cards)

### Technical Architecture

6. **Frontend**
   - 6.1 Built with Next.js 16 (App Router)
   - 6.2 TypeScript for type safety
   - 6.3 Tailwind CSS for styling
   - 6.4 Responsive, mobile-first design

7. **Backend**
   - 7.1 Next.js API routes for server-side logic
   - 7.2 Integration with Spotify API
   - 7.3 Integration with book API (Goodreads or Google Books)
   - 7.4 Neon PostgreSQL database connection

8. **Deployment**
   - 8.1 Deploy to Vercel
   - 8.2 Connect Neon database
   - 8.3 Environment variables for API keys

## Non-Goals (Out of Scope for MVP)

1. Full user authentication with OAuth/SSO (future feature)
2. User-to-user following or social features
3. Public reviews or ratings systems
4. Advanced analytics or tracking
5. Multiple bookshelves per user
6. Private/hidden items or privacy controls beyond the single shelf
7. Mobile native apps (web-only for MVP)
8. Comments from visitors
9. Integration with library systems or purchase links
10. Search/discovery of other users' shelves

## Design Considerations

### Visual Design
- **Inspiration**: Barnes & Noble browsing experience - clean, organized, visual-first
- **Color Palette**: Neutral, warm tones (think wood shelves, cream backgrounds, black text)
- **Typography**: Clean, readable sans-serif (Geist font already in project is perfect)
- **Layout**: Grid or shelf-style layout with prominent cover art
- **Interactions**: Smooth hover effects, modal overlays for item details
- **Accessibility**: High contrast, keyboard navigation, screen reader friendly

### UI Components
- Bookshelf grid/list view
- Item card component (book, podcast, music variants)
- Modal/overlay for item details
- Add item form with search and manual entry
- Filter/tab system for item types
- Edit mode toggle for shelf owner

## Technical Considerations

### APIs & Services
- **Spotify API**: Well-documented, free tier available, good for music and podcasts
- **Google Books API**: Free, no API key required for basic searches, good book metadata
- **Image Hosting**: Store image URLs from APIs; for manual uploads, consider Vercel Blob or similar
- **Database**: Neon PostgreSQL (serverless, free tier, integrates well with Vercel)

### Database Schema (Initial)
```
Users Table:
- id (uuid, primary key)
- username (string, unique)
- password_hash (string) // simple protection, not full auth
- created_at (timestamp)

Items Table:
- id (uuid, primary key)
- user_id (uuid, foreign key)
- type (enum: 'book' | 'podcast' | 'music')
- title (string)
- creator (string) // author, artist, host
- image_url (string)
- external_url (string, optional) // link to Spotify, Goodreads, etc.
- notes (text, optional)
- order_index (integer)
- created_at (timestamp)
```

### Extensibility
- Architecture should support adding OAuth later without major refactoring
- Design database schema to accommodate future features (reviews, privacy settings)
- Component structure should be modular for easy feature additions

## Success Metrics

### MVP Success Criteria
1. User can create a shelf with unique URL in under 2 minutes
2. User can add 10+ items to their shelf within 5 minutes
3. Shelf loads in under 2 seconds on 3G connection
4. 90%+ of book/music searches return relevant results
5. Design receives positive feedback from 5+ test users
6. Successfully deployed to production on Vercel with Neon database

### Future Success Metrics (Post-MVP)
- Number of active shelves created
- Average items per shelf
- Social shares / embeds
- Repeat visitor rate
- API response time and reliability

## Open Questions

1. **Image Storage**: For manual uploads, should we use Vercel Blob, Cloudinary, or another service?
2. **Rate Limiting**: Do we need rate limiting for API routes in MVP, or handle post-launch?
3. **Username Character Limits**: What constraints on username format (alphanumeric only? dashes allowed? max length)?
4. **Default/Empty State**: What should a new, empty shelf look like? Placeholder items or onboarding flow?
5. **Edit Mode**: Should edit mode be a separate route (`/shelf/[username]/edit`) or a toggle on the main page?
6. **Delete Confirmation**: Do we need confirmation modals for destructive actions in MVP?

## Timeline Estimate

**Week 1**: Database setup, API integrations, basic CRUD
**Week 2**: UI/UX implementation, item display, editing features
**Week 3**: Polish, testing, deployment, bug fixes

## Next Steps

1. Review and approve PRD
2. Generate detailed task list
3. Set up Neon database and Vercel project
4. Begin implementation following task-by-task approach
