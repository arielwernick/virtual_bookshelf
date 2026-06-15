/**
 * CapabilityShowcase — the "Shelve anything" section of the landing page.
 *
 * A compact, scannable row of labeled icons, one per media type a shelf can
 * hold. Server component with no remote images, so it always renders crisply
 * and instantly. The novel live-stock capability gets a small "Live" tick.
 * Each icon carries its longer description as a hover title.
 */

import { CAPABILITY_TILES } from '@/lib/constants/landingShowcase';
import type { ItemType } from '@/lib/types/shelf';

function Icon({ type, className = 'w-7 h-7' }: { type: ItemType; className?: string }) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  switch (type) {
    case 'book':
      return (
        <svg {...common}>
          <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v15H6.5A2.5 2.5 0 0 0 4 19.5z" />
          <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20" />
        </svg>
      );
    case 'podcast':
      return (
        <svg {...common}>
          <rect x="9" y="2" width="6" height="11" rx="3" />
          <path d="M5 10a7 7 0 0 0 14 0" />
          <path d="M12 17v4" />
        </svg>
      );
    case 'podcast_episode':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'music':
      return (
        <svg {...common}>
          <path d="M9 18V5l11-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="17" cy="16" r="3" />
        </svg>
      );
    case 'video':
      return (
        <svg {...common}>
          <rect x="2" y="4" width="20" height="16" rx="3" />
          <path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'link':
      return (
        <svg {...common}>
          <path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1" />
          <path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" />
        </svg>
      );
    case 'stock':
      return (
        <svg {...common}>
          <path d="M3 17l5-5 4 4 8-8" />
          <path d="M21 8v5h-5" />
        </svg>
      );
    default:
      return null;
  }
}

export function CapabilityShowcase() {
  return (
    <section aria-labelledby="capabilities-heading" className="mb-20 sm:mb-28">
      <div className="text-center mb-10">
        <h2 id="capabilities-heading" className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Shelve anything
        </h2>
        <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          One shelf holds it all — covers, artwork, and details pull in automatically.
        </p>
      </div>

      <ul className="flex flex-wrap items-start justify-center gap-x-6 gap-y-7 sm:gap-x-10">
        {CAPABILITY_TILES.map((tile) => (
          <li
            key={tile.type}
            className="flex w-20 flex-col items-center gap-2.5 text-center"
            title={tile.tagline}
          >
            <span className={`grid place-items-center w-14 h-14 rounded-2xl ${tile.accent}`}>
              <Icon type={tile.type} />
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{tile.label}</span>
            {tile.live && (
              <span className="-mt-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" aria-hidden="true" />
                Live
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
