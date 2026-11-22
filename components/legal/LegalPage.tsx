import Link from 'next/link';
import type { ReactNode } from 'react';
import { LegalLinks } from './LegalLinks';

/** Shown on both pages. Change it whenever the wording changes. */
export const LEGAL_LAST_UPDATED = { iso: '2026-11-16', label: 'November 16, 2026' };

const linkClass =
  'text-gray-900 dark:text-gray-100 underline underline-offset-2 hover:text-gray-600 dark:hover:text-gray-300';

/** A link inside legal copy. External links open in a new tab. */
export function LegalLink({ href, children }: { href: string; children: ReactNode }) {
  if (href.startsWith('/')) {
    return <Link href={href} className={linkClass}>{children}</Link>;
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
      {children}
    </a>
  );
}

/**
 * Where questions and account deletion requests go. Forwarded by Cloudflare
 * Email Routing on the virtualbookshelf.app zone to the project inbox.
 */
export const CONTACT_EMAIL = 'hello@virtualbookshelf.app';

export function ContactEmail() {
  return (
    <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>
      {CONTACT_EMAIL}
    </a>
  );
}

/**
 * A detail that has not been decided yet (issue #305). Deliberately loud so
 * it cannot ship unnoticed: replace every one before the pages go live.
 */
export function Placeholder({ children }: { children: ReactNode }) {
  return (
    <mark
      data-testid="legal-placeholder"
      className="rounded px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-100 font-medium"
    >
      [{children}]
    </mark>
  );
}

export function LegalSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`${id}-heading`} className="mt-10 sm:mt-12">
      <h2
        id={`${id}-heading`}
        className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-3"
      >
        {title}
      </h2>
      <div className="space-y-4 text-gray-600 dark:text-gray-400 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_strong]:text-gray-900 dark:[&_strong]:text-gray-100 [&_code]:text-sm [&_code]:break-words [&_code]:text-gray-800 dark:[&_code]:text-gray-200">
        {children}
      </div>
    </section>
  );
}

interface LegalPageProps {
  title: string;
  /** Breadcrumb label for this page. */
  crumb: string;
  intro: ReactNode;
  children: ReactNode;
}

/**
 * Shared layout for /privacy and /terms: the same frame as the other
 * standalone content pages, with a narrow reading column.
 */
export function LegalPage({ title, crumb, intro, children }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 flex flex-col">
      <main id="main-content" className="flex-1">
        <article className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-16 sm:pb-20">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
              <li><Link href="/" className="hover:text-gray-700 dark:hover:text-gray-300">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li className="text-gray-700 dark:text-gray-300 font-medium">{crumb}</li>
            </ol>
          </nav>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-3">
            {title}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Last updated: <time dateTime={LEGAL_LAST_UPDATED.iso}>{LEGAL_LAST_UPDATED.label}</time>
          </p>
          <div className="space-y-4 text-gray-600 dark:text-gray-400 text-lg leading-relaxed">{intro}</div>

          {children}
        </article>
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
            <p>© {new Date().getFullYear()} Virtual Bookshelf</p>
            <LegalLinks />
            <Link href="/" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors font-medium">Back to home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
