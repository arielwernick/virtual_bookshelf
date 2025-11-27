# Virtual Bookshelf

A Next.js application for curating and sharing your favorite books, podcasts, and music in a digital bookshelf.

## Features

- 📚 **Create shelves** - Organize your recommendations into themed collections
- 🔗 **Share publicly** - Generate shareable links for your shelves
- 🎵 **Multi-media support** - Add books, podcasts, and music
- 🔍 **Smart search** - Find items via Google Books and Spotify APIs
- 📱 **Responsive design** - Works great on all devices
- 🔐 **Authentication** - Email/password and Google OAuth support

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL (Neon Serverless)
- **Auth**: JWT (jose) + bcryptjs
- **Testing**: Vitest + Testing Library

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (we recommend [Neon](https://neon.tech))
- Spotify API credentials (for music/podcast search)
- Google Books API key (optional, for book search)

### Environment Variables

Create a `.env.local` file with:

```bash
DATABASE_URL=postgresql://...
SESSION_SECRET=your-secure-random-string
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret

# Optional: Demo shelf for home page (see docs/ADMIN_DEMO_SETUP.md)
DEMO_SHELF_TOKEN=your-admin-shelf-share-token
```

### Installation

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Demo Shelf Setup

The home page displays a demo shelf to showcase the app. This is managed through an **admin account approach**:

1. Create an admin account (e.g., `admin@virtualbookshelf.app`)
2. Create a public shelf with sample items
3. Set `DEMO_SHELF_TOKEN` to the shelf's share token

See [docs/ADMIN_DEMO_SETUP.md](docs/ADMIN_DEMO_SETUP.md) for detailed instructions.

## Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run test       # Run tests in watch mode
npm run test:run   # Run tests once
npm run test:ci    # Run tests with coverage
```

## Project Structure

```
app/                # Next.js App Router pages and API routes
components/         # React components
lib/
  ├── api/          # External API clients (Google Books, Spotify)
  ├── db/           # Database client and queries
  ├── types/        # TypeScript type definitions
  └── utils/        # Utility functions
docs/               # Documentation
test/               # Test setup and utilities
```

## Deployment

Deploy easily on [Vercel](https://vercel.com):

1. Connect your GitHub repository
2. Set environment variables in project settings
3. Deploy!

For the demo shelf, follow the setup in [docs/ADMIN_DEMO_SETUP.md](docs/ADMIN_DEMO_SETUP.md) after your first deployment.

## License

MIT
