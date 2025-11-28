import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getShelfByShareToken, getItemsByShelfId } from '@/lib/db/queries';
import { SharedShelfClient } from './SharedShelfClient';

interface PageProps {
  params: Promise<{ shareToken: string }>;
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
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://virtualbookshelf.app';
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
 * Shared Shelf Page - Server Component
 * Fetches shelf data server-side for better SEO and performance
 */
export default async function SharedShelfPage({ params }: PageProps) {
  const { shareToken } = await params;

  try {
    const shelf = await getShelfByShareToken(shareToken);

    if (!shelf || !shelf.is_public) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">Shelf Not Found</h2>
            <p className="text-gray-600 mb-8">This shared bookshelf doesn&apos;t exist or is not public.</p>
            <Link href="/" className="inline-block px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium">
              Go Home
            </Link>
          </div>
        </div>
      );
    }

    const items = await getItemsByShelfId(shelf.id);

    const shelfData = {
      id: shelf.id,
      name: shelf.name,
      description: shelf.description,
      items,
      created_at: shelf.created_at.toISOString(),
      shelf_type: shelf.shelf_type,
    };

    return <SharedShelfClient shelfData={shelfData} />;
  } catch (error) {
    console.error('Error loading shared shelf:', error);
    notFound();
  }
}
