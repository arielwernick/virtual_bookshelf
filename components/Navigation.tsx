'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export function Navigation() {
  const router = useRouter();
  const pathname = usePathname();

  // Don't show navigation on home page
  if (pathname === '/') {
    return null;
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-900 hover:text-gray-700 transition-colors font-medium"
            title="Go home"
          >
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              {/* Books with different heights */}
              <rect x="2" y="8" width="2" height="10" />
              <rect x="4.5" y="6" width="2" height="12" />
              <rect x="7" y="7" width="2" height="11" />
              <rect x="9.5" y="5" width="2" height="13" />
              <rect x="12" y="7" width="2" height="11" />
              <rect x="14.5" y="6" width="2" height="12" />
              <rect x="17" y="8" width="2" height="10" />
              <rect x="19.5" y="7" width="2" height="11" />
              <line x1="1" y1="19" x2="23" y2="19" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <span className="text-base hidden sm:inline">Home</span>
          </Link>

          <button
            onClick={() => router.back()}
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Go back"
            aria-label="Go back"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}
