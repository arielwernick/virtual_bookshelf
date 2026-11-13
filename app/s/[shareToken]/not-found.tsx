import Link from 'next/link';

/**
 * Shown, with a 404 status, when a shared shelf doesn't exist or isn't public.
 */
export default function ShelfNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Shelf Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">This shared bookshelf doesn&apos;t exist or is not public.</p>
        <Link href="/" className="inline-block px-6 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium">
          Go Home
        </Link>
      </div>
    </div>
  );
}
