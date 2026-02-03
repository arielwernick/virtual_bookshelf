# Virtual Bookshelf

A Next.js application for curating and sharing your favorite books, podcasts, music, videos, and links in a digital bookshelf. Create beautiful, shareable collections that work great for social sharing and AI assistants.

[![Tests](https://github.com/arielwernick/virtual_bookshelf/actions/workflows/test.yml/badge.svg)](https://github.com/arielwernick/virtual_bookshelf/actions/workflows/test.yml)

## Features

- 📚 **Create shelves** - Organize recommendations into themed collections
- 🔗 **Share publicly** - Generate unique shareable links for your shelves
- 🖼️ **Beautiful social previews** - Dynamic OG images for LinkedIn/Twitter shares
- 🎵 **Multi-media support** - Add books, podcasts, music, videos, and links
- 🎙️ **Podcast episodes** - Highlight specific episodes from your favorite podcasts
- ⭐ **Star ratings** - Rate your items from 1-5 stars
- 📝 **Text-to-shelf import** - Paste a list and auto-create shelf items
- 🤖 **AI-readable** - Server-rendered content for AI assistants and crawlers
- 🔍 **Smart search** - Find items via Google Books, Spotify, and YouTube APIs
- 📱 **Responsive design** - Works great on all devices
- 🌙 **Dark mode** - Easy on the eyes, day or night
- 🔐 **Authentication** - Email/password and Google OAuth support
- 🔄 **Drag & drop** - Reorder items with intuitive drag and drop

## Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| Framework | Next.js | 16.x |
| UI Library | React | 19.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| Database | PostgreSQL | Neon Serverless |
| Auth | jose (JWT) + bcryptjs | - |
| Testing | Vitest + Testing Library | - |
| Analytics | Vercel Analytics | - |

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database ([Neon](https://neon.tech) recommended)
- Spotify API credentials (for music/podcast search)

### Environment Variables

Create a `.env.local` file:

```bash
DATABASE_URL=postgresql://...
SESSION_SECRET=your-secure-random-string
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
NEXT_PUBLIC_BASE_URL=https://your-domain.com

# Optional
DEMO_SHELF_TOKEN=your-admin-shelf-share-token
```

### Installation

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:ci` | Run tests with coverage |

## Project Structure

```
app/                    # Next.js App Router
├── api/                # API route handlers
│   ├── auth/           # Authentication (login, signup, logout, google)
│   ├── import/         # Text-to-shelf import feature
│   ├── items/          # Item CRUD operations
│   ├── og/             # OG image generation
│   ├── search/         # Search functionality (books, spotify, youtube)
│   └── shelf/          # Shelf management
├── dashboard/          # User dashboard
├── embed/              # Embeddable shelf views
├── import/             # Text import page
├── s/                  # Public shelf view (/s/[shareToken])
└── shelf/              # Shelf detail pages

components/
├── home/               # Home page components
├── import/             # Import feature components
├── shelf/              # Shelf & item components
└── ui/                 # Reusable UI components

lib/
├── api/                # External API clients (Google Books, Spotify, YouTube)
├── constants/          # Application constants
├── db/                 # Database client and queries
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Documentation

| Document | Description |
|----------|-------------|
| [Quick Start](docs/guides/QUICK_START.md) | Getting started guide |
| [Deployment](docs/guides/DEPLOYMENT_CHECKLIST.md) | Production deployment guide |
| [Code Patterns](docs/PATTERNS.md) | Coding patterns to follow |
| [Anti-Patterns](docs/ANTI_PATTERNS.md) | Patterns to avoid |
| [Contributing](CONTRIBUTING.md) | Contribution guidelines |

### Additional Docs

- **Architecture**: `docs/architecture/`
- **Product Requirements**: `docs/prds/`
- **Security**: `docs/security/`
- **Migrations**: `docs/migrations/`

## API Overview

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/google` - Google OAuth

### Shelves
- `GET /api/shelf` - List user's shelves
- `POST /api/shelf` - Create shelf
- `GET /api/shelf/[shelfId]` - Get shelf details
- `PATCH /api/shelf/[shelfId]` - Update shelf
- `DELETE /api/shelf/[shelfId]` - Delete shelf

### Items
- `POST /api/items` - Create item
- `PATCH /api/items/[itemId]` - Update item
- `DELETE /api/items/[itemId]` - Delete item

### Search
- `GET /api/search/books` - Search Google Books
- `GET /api/search/spotify` - Search Spotify
- `GET /api/search/youtube` - Search YouTube

## Deployment

Deploy on [Vercel](https://vercel.com):

1. Connect your GitHub repository
2. Set environment variables in project settings
3. Deploy!

For the demo shelf on home page, see [Admin Demo Setup](docs/guides/ADMIN_DEMO_SETUP.md).

## Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) and follow the code patterns in [docs/PATTERNS.md](docs/PATTERNS.md).

## License

MIT
