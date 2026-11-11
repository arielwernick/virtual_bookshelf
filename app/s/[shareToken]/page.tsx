import { cache } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { getShelfByShareToken, getItemsByShelfId } from '@/lib/db/queries';
import { buildShareSlug, buildSharePath, extractShareToken } from '@/lib/utils/slug';
import { ShelfGridStatic } from '@/components/shelf/ShelfGridStatic';
import { SharedShelfInteractive } from './SharedShelfInteractive';
import { generateShelfSchemaJson } from '@/lib/utils/schemaMarkup';
import { ViewBeacon } from '@/components/ViewBeacon';
import { ShelfNotesStatic } from '@/components/shelf/ShelfNotesStatic';
import { describeShelfForSearch, formatShelfDate } from '@/lib/utils/shelfSummary';
import { SHARED_SHELF_CTA_LINK } from '@/lib/utils/growthLinks';
import { buildShelfUrls, redactItemForPublic } from '@/lib/shelf/publicShelf';

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
 * Generate dynamic metadata for shared shelves
 * This enables beautiful OG images when sharing on social media
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { shareToken } = await params;

  const shelf = await resolveShelf(shareToken);

  if (!shelf || !shelf.is_public) {
    return {
      title: 'Shelf Not Found',
      description: 'This shelf could not be found.',
      robots: { index: false },
    };
  }

  const items = await getCachedItems(shelf.id);
  // The owner's description, or the first few titles when there is none
  const description = describeShelfForSearch(
    shelf.description,
    [...items].sort((a, b) => a.order_index - b.order_index).map((item) => item.title)
  );

  // Get the base URL for OG image
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://virtualbookshelf.app';
  const ogImageUrl = `${baseUrl}/api/og/${shelf.share_token}`;

  // Canonical URL includes the shelf-name slug for SEO
  const canonicalPath = buildSharePath(shelf.name, shelf.share_token);
  const twins = buildShelfUrls(shelf.name, shelf.share_token, baseUrl);

  return {
    title: shelf.name,
    description,
    alternates: {
      canonical: canonicalPath,
      // Machine-readable twins of this page (issue #285)
      types: {
        'text/markdown': twins.markdown,
        'application/json': twins.json,
        'application/feed+json': twins.json_feed,
        // oEmbed discovery, so a pasted shelf link can unfurl as the embed (#286)
        'application/json+oembed': `${baseUrl}/oembed?format=json&url=${encodeURIComponent(twins.html)}`,
      },
    },
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
}

/**
 * Fetch shelf data for the page
 * Returns null if shelf not found or not public
 */
async function getShelfData(shareToken: string) {
  // Database errors are left to throw: ISR then keeps serving the last good
  // page instead of caching a "not found" for a shelf that exists.
  const shelf = await resolveShelf(shareToken);

  if (!shelf || !shelf.is_public) {
    return null;
  }

  // Items are deduped with generateMetadata. Owner and shelf ids are blanked
  // before the rows are passed to client components and into the page payload.
  const items = (await getCachedItems(shelf.id)).map(redactItemForPublic);

  return {
    shelf,
    name: shelf.name,
    description: shelf.description,
    items,
    created_at: shelf.created_at.toISOString(),
  };
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
    // A real 404 status, not a "not found" page served with 200 (issue #284)
    notFound();
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
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://virtualbookshelf.app';
  const schemaJson = generateShelfSchemaJson(shelfData.shelf, shelfData.items, {
    url: `${baseUrl}/s/${canonicalSlug}`,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schemaJson }}
        suppressHydrationWarning
      />
      {/* Counts the view from the browser so the cached page stays static */}
      <ViewBeacon shareToken={shelfData.shelf.share_token} surface="shelf" />
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
                {' · '}
                Updated{' '}
                <time dateTime={new Date(shelfData.shelf.updated_at).toISOString()}>
                  {formatShelfDate(shelfData.shelf.updated_at)}
                </time>
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
          {/* Item cards use h3; this keeps the heading order h1 > h2 > h3 */}
          <h2 className="sr-only">Items on this shelf</h2>
          <SharedShelfInteractive items={shelfData.items}>
            <ShelfGridStatic items={shelfData.items} />
          </SharedShelfInteractive>

          {/* Every note in full, in the HTML, so it can be read and quoted (#293) */}
          <ShelfNotesStatic items={shelfData.items} />
        </main>

        {/* CTA Section - Server Rendered */}
        <section className="mt-16 border-t border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Want to curate your own collection?
              </p>
              <Link
                href={SHARED_SHELF_CTA_LINK}
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
