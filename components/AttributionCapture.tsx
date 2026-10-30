'use client';

import { useEffect } from 'react';
import {
  ATTRIBUTION_COOKIE,
  ATTRIBUTION_MAX_AGE_SECONDS,
  buildAttributionCookieValue,
} from '@/lib/utils/attribution';

/**
 * Records first-touch attribution (external referrer + UTM params) in a
 * cookie on the visitor's first page load. Renders nothing.
 */
export function AttributionCapture() {
  useEffect(() => {
    try {
      const alreadySet = document.cookie
        .split('; ')
        .some((c) => c.startsWith(`${ATTRIBUTION_COOKIE}=`));
      if (alreadySet) return;

      const value = buildAttributionCookieValue(window.location.href, document.referrer);
      const secure = window.location.protocol === 'https:' ? '; Secure' : '';
      document.cookie =
        `${ATTRIBUTION_COOKIE}=${value}; Path=/; Max-Age=${ATTRIBUTION_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
    } catch {
      // Attribution is best-effort; never break the page over it.
    }
  }, []);

  return null;
}
