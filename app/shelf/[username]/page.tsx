import { notFound } from 'next/navigation';
import { ShelfGrid } from '@/components/shelf/ShelfGrid';
import { Item } from '@/lib/types/shelf';
import Link from 'next/link';

interface ShelfData {
  username: string;
  items: Item[];
  created_at: string;
}

async function getShelfData(username: string): Promise<ShelfData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                    'http://localhost:3000';
    
    const res = await fetch(`${baseUrl}/api/shelf/${username}`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Error fetching shelf:', error);
    return null;
  }
}

export default async function ShelfPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const shelfData = await getShelfData(username);

  if (!shelfData) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {shelfData.username}'s Bookshelf
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {shelfData.items.length} {shelfData.items.length === 1 ? 'item' : 'items'}
              </p>
            </div>
            <Link
              href={`/shelf/${username}/edit`}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              Edit Shelf
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ShelfGrid items={shelfData.items} />
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Powered by{' '}
            <a href="/" className="font-medium text-gray-900 hover:underline">
              Virtual Bookshelf
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const shelfData = await getShelfData(username);

  if (!shelfData) {
    return {
      title: 'Shelf Not Found',
    };
  }

  return {
    title: `${shelfData.username}'s Bookshelf`,
    description: `Check out ${shelfData.username}'s collection of ${shelfData.items.length} books, podcasts, and music.`,
    openGraph: {
      title: `${shelfData.username}'s Bookshelf`,
      description: `A curated collection of books, podcasts, and music`,
    },
  };
}
