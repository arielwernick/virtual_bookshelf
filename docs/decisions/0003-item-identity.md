# 0003. Items carry a canonical identifier; matching is by identifier only

Date: Nov 11, 2026. Status: proposed, on the `next` branch (issue #288).

## Context

An item was a title, a creator and two URLs. The search APIs returned a
catalogue id for every result and the app discarded it. Nothing could tell
that two shelves held the same book.

## Decision

Items get `source` and `source_id`. `lib/utils/itemIdentity.ts` derives them
from the item's URL with no network call, on every create and update. The same
function drives the backfill. Two items are the same work only when both
columns match.

## Considered

- **Matching on title and creator.** Rejected. A wrong merge shows one
  person's note under another book, and that costs more trust than a missed
  match.
- **Calling an outside API to resolve identifiers.** Rejected for now: it adds
  a quota and a failure mode to every write.
- **A `works` table straight away** (the work and edition split that library
  catalogues use). Deferred to issue #294. It needs these columns first, and
  with about 500 public items the counts would not mean much yet.
- **A JSONB column of identifiers.** One source per item is enough today; a
  second column pair or a table can follow when an item needs several.

## Consequences

- A Google Books volume id identifies an edition, so two editions of one book
  do not match yet. That is a missed match, not a wrong one.
- Identifiers are written in a second statement after the item is saved, and
  a failure there does not fail the save. Code can therefore deploy before
  migration 007; the backfill catches up any items saved in between.
- Structured data can carry `sameAs`, and per-work pages become possible.
