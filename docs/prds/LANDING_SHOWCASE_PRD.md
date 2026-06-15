# Landing Page Capability Showcase - PRD

## Overview

Rebuild the home page from a single demo shelf into a full capability showcase
that reflects everything a shelf can now hold, and seed a richer set of real
sample shelves to power it.

## Problem Statement

The landing page was built when shelves held only books, podcasts, and music —
and its copy still said exactly that. The app has since grown to **seven item
types** (`book`, `podcast`, `podcast_episode`, `music`, `video`, `link`,
`stock`) plus notes, ratings, drag ordering, public/private sharing, embeds, and
auto-generated social preview images. A first-time visitor saw none of it.

The novel **stock** type is the clearest example: tapping a ticker opens a live
drawer with a real-time quote, a one-year candlestick chart, and news headlines
(`components/shelf/StockDrawer.tsx`). That magic only appears on a real shelf, so
the landing page must let visitors click through to live examples.

## Goals

- Communicate the full breadth of what a shelf holds, above and below the fold.
- Keep the existing "admin account → public shelves → rotating gallery" pattern;
  expand it with more, more varied sample shelves.
- Let visitors click into **live, fully-interactive** example shelves.
- Degrade gracefully: the marketing sections render even with no demo data.

## Solution

### Part A — Seed real sample shelves (`scripts/seed-landing-shelves.ts`)

An idempotent seed creates/refreshes one admin account and five public shelves,
surfaced on the home page via `DEMO_USER_ID`. A **mix of category demos and
personality shelves** covers all seven types:

| Shelf | Type focus | Notes |
| --- | --- | --- |
| Stocks to Watch | `stock` | The live-drawer capability |
| Essential Reads | `book` | Notes + ratings on a few |
| A Founder's Bookshelf | `book` + `podcast` + `stock` + `link` | Personality, mixed |
| Sunday Listening | `podcast` + `podcast_episode` + `music` | Audio + the episode type |
| Worth Watching | `video` + `link` | YouTube + articles |

Cover art reuses the patterns already proven in the codebase (Google Books /
Open Library, Spotify `i.scdn.co`, iTunes artwork, YouTube thumbnails); stock
logos and live data derive from the ticker at render/click time. Every image URL
was HEAD-checked at authoring time. Run with `npm run seed`; the script prints
the admin user id to set as `DEMO_USER_ID`.

### Part B — Rebuild `app/page.tsx`

Server component, top to bottom:

1. **Hero** — breadth-spanning headline + CTAs.
2. **Live demo gallery** — the existing `RotatingDemoShelf`, fed by the seeded
   shelves; cards deep-link to live `/s/[token]` pages. Hidden if no demo data.
3. **"Shelve anything"** (`CapabilityShowcase`) — one tile per media type, with
   the live-stock capability pulled into a wider spotlight banner.
4. **"More than a list"** (`FeatureHighlights`) — notes & ratings, manual
   ordering, visibility, share & embed, auto preview images, crawler/AI-readable.
5. **"Search · Click · Added"** — three-step ease-of-use strip.
6. **Final CTA** + footer.

Sections 3–5 are static (driven by `lib/constants/landingShowcase.ts`), so the
page is compelling even before any shelf is seeded. The showcase components are
server-rendered with no remote images — fast, crash-proof, and themselves an
example of the "readable by search & AI" feature being advertised.

## Out of Scope

- Refreshing the `/api/og/landing` social-card copy.
- Any change to the shelf, item, or auth data models.

## Verification

- `npm run lint`, `npm run test:run` (incl. new component tests), `npm run build`.
- `npm run seed` → set `DEMO_USER_ID` → `npm run dev`; confirm gallery rotation,
  click-through to a live shelf, the stock drawer loading live data, responsive
  + dark mode, and graceful degradation when `DEMO_USER_ID` is unset.
