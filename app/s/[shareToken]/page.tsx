import { Metadata } from 'next';
import Link from 'next/link';
import { getShelfByShareToken, getItemsByShelfId } from '@/lib/db/queries';
import { SharedShelfClient } from './SharedShelfClient';
import { generateShelfSchemaJson } from '@/lib/utils/schemaMarkup';

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
    const shelf = await getShelfByShareToken(shareToken);
    
    if (!shelf || !shelf.is_public) {
      return {
        title: 'Shelf Not Found | Virtual Bookshelf',
        description: 'This shelf could not be found.',
      };
    }

    const items = await getItemsByShelfId(shelf.id);
    const itemCount = items.length;
    const itemText = itemCount === 1 ? '1 item' : `${itemCount} items`;
    
    // Build description
    const description = shelf.description 
      ? `${shelf.description.substring(0, 150)}${shelf.description.length > 150 ? '...' : ''}`
      : `A curated collection of ${itemText} on Virtual Bookshelf`;

    // Get the base URL for OG image
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://virtualbookshelf.vercel.app';
    const ogImageUrl = `${baseUrl}/api/og/${shareToken}`;

    return {
      title: `${shelf.name} | Virtual Bookshelf`,
      description,
      openGraph: {
        title: shelf.name,
        description,
        type: 'website',
        url: `${baseUrl}/s/${shareToken}`,
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
      title: 'Virtual Bookshelf',
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
    const shelf = await getShelfByShareToken(shareToken);

    if (!shelf || !shelf.is_public) {
      return null;
    }

    const items = await getItemsByShelfId(shelf.id);

    return {
      shelf,
      id: shelf.id,
      name: shelf.name,
      description: shelf.description,
      items,
      created_at: shelf.created_at.toISOString(),
    };
  } catch (error) {
    console.error('Error loading shared shelf:', error);
    return null;
  }
}

/**
 * Shared Shelf Page - Server Component
 * Fetches shelf data server-side for better SEO and performance
 */
export default async function SharedShelfPage({ params }: PageProps) {
  const { shareToken } = await params;
  const shelfData = await getShelfData(shareToken);

  if (!shelfData) {
    return <ShelfNotFound />;
  }

  // Generate JSON-LD schema markup for AI readability
  const schemaJson = generateShelfSchemaJson(shelfData.shelf, shelfData.items);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schemaJson }}
        suppressHydrationWarning
      />
      <SharedShelfClient shelfData={shelfData} />
    </>
  );
}
