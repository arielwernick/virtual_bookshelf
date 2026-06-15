'use client';

import { RefObject, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Item } from '@/lib/types/shelf';
import {
  MOBILE_BREAKPOINT,
  SSR_SAFE_ITEMS_PER_ROW,
  computeItemsPerRow,
  splitIntoRows,
} from '@/lib/utils/shelfLayout';

// useLayoutEffect measures before paint (avoids a flash of the wrong row split),
// but React warns when it runs during SSR — fall back to useEffect on the server.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * useShelfRows - splits a flat items list into shelf rows sized to the live
 * width of `containerRef`, so each rendered row holds exactly as many fixed-
 * width item cards as actually fit. This is the "dynamic resizing" that keeps a
 * single shelf from wrapping its items onto a second visual line under one
 * wooden ledge.
 *
 * Before measurement (SSR / first paint) it falls back to a desktop-safe fixed
 * count so the markup is stable and hydration-safe, then recomputes on mount
 * and whenever the container resizes (ResizeObserver).
 *
 * `containerRef` must point at the element that wraps the shelf rows (each row
 * spans its full width).
 */
export function useShelfRows<T extends HTMLElement>(
  items: Item[],
  containerRef: RefObject<T | null>,
): Item[][] {
  const [itemsPerRow, setItemsPerRow] = useState(SSR_SAFE_ITEMS_PER_ROW);

  useIsomorphicLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
      const next = computeItemsPerRow(el.clientWidth, isMobile);
      setItemsPerRow((prev) => (prev === next ? prev : next));
    };

    measure();

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef]);

  return useMemo(() => splitIntoRows(items, itemsPerRow), [items, itemsPerRow]);
}
