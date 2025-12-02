'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export function Navigation() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    // Check auth status on mount and when pathname changes
    fetch('/api/auth/me')
      .then((res) => {
        setIsLoggedIn(res.ok);
      })
      .catch(() => {
        setIsLoggedIn(false);
      });
  }, [pathname]);

  const isHomePage = pathname === '/';

  const handleSignOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo / Home link */}
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-300 transition-colors font-medium"
            title="Virtual Bookshelf"
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
            {isHomePage && (
              <span className="text-base font-semibold">Virtual Bookshelf</span>
            )}
          </Link>

          {/* Right side - auth actions */}
          <div className="flex items-center gap-3">
            {isLoggedIn === null ? (
              // Loading state - show nothing to prevent flash
              <div className="w-20 h-8" />
            ) : isLoggedIn ? (
              // Logged in
              <>
                <Link
                  href="/dashboard"
                  className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Sign Out
                </button>
              </>
            ) : (
              // Not logged in
              <Link
                href="/login"
                className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
