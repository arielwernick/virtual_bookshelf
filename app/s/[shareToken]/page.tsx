import { cache } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { permanentRedirect } from 'next/navigation';
import { getShelfByShareToken, getItemsByShelfId, getUserById } from '@/lib/db/queries';
import { buildShareSlug, buildSharePath, extractShareToken } from '@/lib/utils/slug';
import { ShelfGridStatic } from '@/components/shelf/ShelfGridStatic';
import { SharedShelfInteractive } from './SharedShelfInteractive';
import { generateShelfSchemaJson } from '@/lib/utils/schemaMarkup';

// Serve cached HTML and re-render in the background at most every 5 minutes.
// Mutations trigger immediate refreshes via revalidateSharedShelf().
export const revalidate = 300;

// Without generateStaticParams a dynamic route is always rendered on demand
// and `revalidate` is ignored. Returning [] pre-builds nothing but opts every
// visited token into on-demand static generation + caching (ISR).
export async function generateStaticParams(): Promise<{ shareToken: string }[]> {
  return [];
}

// Dedupe queries shared by generateMetadata and the page render.
// The route param may be a bare token (legacy links) or "<name-slug>-<token>";
// the token is always the segment after the last hyphen.
const resolveShelf = cache(async (param: string) => {
  const token = extractShareToken(param);
  const shelf = await getShelfByShareToken(token);
  if (shelf || token === param) return shelf;
  // Defensive fallback for any legacy token that itself contains a hyphen
  return getShelfByShareToken(param);
});
const getCachedItems = cache(getItemsByShelfId);

interface PageProps {
  params: Promise<{ shareToken: string }>;
}

/**
 * Not Found component for shared shelves
 */
function ShelfNotFound() {
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

/**
 * Generate dynamic metadata for shared shelves
 * This enables beautiful OG images when sharing on social media
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { shareToken } = await params;
  
  try {
    const shelf = await resolveShelf(shareToken);

    if (!shelf || !shelf.is_public) {
      return {
        title: 'Shelf Not Found',
        description: 'This shelf could not be found.',
        robots: { index: false },
      };
    }

    const items = await getCachedItems(shelf.id);
    const itemCount = items.length;
    const itemText = itemCount === 1 ? '1 item' : `${itemCount} items`;
    
    // Build description
    const description = shelf.description 
      ? `${shelf.description.substring(0, 150)}${shelf.description.length > 150 ? '...' : ''}`
      : `A curated collection of ${itemText} on Virtual Bookshelf`;

    // Get the base URL for OG image
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://virtualbookshelf.app';
    const ogImageUrl = `${baseUrl}/api/og/${shelf.share_token}`;

    // Canonical URL includes the shelf-name slug for SEO
    const canonicalPath = buildSharePath(shelf.name, shelf.share_token);

    return {
      title: shelf.name,
      description,
      alternates: { canonical: canonicalPath },
      openGraph: {
        title: shelf.name,
        description,
        type: 'website',
        url: `${baseUrl}${canonicalPath}`,
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `${shelf.name} - Virtual Bookshelf`,
          },
        ],
        siteName: 'Virtual Bookshelf',
      },
      twitter: {
        card: 'summary_large_image',
        title: shelf.name,
        description,
        images: [ogImageUrl],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: { absolute: 'Virtual Bookshelf' },
      description: 'Curate and share your favorite books, podcasts, and music.',
    };
  }
}

/**
 * Fetch shelf data for the page
 * Returns null if shelf not found or not public
 */
async function getShelfData(shareToken: string) {
  try {
    const shelf = await resolveShelf(shareToken);

    if (!shelf || !shelf.is_public) {
      return null;
    }

    // Items are deduped with generateMetadata; the creator's username
    // (for schema markup) is independent, so fetch it in parallel
    const [items, user] = await Promise.all([
      getCachedItems(shelf.id),
      getUserById(shelf.user_id),
    ]);
    const username = user?.username || null;

    return {
      shelf,
      id: shelf.id,
      name: shelf.name,
      description: shelf.description,
      items,
      username,
      created_at: shelf.created_at.toISOString(),
    };
  } catch (error) {
    console.error('Error loading shared shelf:', error);
    return null;
  }
}

/**
 * Shared Shelf Page - Server Component
 * 
 * Renders item content server-side for AI/crawler readability.
 * Interactive features (modal, click handling) are hydrated client-side.
 */
export default async function SharedShelfPage({ params }: PageProps) {
  const { shareToken } = await params;
  const shelfData = await getShelfData(shareToken);

  if (!shelfData) {
    return <ShelfNotFound />;
  }

  // Permanently redirect bare-token and stale-slug URLs to the canonical
  // slugged URL so search engines index a single, descriptive address.
  const canonicalSlug = buildShareSlug(shelfData.shelf.name, shelfData.shelf.share_token);
  let requestedSlug = shareToken;
  try {
    requestedSlug = decodeURIComponent(shareToken);
  } catch {
    // Malformed percent-encoding — compare the raw segment
  }
  if (requestedSlug !== canonicalSlug && !shelfData.shelf.share_token.includes('-')) {
    permanentRedirect(`/s/${canonicalSlug}`);
  }

  // Generate JSON-LD schema markup for AI readability
  const schemaJson = generateShelfSchemaJson(shelfData.shelf, shelfData.items, shelfData.username);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schemaJson }}
        suppressHydrationWarning
      />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* Header - Server Rendered */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-xs font-medium rounded">
                  Shared Shelf
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{shelfData.name}</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {shelfData.items.length} {shelfData.items.length === 1 ? 'item' : 'items'}
              </p>
            </div>

            {/* Description - Server Rendered for AI readability */}
            {shelfData.description && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-gray-700 dark:text-gray-300">{shelfData.description}</p>
              </div>
            )}
          </div>
        </header>

        {/* Main Content - Server Rendered Items with Client Interactivity */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SharedShelfInteractive items={shelfData.items}>
            <ShelfGridStatic items={shelfData.items} />
          </SharedShelfInteractive>
        </main>

        {/* CTA Section - Server Rendered */}
        <section className="mt-16 border-t border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Want to curate your own collection?
              </p>
              <Link
                href="/login"
                className="inline-block px-6 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
              >
                Create My Own Shelf
              </Link>
            </div>
          </div>
        </section>

        {/* Footer - Server Rendered */}
        <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Powered by{' '}
              <Link href="/" className="font-medium text-gray-900 dark:text-gray-100 hover:underline">
                Virtual Bookshelf
              </Link>
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
