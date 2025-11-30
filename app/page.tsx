import Link from 'next/link';
import { getShelfByShareToken, getItemsByShelfId, getPublicShelvesByUserId } from '@/lib/db/queries';
import { getDemoShelfToken, getDemoUserId } from '@/lib/utils/env';
import { DemoShelf } from '@/components/home/DemoShelf';
import { RotatingDemoShelf, ShelfPreview } from '@/components/home/RotatingDemoShelf';

const MAX_DEMO_SHELVES = 5;

/**
 * Fetch demo shelves for the home page
 * 
 * Supports two modes:
 * 1. DEMO_USER_ID (preferred): Fetches all public shelves from admin user
 * 2. DEMO_SHELF_TOKEN (legacy): Fetches a single shelf by token
 * 
 * See docs/ADMIN_DEMO_SETUP.md for setup instructions.
 */
async function getDemoShelvesData(): Promise<ShelfPreview[] | null> {
  // Try new approach first: fetch all public shelves from demo user
  const userId = getDemoUserId();
  if (userId) {
    try {
      const shelves = await getPublicShelvesByUserId(userId);
      if (shelves.length === 0) return null;

      // Limit to MAX_DEMO_SHELVES and fetch items for each
      const limitedShelves = shelves.slice(0, MAX_DEMO_SHELVES);
      const shelfPreviews: ShelfPreview[] = await Promise.all(
        limitedShelves.map(async (shelf) => {
          const items = await getItemsByShelfId(shelf.id);
          return { shelf, items: items.slice(0, 12) };
        })
      );

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Share what you&apos;re reading and listening to
          </h1>
          <p className="text-gray-600 text-lg">
            Create a shelf. Add books, podcasts, or music. Share it anywhere.
          </p>
        </div>

        {/* Demo Shelf - Rotating or Single */}
        {demoShelves && demoShelves.length > 0 && (
          <div className="mb-10">
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

        {/* CTAs */}
        <div className="text-center mb-12">
          <Link
            href="/signup"
            className="inline-block px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-lg shadow-sm"
          >
            Create Your Shelf
          </Link>
          <p className="mt-4 text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-gray-900 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>

        {/* Use cases - light touch */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Perfect for your website, LinkedIn, or sharing recommendations with friends.
          </p>
        </div>
      </div>
    </div>
  );
}
