import Link from 'next/link';
import { getShelfByShareToken, getItemsByShelfId, getShelvesWithItems } from '@/lib/db/queries';
import { getDemoShelfToken, getDemoUserId } from '@/lib/utils/env';
import { DemoShelf } from '@/components/home/DemoShelf';
import { RotatingDemoShelf, ShelfPreview } from '@/components/home/RotatingDemoShelf';

const MAX_DEMO_SHELVES = 5;
const MAX_ITEMS_PER_SHELF = 12;

/**
 * Fetch demo shelves for the home page
 * 
 * Supports two modes:
 * 1. DEMO_USER_ID (preferred): Fetches all public shelves from admin user with optimized query
 * 2. DEMO_SHELF_TOKEN (legacy): Fetches a single shelf by token
 * 
 * See docs/ADMIN_DEMO_SETUP.md for setup instructions.
 */
async function getDemoShelvesData(): Promise<ShelfPreview[] | null> {
  // Try new approach first: fetch all public shelves from demo user using optimized query
  const userId = getDemoUserId();
  if (userId) {
    try {
      // Use optimized query that fetches shelves and items in a single database call
      const shelfPreviews = await getShelvesWithItems(userId, MAX_DEMO_SHELVES, MAX_ITEMS_PER_SHELF);
      
      if (shelfPreviews.length === 0) return null;

      return shelfPreviews;
    } catch {
      return null;
    }
  }

  // Fallback to legacy single shelf approach
  const token = getDemoShelfToken();
  if (!token) return null;

  try {
    const shelf = await getShelfByShareToken(token);
    if (!shelf || !shelf.is_public) return null;

    const items = await getItemsByShelfId(shelf.id);
    return [{ shelf, items }];
  } catch {
    return null;
  }
}

export default async function Home() {
  const demoShelves = await getDemoShelvesData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Your bookshelf, everywhere you are
            </h1>
            <p className="text-gray-600 text-lg sm:text-xl max-w-2xl mx-auto">
              Curate your favorite books, podcasts, and music. Share a link anywhere.
            </p>
          </div>

          {/* Demo Shelf - Rotating or Single */}
          {demoShelves && demoShelves.length > 0 && (
            <div className="mb-12">
              {demoShelves.length === 1 ? (
                // Single shelf - use original DemoShelf component
                <DemoShelf 
                  items={demoShelves[0].items} 
                  shelfName={demoShelves[0].shelf.name} 
                  shareToken={demoShelves[0].shelf.share_token}
                />
              ) : (
                // Multiple shelves - use rotating carousel
                <RotatingDemoShelf shelves={demoShelves} />
              )}
            </div>
          )}

          {/* Value prop */}
          <div className="text-center mb-12">
            <p className="text-gray-600 font-medium">
              Search. Click. Added.
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Perfect for your website, LinkedIn, socials, or portfolio
            </p>
          </div>

          {/* CTAs */}
          <div className="text-center">
            <Link
              href="/signup"
              className="inline-block px-8 py-3.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all font-medium text-lg shadow-md hover:shadow-lg"
            >
              Create Your Shelf
            </Link>
            <p className="mt-5 text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-gray-900 hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>© {new Date().getFullYear()} Virtual Bookshelf</p>
            <a 
              href="https://github.com/arielwernick/virtual_bookshelf" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-gray-700 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
