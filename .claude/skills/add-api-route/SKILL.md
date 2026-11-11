---
name: add-api-route
description: Add or change an API route handler in Virtual Bookshelf (app/api). Covers the six-step pattern, authentication, ownership checks, validation, safe URLs, response shape and the tests every route needs.
---

# Add an API route

Copy a working example rather than starting blank:
`app/api/account/export/route.ts` with `route.test.ts` (signed-in read), or
`app/api/items/reorder/route.ts` with `route.test.ts` (signed-in write on a
shelf).

## The pattern, in order

1. **Authenticate.** `const session = await getSession()` from
   `@/lib/utils/session`. No session: return 401 with `AUTH_ERRORS.UNAUTHORIZED`
   from `@/lib/constants/errors`.
2. **Parse the body.** `await request.json()` inside the `try`.
3. **Validate every field.** Use the helpers in `lib/utils/validation.ts`.
   Reject wrong types, empty strings and over-long lists with a 400. Cap any
   array a caller sends.
4. **Authorize.** Load the shelf or item and compare its `user_id` with
   `session.userId`. Not theirs: 403. Missing: 404. Never trust an id from
   the request to belong to the caller.
5. **Do the work** through functions in `lib/db/queries.ts`. Do not write SQL
   in the route. All SQL uses the `sql` tagged template; never build a query
   by joining strings.
6. **Respond** with `{ success: true, data }` or `{ success: false, error }`.

Wrap the handler in `try / catch`, log with
`createLogger('RouteName').errorWithException(...)`, and return a 500 with a
plain message. Never return the error object or a stack trace.

## Rules that are easy to miss

- **URLs from a person go through `safeHttpUrl`** (`lib/utils/validation.ts`)
  before they are stored. Only `http` and `https` are kept.
- **The server only fetches user-supplied URLs with `fetchPublicUrl`**
  (`lib/utils/safeFetch.ts`), never plain `fetch`.
- **Public responses are built field by field.** Use `toPublicShelf` or
  `redactItemForPublic` from `lib/shelf/publicShelf.ts`. Never return a
  database row as it is: rows carry the owner's id.
- **A private shelf answers 404 on public routes,** the same as a missing one.
  Use `loadPublicShelf` from `lib/shelf/loadPublicShelf.ts`.
- **After changing a shelf or its items,** call `revalidateSharedShelf` so
  the cached public page updates.
- **Routes that call an outside API** must be listed in `middleware.ts` so
  they are rate limited.

## Tests (required)

Create `route.test.ts` beside the route. Mock `@/lib/utils/session` and
`@/lib/db/queries`. Cover at least:

1. Signed out returns 401 and reads no data.
2. Someone else's shelf or item returns 403 and writes nothing.
3. Bad input returns 400.
4. The happy path returns 200 and calls the query with the expected arguments.

Finish with `npm run verify`.
