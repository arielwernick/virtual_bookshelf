import { Item } from '@/lib/types/shelf';

/**
 * Shelf row geometry.
 *
 * These numbers MUST stay in sync with how each ShelfRow is actually rendered
 * (the flex container's gap/padding, the row border, and the per-item width
 * classes) in ShelfGrid, ShelfContainerDnd, and ShelfGridStatic. If they drift,
 * the computed items-per-row won't match the browser's layout and a "row" will
 * wrap onto a second visual line under a single wooden ledge.
 *
 *   item width : w-[100px] (mobile) / sm:w-[140px] (>= 640px)
 *   row gap    : 0.5rem = 8px (both breakpoints)
 *   row padding: px-3 = 12px (mobile) / sm:px-6 = 24px (>= 640px)
 *   row border : 1px each side
 */
export const MOBILE_BREAKPOINT = 640;

const GEOMETRY = {
  mobile: { itemWidth: 100, gap: 8, padding: 12, border: 1 },
  desktop: { itemWidth: 140, gap: 8, padding: 24, border: 1 },
} as const;

/**
 * Desktop-safe fixed count used before measurement is available (SSR / first
 * paint) and as the permanent value for the no-JS static shelf. Chosen so a row
 * fits a max-w-7xl page without wrapping (7 * 140 + 6 * 8 = 1028px <= ~1166px).
 */
export const SSR_SAFE_ITEMS_PER_ROW = 7;

/**
 * computeItemsPerRow - the maximum number of fixed-width item cards that fit on
 * a single shelf row of width `containerWidth`. Always returns at least 1.
 *
 * `containerWidth` is the width of the element that wraps the shelf rows (each
 * row spans that full width); the row's own border and padding are subtracted
 * here to get the usable space for cards.
 */
export function computeItemsPerRow(containerWidth: number, isMobile: boolean): number {
  const { itemWidth, gap, padding, border } = isMobile ? GEOMETRY.mobile : GEOMETRY.desktop;
  const available = containerWidth - 2 * border - 2 * padding;
  if (available < itemWidth) return 1;
  // n cards fit when: n * itemWidth + (n - 1) * gap <= available
  //   => n <= (available + gap) / (itemWidth + gap)
  return Math.max(1, Math.floor((available + gap) / (itemWidth + gap)));
}

/**
 * splitIntoRows - chunk a flat items list into rows of at most `itemsPerRow`.
 */
export function splitIntoRows(items: Item[], itemsPerRow: number): Item[][] {
  const perRow = Math.max(1, itemsPerRow);
  const rows: Item[][] = [];
  for (let i = 0; i < items.length; i += perRow) {
    rows.push(items.slice(i, i + perRow));
  }
  return rows;
}
