import type { Metadata } from 'next';
import { ImportFlow } from '@/components/import/ImportFlow';

export const metadata: Metadata = {
  title: 'Paste a list, get a shelf',
  description:
    'Paste any text with links (a reading list, a newsletter, a LinkedIn post) and see it as a shelf before you sign up.',
};

export default function ImportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <main id="main-content" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Paste a list. See your shelf.
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            Drop in a reading list, a newsletter or a LinkedIn post with links, and see it as a shelf
            before you save it.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-5 sm:p-8">
          <ImportFlow />
        </div>
      </main>
    </div>
  );
}
