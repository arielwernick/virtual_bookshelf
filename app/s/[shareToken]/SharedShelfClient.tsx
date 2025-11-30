'use client';

import { useState } from 'react';
import { ShelfGrid } from '@/components/shelf/ShelfGrid';
import { Top5ShelfGrid } from '@/components/shelf/Top5ShelfGrid';
import { ItemModal } from '@/components/shelf/ItemModal';
import { Item, ShelfType } from '@/lib/types/shelf';
import Link from 'next/link';

interface SharedShelfData {
  id: string;
  name: string;
  description: string | null;
  items: Item[];
  created_at: string;
  shelf_type: ShelfType;
}

interface SharedShelfClientProps {
  shelfData: SharedShelfData;
}

export function SharedShelfClient({ shelfData }: SharedShelfClientProps) {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                Shared Shelf
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{shelfData.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {shelfData.items.length} {shelfData.items.length === 1 ? 'item' : 'items'}
            </p>
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
        {shelfData.shelf_type === 'top5' ? (
          <Top5ShelfGrid items={shelfData.items} onItemClick={setSelectedItem} />
        ) : (
          <ShelfGrid items={shelfData.items} onItemClick={setSelectedItem} />
        )}
      </main>

      {/* Item Modal */}
      <ItemModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
      />

      {/* CTA Section */}
      <section className="mt-16 border-t border-gray-200 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Want to curate your own collection?
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Create My Own Shelf
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Powered by{' '}
            <Link href="/" className="font-medium text-gray-900 hover:underline">
              Virtual Bookshelf
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
