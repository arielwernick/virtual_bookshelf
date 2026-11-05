'use client';

import { useEffect, useRef } from 'react';
import type { ViewSurface } from '@/lib/types/shelf';

interface ViewBeaconProps {
  shareToken: string;
  surface: ViewSurface;
}

/** Host name of the embedding page; never the full referrer URL. */
function getReferrerHost(): string {
  try {
    return document.referrer ? new URL(document.referrer).hostname : '';
  } catch {
    return '';
  }
}

/**
 * Counts one view of a public shelf or embed after the page loads.
 * Fires once per tab session (sessionStorage marker), so refreshes don't
 * count again. Renders nothing and never blocks the page.
 */
export function ViewBeacon({ shareToken, surface }: ViewBeaconProps) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current || !shareToken) return;
    sent.current = true;

    const key = `vb:viewed:${surface}:${shareToken}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      // Storage blocked (e.g. third-party iframe) — still count this load
    }

    if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') return;

    const payload: Record<string, string> = { shareToken, surface };
    if (surface === 'embed') {
      payload.embedHost = getReferrerHost();
    }

    try {
      navigator.sendBeacon(
        '/api/views',
        new Blob([JSON.stringify(payload)], { type: 'application/json' })
      );
    } catch {
      // Counting is best-effort
    }
  }, [shareToken, surface]);

  return null;
}
