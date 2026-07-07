/**
 * Reusable feature-comparison table for the competitor "alternative" landing
 * pages (Bento.me, Linktree, Goodreads). The first data column is typically the
 * highlighted "Virtual Bookshelf" column. Status glyphs are decorative — the
 * text label in each cell carries the meaning for screen readers.
 */

/** true = strength, false = gap, null = nuance / not the focus. */
export type Mark = true | false | null;

export interface ComparisonColumn {
  name: string;
  /** Visually highlight this column (use for Virtual Bookshelf). */
  highlight?: boolean;
}

export interface ComparisonRow {
  feature: string;
  /** One [label, mark] cell per column, in the same order as `columns`. */
  cells: [string, Mark][];
}

const HILITE = 'bg-gray-900/[0.03] dark:bg-gray-100/[0.04]';

function MarkIcon({ ok }: { ok: Mark }) {
  if (ok === true) {
    return (
      <svg className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    );
  }
  if (ok === false) {
    return (
      <svg className="w-4 h-4 shrink-0 text-gray-400 dark:text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4 shrink-0 text-gray-300 dark:text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden="true">
      <path d="M5 12h14" />
    </svg>
  );
}

export function ComparisonTable({
  columns,
  rows,
  note,
}: {
  columns: ComparisonColumn[];
  rows: ComparisonRow[];
  note?: string;
}) {
  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60">
              <th scope="col" className="py-4 px-5 font-semibold text-gray-700 dark:text-gray-300">Feature</th>
              {columns.map((col) => (
                <th
                  key={col.name}
                  scope="col"
                  className={`py-4 px-5 font-semibold ${col.highlight ? `text-gray-900 dark:text-gray-100 ${HILITE}` : 'text-gray-700 dark:text-gray-300'}`}
                >
                  {col.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
            {rows.map((row) => (
              <tr key={row.feature}>
                <th scope="row" className="py-3.5 px-5 font-medium text-gray-700 dark:text-gray-300">{row.feature}</th>
                {row.cells.map(([label, mark], i) => (
                  <td
                    key={columns[i]?.name ?? i}
                    className={`py-3.5 px-5 ${columns[i]?.highlight ? `text-gray-900 dark:text-gray-100 ${HILITE}` : 'text-gray-600 dark:text-gray-400'}`}
                  >
                    <span className="inline-flex items-center gap-2"><MarkIcon ok={mark} />{label}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note && <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">{note}</p>}
    </>
  );
}
