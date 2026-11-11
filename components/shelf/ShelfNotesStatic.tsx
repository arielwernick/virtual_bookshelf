/**
 * ShelfNotesStatic - the curator's notes in full, server-rendered (issue #293).
 *
 * A note is the only text on a shelf page that exists nowhere else, and it is
 * what a search or answer engine would quote. The cards clamp each note to two
 * small lines, so the full text is rendered here as plain HTML under the
 * grid: one heading per item, the note as a block quote.
 *
 * No 'use client' directive - safe for SSR. Renders nothing when no item has
 * a note.
 */

import { Item } from '@/lib/types/shelf';
import { safeHttpUrl } from '@/lib/utils/validation';

interface ShelfNotesStaticProps {
  items: Item[];
}

export function ShelfNotesStatic({ items }: ShelfNotesStaticProps) {
  const withNotes = [...items]
    .filter((item) => item.notes && item.notes.trim())
    .sort((a, b) => a.order_index - b.order_index);

  if (withNotes.length === 0) return null;

  return (
    <section aria-labelledby="shelf-notes-heading" className="mt-16 max-w-3xl">
      <h2
        id="shelf-notes-heading"
        className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6"
      >
        Notes on this shelf
      </h2>
      <div className="space-y-8">
        {withNotes.map((item) => {
          const href = safeHttpUrl(item.external_url);
          return (
            <article key={item.id}>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    // Links are added by shelf owners, so they are marked as
                    // user-generated and pass no ranking credit.
                    rel="ugc nofollow noopener noreferrer"
                    className="hover:underline"
                  >
                    {item.title}
                  </a>
                ) : (
                  item.title
                )}
                {item.creator && (
                  <span className="font-normal text-gray-600 dark:text-gray-400">
                    {' '}
                    {item.type === 'stock' ? `(${item.creator})` : `by ${item.creator}`}
                  </span>
                )}
              </h3>
              <blockquote className="mt-2 border-l-2 border-gray-300 dark:border-gray-700 pl-4 text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {item.notes}
              </blockquote>
            </article>
          );
        })}
      </div>
    </section>
  );
}
