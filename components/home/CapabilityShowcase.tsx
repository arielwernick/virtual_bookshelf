/**
 * CapabilityShowcase — the "Shelve anything" section of the landing page.
 *
 * Renders one tile per media type a shelf can hold. Server component with no
 * remote images so it always renders crisply and instantly, independent of any
 * demo data. The novel live-stock capability is pulled out into a wider banner
 * so the remaining six tiles form a clean grid and the standout feature reads.
 */

import { CAPABILITY_TILES, type CapabilityTile } from '@/lib/constants/landingShowcase';
import type { ItemType } from '@/lib/types/shelf';

function Icon({ type, className = 'w-6 h-6' }: { type: ItemType; className?: string }) {
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

function CapabilityCard({ tile }: { tile: CapabilityTile }) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm transition-shadow hover:shadow-md">
      <span className={`flex-shrink-0 grid place-items-center w-11 h-11 rounded-lg ${tile.accent}`}>
        <Icon type={tile.type} />
      </span>
      <div className="min-w-0">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{tile.label}</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{tile.tagline}</p>
      </div>
    </div>
  );
}

function LiveStockBanner({ tile }: { tile: CapabilityTile }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-violet-200 dark:border-violet-900/60 bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/40 dark:to-gray-900 p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <span className={`flex-shrink-0 grid place-items-center w-11 h-11 rounded-lg ${tile.accent}`}>
          <Icon type={tile.type} />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{tile.label}</h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              <span className="block w-1.5 h-1.5 rounded-full bg-white animate-pulse" aria-hidden="true" />
              Live
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-md">
            {tile.tagline} Tap a ticker on a shelf to open a real-time quote, a one-year
            candlestick chart, and the latest headlines.
          </p>
        </div>
      </div>

      {/* Decorative sparkline hinting at the live chart (purely visual). */}
      <svg
        className="pointer-events-none absolute -right-2 bottom-0 h-20 w-48 text-violet-300/70 dark:text-violet-700/50"
        viewBox="0 0 200 80"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M0 60 L25 52 L50 58 L75 38 L100 44 L125 24 L150 30 L175 12 L200 18"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function CapabilityShowcase() {
  const tiles = CAPABILITY_TILES.filter((t) => !t.live);
  const liveTile = CAPABILITY_TILES.find((t) => t.live);

  return (
    <section aria-labelledby="capabilities-heading" className="mb-20 sm:mb-28">
      <div className="text-center mb-10">
        <h2 id="capabilities-heading" className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Shelve anything
        </h2>
        <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          One shelf holds it all — and pulls in covers, artwork, and details automatically.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => (
          <CapabilityCard key={tile.type} tile={tile} />
        ))}
      </div>

      {liveTile && (
        <div className="mt-4">
          <LiveStockBanner tile={liveTile} />
        </div>
      )}
    </section>
  );
}
