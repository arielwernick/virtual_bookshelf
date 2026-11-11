# Public shelf format, version 1

Every public shelf is published in four forms from one serializer
(`lib/shelf/publicShelf.ts`). This file is the contract for the
machine-readable ones.

| Form | URL | Content type |
| --- | --- | --- |
| Web page | `/s/<slug>-<token>` | `text/html`, with schema.org JSON-LD |
| Markdown | `/s/<slug>-<token>/shelf.md` | `text/markdown` |
| JSON | `/s/<slug>-<token>/shelf.json` | `application/json` |
| JSON Feed 1.1 | `/s/<slug>-<token>/feed.json` | `application/feed+json` |

The web page lists the other three as `<link rel="alternate">`. `/llms.txt`
lists the Markdown form of every public shelf.

## Rules

1. **Public shelves only.** A shelf that is missing or not public answers 404
   on every form. The check lives in one place, `loadPublicShelf`.
2. **The owner is never named,** and no internal id (user, shelf) appears.
   Fields are copied one by one from an allowlist, never spread from a row.
3. **The web page is canonical.** The other forms send
   `Link: <web page>; rel="canonical"` and `X-Robots-Tag: noindex`.
4. **Only `http` and `https` URLs are written as links.**
5. **A breaking change bumps `version`.** Adding an optional field does not.

## shelf.json

```json
{
  "version": 1,
  "name": "Favorite Books",
  "description": "What I hand to friends",
  "url": "https://virtualbookshelf.app/s/favorite-books-Xk9mP2vL",
  "item_count": 1,
  "created_at": "2026-09-01T00:00:00.000Z",
  "updated_at": "2026-11-01T00:00:00.000Z",
  "formats": {
    "html": "https://virtualbookshelf.app/s/favorite-books-Xk9mP2vL",
    "markdown": "https://virtualbookshelf.app/s/favorite-books-Xk9mP2vL/shelf.md",
    "json": "https://virtualbookshelf.app/s/favorite-books-Xk9mP2vL/shelf.json",
    "json_feed": "https://virtualbookshelf.app/s/favorite-books-Xk9mP2vL/feed.json"
  },
  "items": [
    {
      "position": 1,
      "type": "book",
      "title": "Deep Work",
      "creator": "Cal Newport",
      "url": "https://books.google.com/books?id=abc",
      "image_url": "https://example.com/cover.jpg",
      "note": "Changed how I plan my week",
      "rating": 5,
      "added_at": "2026-10-01T00:00:00.000Z"
    }
  ]
}
```

| Field | Meaning |
| --- | --- |
| `items[].position` | 1-based order chosen by the owner |
| `items[].type` | `book`, `podcast`, `podcast_episode`, `music`, `video`, `link` or `stock` |
| `items[].creator` | Author, artist, show or channel. For `stock` it is the ticker |
| `items[].note` | The curator's own words about the item, or `null` |
| `items[].rating` | 1 to 5, or `null` |
| `items[].added_at` | When the item was added to the shelf, not when the work was made |

## shelf.md

A title, the description, one line of provenance, then a numbered list. A
curator's note follows its item as a block quote. User text is escaped so it
cannot add headings or links.

## feed.json

[JSON Feed 1.1](https://www.jsonfeed.org/version/1.1/). One entry per item,
newest first. `external_url` is the item's own link, `url` is the shelf page,
and `content_text` holds the title, creator and note.

## Structured data on the web page

A `CollectionPage` whose `mainEntity` is an ordered `ItemList`. Item types are
`Book`, `PodcastSeries`, `PodcastEpisode`, `MusicAlbum`, `MusicRecording`,
`CreativeWork` (videos), `WebPage` (links) and `Corporation` (stocks). A note
or rating is a `Review` with no author. See `lib/utils/schemaMarkup.ts`.
