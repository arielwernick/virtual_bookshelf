'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ShelfGrid } from '@/components/shelf/ShelfGrid';
import { ItemModal } from '@/components/shelf/ItemModal';
import { Item } from '@/lib/types/shelf';
import Link from 'next/link';

export default function SharedShelfPage() {
  const params = useParams();
  const shareToken = params?.shareToken as string;

  const [shelfData, setShelfData] = useState<{ username: string; description: string | null; items: Item[]; created_at: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  useEffect(() => {
    async function fetchShelf() {
      try {
        const res = await fetch(`/api/shelf/share/${shareToken}`);
        if (res.ok) {
          const data = await res.json();
          setShelfData(data.data);
        }
      } catch (error) {
        console.error('Error fetching shelf:', error);
      } finally {
        setLoading(false);
      }
    }

    if (shareToken) {
      fetchShelf();
    }
  }, [shareToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading shelf...</p>
        </div>
      </div>
    );
  }

  if (!shelfData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Shelf Not Found</h2>
          <p className="text-gray-600 mb-8">This shared bookshelf doesn&apos;t exist or the link has expired.</p>
          <Link href="/" className="inline-block px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                  Shared Shelf
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                {shelfData.username}&apos;s Bookshelf
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {shelfData.items.length} {shelfData.items.length === 1 ? 'item' : 'items'}
              </p>
            </div>
            <Link
              href="/create"
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              Create My Own Shelf
            </Link>
          </div>

          {/* Description */}
          {shelfData.description && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-gray-700">{shelfData.description}</p>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ShelfGrid items={shelfData.items} onItemClick={setSelectedItem} />
      </main>

      {/* Item Modal */}
      <ItemModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
      />

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
