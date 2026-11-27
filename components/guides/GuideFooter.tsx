import Link from 'next/link';
import { LegalLinks } from '@/components/legal/LegalLinks';

/** Footer for the /guides pages, matching the other standalone pages. */
export function GuideFooter() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
          <p>© {new Date().getFullYear()} Virtual Bookshelf</p>
          <LegalLinks />
          <Link href="/" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors font-medium">Back to home</Link>
        </div>
      </div>
    </footer>
  );
}
