import Link from 'next/link';

const linkClass = 'hover:text-gray-700 dark:hover:text-gray-300 transition-colors';

/**
 * The Privacy and Terms links, for page footers. The site has no shared
 * footer component: each standalone page has its own, and drops this in.
 */
export function LegalLinks() {
  return (
    <nav aria-label="Legal" className="flex items-center gap-4">
      <Link href="/privacy" className={linkClass}>Privacy</Link>
      <Link href="/terms" className={linkClass}>Terms</Link>
    </nav>
  );
}
