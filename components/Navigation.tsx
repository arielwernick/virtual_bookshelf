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
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 h-14">
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

          <Link
            href="/"
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Go home"
            aria-label="Go home"
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a3 3 0 013 3v1h2v-1a1 1 0 011-1h6a1 1 0 011 1v1h2v-1a3 3 0 013-3v-6.586l.707.707a1 1 0 001.414-1.414l-7-7z" />
            </svg>
          </Link>
        </div>
      </div>
    </nav>
  );
}
