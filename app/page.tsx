import Link from 'next/link';
import { getShelfByShareToken, getItemsByShelfId } from '@/lib/db/queries';
import { getDemoShelfToken } from '@/lib/utils/env';
import { DemoShelf } from '@/components/home/DemoShelf';

/**
 * Fetch the demo shelf for the home page
 * 
 * The demo shelf is managed by an admin account and configured via
 * the DEMO_SHELF_TOKEN environment variable. This allows admins to
 * update the demo content through the normal UI without deployments.
 * 
 * See docs/ADMIN_DEMO_SETUP.md for setup instructions.
 */
async function getDemoShelfData() {
  const token = getDemoShelfToken();
  if (!token) return null;

  try {
    const shelf = await getShelfByShareToken(token);
    if (!shelf || !shelf.is_public) return null;

    const items = await getItemsByShelfId(shelf.id);
    return { shelf, items, token };
  } catch {
    return null;
  }
}

export default async function Home() {
  const demoData = await getDemoShelfData();

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

        {/* Demo Shelf */}
        {demoData && (
          <div className="mb-10">
            <DemoShelf 
              items={demoData.items} 
              shelfName={demoData.shelf.name} 
              shareToken={demoData.token}
            />
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
