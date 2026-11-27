# System overview

How Virtual Bookshelf fits together today. Keep this short and true: when a
change makes a line here wrong, fix it in the same pull request. Detail
belongs in the code, [`PATTERNS.md`](PATTERNS.md) and the
[decision records](../decisions/).

Last reviewed: Nov 27, 2026.

## The shape of it

One Next.js 16 (App Router) app on Vercel, one Postgres database on Neon.
Server components and route handlers talk to the database directly through
`lib/db/queries.ts`; there is no separate backend service.

```
 Browser ─────────┐
 Embeds / oEmbed ─┤                    ┌─► Neon Postgres (prod / dev / per-PR branches)
 AI assistants ───┤──► Next.js on ─────┤
   (MCP + OAuth)  │    Vercel          └─► Google Books · Spotify · YouTube · Microlink
 Crawlers / LLMs ─┘   (middleware:          (search and link metadata)
                       rate limits)     ─► Resend (email)
```

## Who comes in, and where

| Visitor | Entry points | Code |
| --- | --- | --- |
| Signed-in curator | `/dashboard`, `/shelf/[shelfId]`, `/import` | `app/dashboard`, `app/shelf`, `components/shelf` |
| Anyone with a link | `/s/[shareToken]` | `app/s` |
| Other sites | `/embed/[shareToken]`, `/oembed` | `app/embed`, `app/oembed` |
| AI assistants | `/api/mcp/[transport]`, `/api/oauth/*`, `/oauth/authorize` | `app/api/mcp`, `app/api/oauth`, `lib/mcp` |
| Search engines and LLMs | `sitemap.xml`, `robots.txt`, `llms.txt`, landing pages | `app/sitemap.ts`, `app/robots.ts`, `app/llms.txt` |

## Main parts

- **Auth.** Better Auth, mounted at `/api/auth/[...all]`; username or Google
  sign-in, sessions in `auth_sessions`. Server code reads the user with
  `getCurrentUser()` (`lib/auth/session.ts`). The MCP endpoint has its own
  OAuth 2 server (client registration, authorize, token) for assistant
  connectors.
- **Shelves and items.** The core data. Route handlers under `app/api/shelf`
  and `app/api/items` follow authenticate → validate → authorize → act →
  `{ success, data | error }`. Items carry a canonical identity
  (`source`, `source_id`) derived from their URL
  ([0003](../decisions/0003-item-identity.md)).
- **Public shelf document.** Every public, machine-readable view of a shelf
  is built from one document through a field allowlist (`lib/shelf/`,
  [0002](../decisions/0002-public-shelf-document.md),
  [`SHELF_FORMAT.md`](../spec/SHELF_FORMAT.md)).
- **Catalog lookups.** `lib/api/` wraps Google Books, Spotify, YouTube and
  Microlink. `EXTERNAL_APIS=mock` swaps in fixtures for tests and agents.
  `middleware.ts` rate-limits the routes that fan out to these APIs.
- **Import.** Paste a list, resolve each line against the catalog, preview,
  create a shelf (`app/api/import`, `app/import`).
- **Views.** A beacon records daily shelf and embed views, skipping bots
  (`app/api/views`).
- **Email.** Only through `lib/email/send.ts` (Resend).

## Data

- Schema lives in `migrations/` (numbered, each with a `.down.sql`).
- Production, a schema-only `dev` branch, and per-PR branches for pull
  requests marked as database changes
  ([`PREVIEW_DATABASES.md`](../process/PREVIEW_DATABASES.md)).
  `lib/db/prodGuard.ts` stops scripts from touching production by accident.
- Tests run real queries on PGlite, in process.

## Open questions

Things worth a proposal in [`proposals/`](proposals/) when someone has time:

-
