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
    <nav className="bg-white/95 backdrop-blur-md border-b border-warm-brown/10 sticky top-0 z-40 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Home link */}
          <Link
            href="/"
            className="flex items-center gap-3 text-text-dark hover:text-warm-brown transition-all duration-200 font-semibold"
            title="Virtual Bookshelf"
          >
            <svg
              className="w-8 h-8 drop-shadow-sm"
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
              <span className="text-xl font-bold tracking-tight">Virtual Bookshelf</span>
            )}
          </Link>

          {/* Right side - auth actions */}
          <div className="flex items-center gap-3">
            {isLoggedIn === null ? (
              // Loading state - show nothing to prevent flash
              <div className="w-24 h-10" />
            ) : isLoggedIn ? (
              // Logged in
              <>
                <Link
                  href="/dashboard"
                  className="px-5 py-2.5 text-sm font-medium text-white bg-warm-brown hover:bg-warm-brown/90 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 text-sm text-text-medium hover:text-warm-brown transition-all duration-200"
                >
                  Sign Out
                </button>
              </>
            ) : (
              // Not logged in
              <Link
                href="/login"
                className="px-5 py-2.5 text-sm font-medium text-white bg-warm-brown hover:bg-warm-brown/90 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
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
