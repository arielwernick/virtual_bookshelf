/**
 * FeatureHighlights — the "More than a list" section of the landing page.
 *
 * Static server component highlighting what a shelf does beyond collecting
 * items: notes & ratings, manual ordering, visibility, sharing/embedding,
 * auto-generated social previews, and server-rendered (crawler/AI-readable)
 * pages. Copy lives in `lib/constants/landingShowcase.ts`.
 */

import { FEATURE_HIGHLIGHTS, type FeatureIcon } from '@/lib/constants/landingShowcase';

function Icon({ icon, className = 'w-5 h-5' }: { icon: FeatureIcon; className?: string }) {
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
  switch (icon) {
    case 'note':
      return (
        <svg {...common}>
          <path d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />
          <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" />
        </svg>
      );
    case 'drag':
      return (
        <svg {...common}>
          <circle cx="9" cy="6" r="1" />
          <circle cx="15" cy="6" r="1" />
          <circle cx="9" cy="12" r="1" />
          <circle cx="15" cy="12" r="1" />
          <circle cx="9" cy="18" r="1" />
          <circle cx="15" cy="18" r="1" />
        </svg>
      );
    case 'lock':
      return (
        <svg {...common}>
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      );
    case 'share':
      return (
        <svg {...common}>
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
        </svg>
      );
    case 'image':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      );
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
      );
    default:
      return null;
  }
}

export function FeatureHighlights() {
  return (
    <section aria-labelledby="features-heading" className="mb-20 sm:mb-28">
      <div className="text-center mb-10">
        <h2 id="features-heading" className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          More than a list
        </h2>
        <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Shape a shelf, share it your way, and let it work everywhere you do.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURE_HIGHLIGHTS.map((feature) => (
          <div
            key={feature.title}
            className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm"
          >
            <span className="grid place-items-center w-10 h-10 rounded-lg bg-warm-cream text-warm-brown dark:bg-gray-800 dark:text-muted-gold">
              <Icon icon={feature.icon} />
            </span>
            <h3 className="mt-4 font-semibold text-gray-900 dark:text-gray-100">{feature.title}</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
