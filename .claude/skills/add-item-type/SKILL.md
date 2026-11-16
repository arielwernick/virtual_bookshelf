---
name: add-item-type
description: Add a new kind of item to Virtual Bookshelf shelves (alongside book, podcast, music, podcast_episode, video, link, stock). Lists every file that must change. Use only after the owner has agreed to the new type.
---

# Add an item type

**Stop first.** A new item type is a product decision. Do not add one unless
the owner asked for it in so many words. The audit of Nov 2026 advised
against more types; PDFs are the one type under discussion.

An item type is a string that appears in many places. Missing one produces a
type that can be saved but not shown, or shown but not validated.

## Find every place

Run this and work through the whole list:

```bash
grep -rln "podcast_episode" --include=*.ts --include=*.tsx . | grep -v node_modules | grep -v "^./.next"
```

## The places, and what each needs

| File | What to add |
| --- | --- |
| `lib/types/shelf.ts` | The new member of `ItemType` |
| `migrations/NNN_*.sql` | A new migration widening the `items_type_check` constraint. See the `add-migration` skill |
| `lib/utils/validation.ts` | The type in `validateItemType` |
| `lib/constants/aspectRatios.ts` | The card shape for the type |
| `lib/utils/schemaMarkup.ts` | A real schema.org type in `getSchemaType`, and the right creator property in `creatorProperties`. Never invent a type name |
| `lib/shelf/publicShelf.ts` | A label in `TYPE_LABELS` |
| `lib/utils/itemIdentity.ts` | A resolver, if items of this type have a catalogue id in their URL |
| `components/shelf/ItemCard.tsx`, `ItemCardStatic.tsx` | Badge colour and any special rendering |
| `components/shelf/ItemModal.tsx` | How the item opens |
| `components/shelf/ShelfPreviewCard.tsx`, `ShelfGrid.tsx` | Tile shape |
| `components/shelf/AddItemForm.tsx` | A tab and an add flow |
| `app/api/mcp/[transport]/route.ts` | The type in `ITEM_TYPES`, so the connector accepts it |
| `app/api/og/[shareToken]/route.tsx`, `app/api/og/landing/route.tsx` | How it appears on share cards |
| `docs/spec/SHELF_FORMAT.md` | The type in the list of values |
| `CLAUDE.md` | The `ItemType` line |

Leave the homepage showcase (`components/home/`, `lib/constants/landingShowcase.ts`)
alone unless the owner asks: it is marketing copy.

## Tests

Every file above has a test beside it. Add the new type to each, including
the "every type maps to a real schema.org type" test in
`lib/utils/schemaMarkup.test.ts`.

Finish with `npm run verify`. TypeScript will point at most places you
missed, because several maps are typed as `Record<ItemType, ...>`.
