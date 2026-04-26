'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Space_Grotesk } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['600', '700'],
});

export function Navigation() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        setIsLoggedIn(res.ok);
      })
      .catch(() => {
        setIsLoggedIn(false);
      });
  }, [pathname]);

  const handleSignOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--db-blue)] focus:text-white focus:rounded-full focus:shadow-lg"
      >
        Skip to main content
      </a>
      <nav className="sticky top-0 z-40 border-b border-[var(--db-ink)]/10 bg-[var(--db-coconut)]/85 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* The "Tab" — a colored plane containing the glyph. Dropbox's fulcrum concept. */}
            <Link
              href="/"
              className="group flex items-center gap-2.5"
              title="Virtual Bookshelf"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--db-ink)] transition-transform duration-200 group-hover:scale-105 group-hover:rotate-[-3deg]">
                <svg
                  className="h-4.5 w-4.5 text-[var(--db-lime)]"
                  width="18"
                  height="18"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <rect x="3" y="5" width="3" height="14" rx="0.5" />
                  <rect x="7.5" y="3" width="3" height="16" rx="0.5" />
                  <rect x="12" y="6" width="3" height="13" rx="0.5" />
                  <rect x="16.5" y="4" width="3" height="15" rx="0.5" />
                </svg>
              </span>
              <span className={`${spaceGrotesk.className} text-[var(--db-ink)] text-[15px] font-bold tracking-[-0.02em] group-hover:text-[var(--db-blue)] transition-colors`}>
                Virtual Bookshelf
              </span>
            </Link>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {isLoggedIn === null ? (
                <div className="w-20 h-8" />
              ) : isLoggedIn ? (
                <>
                  <Link
                    href="/import"
                    className="hidden sm:inline-flex items-center text-xs px-3 py-2 rounded-full text-[var(--db-ink)]/75 hover:text-[var(--db-ink)] hover:bg-[var(--db-ink)]/5 font-semibold uppercase tracking-[0.12em] transition-colors"
                  >
                    Import
                  </Link>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center text-xs px-3 py-2 rounded-full text-[var(--db-ink)]/75 hover:text-[var(--db-ink)] hover:bg-[var(--db-ink)]/5 font-semibold uppercase tracking-[0.12em] transition-colors"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="inline-flex items-center text-xs px-4 py-2 rounded-full bg-[var(--db-ink)] text-[var(--db-coconut)] hover:bg-black font-semibold uppercase tracking-[0.12em] transition-all hover:-translate-y-[1px] shadow-[0_4px_14px_rgba(30,25,25,0.2)]"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="inline-flex items-center text-xs px-3 py-2 rounded-full text-[var(--db-ink)]/75 hover:text-[var(--db-ink)] hover:bg-[var(--db-ink)]/5 font-semibold uppercase tracking-[0.12em] transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex items-center text-xs px-4 py-2 rounded-full bg-[var(--db-blue)] text-white hover:bg-[var(--db-blue-deep)] font-semibold uppercase tracking-[0.12em] transition-all hover:-translate-y-[1px] shadow-[0_4px_14px_rgba(0,97,254,0.3)]"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
