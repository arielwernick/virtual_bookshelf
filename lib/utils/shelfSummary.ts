/**
 * Short, honest text about a shelf for places that need one line:
 * the meta description and the "updated" date on the page (issue #293).
 */

const MAX_DESCRIPTION_LENGTH = 150;

/**
 * The meta description for a public shelf.
 *
 * The owner's own description wins. Without one, name what is actually on the
 * shelf instead of a generic "a curated collection of N items", which says
 * nothing a searcher can use.
 */
export function describeShelfForSearch(
  description: string | null | undefined,
  titles: string[]
): string {
  const own = description?.trim();
  if (own) {
    return own.length > MAX_DESCRIPTION_LENGTH
      ? `${own.substring(0, MAX_DESCRIPTION_LENGTH)}...`
      : own;
  }

  if (titles.length === 0) return 'An empty shelf on Virtual Bookshelf';

  const named = titles.slice(0, 3);
  const rest = titles.length - named.length;
  const list =
    named.length === 1
      ? named[0]
      : `${named.slice(0, -1).join(', ')} and ${named[named.length - 1]}`;

  const text = rest > 0 ? `A shelf with ${list}, plus ${rest} more.` : `A shelf with ${list}.`;
  // Long titles: fall back to the count rather than cut a title mid-word.
  return text.length <= MAX_DESCRIPTION_LENGTH + 40
    ? text
    : `A shelf of ${titles.length} items on Virtual Bookshelf`;
}

/** "Nov 1, 2026". Formatted in UTC so server and reader agree on the day. */
export function formatShelfDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(date));
}
