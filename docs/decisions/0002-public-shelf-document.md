# 0002. One public shelf document, many formats, built from a field allowlist

Date: Nov 11, 2026. Status: proposed, on the `next` branch (issue #285).

## Context

A public shelf was readable by machines only as JSON-LD inside the HTML page.
The embed API returned database rows as they were, including the owner's
internal id. Search and answer engines cite content they can fetch cleanly.

## Decision

`lib/shelf/publicShelf.ts` builds one versioned document per shelf, copying
fields one by one. Markdown, JSON and JSON Feed are renderings of that
document. The HTML page is canonical; the others are `noindex` and point to
it. One function, `loadPublicShelf`, decides whether a shelf may be shown.

The format is specified in `docs/spec/SHELF_FORMAT.md`.

## Considered

- **RSS or Atom.** JSON Feed carries the same information, needs no XML
  escaping and is one more rendering of the same object. Atom can be added the
  same way if a reader needs it.
- **ActivityPub or AT Protocol.** Both need a public identity for the author.
  Shelf owners are deliberately not named, so there is no actor to publish.
- **OPML.** The wrong shape for mixed media.
- **Serving formats under `/api/`.** `robots.txt` disallows `/api/`, and the
  formats belong next to the page they mirror.

## Consequences

- Adding a public field is a deliberate act: it has to be added to the
  allowlist and the spec.
- When visibility levels land (#263), one function changes.
- A breaking change to the document means a new `version`.
