'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ShelfGrid } from '@/components/shelf/ShelfGrid';
import { Top5ShelfGrid } from '@/components/shelf/Top5ShelfGrid';
import { ItemModal } from '@/components/shelf/ItemModal';
import { Item, ShelfType } from '@/lib/types/shelf';

export default function EmbedShelfPage() {
  const params = useParams();
  const shareToken = params?.shareToken as string;
  
  const [shelfData, setShelfData] = useState<{ username: string; items: Item[]; shelf_type?: ShelfType } | null>(null);
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!shelfData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-600">Shelf not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white">
      {/* Minimal header - just title */}
      <div className="border-b border-gray-200 p-4">
        <h1 className="text-lg font-bold text-gray-900">
          {shelfData.username}&apos;s Bookshelf
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          {shelfData.items.length} {shelfData.items.length === 1 ? 'item' : 'items'}
        </p>
      </div>

      {/* Shelf content */}
      <div className="p-4">
        {shelfData.shelf_type === 'top5' ? (
          <Top5ShelfGrid items={shelfData.items} onItemClick={setSelectedItem} />
        ) : (
          <ShelfGrid items={shelfData.items} onItemClick={setSelectedItem} />
        )}
      </div>

      {/* Item Modal */}
      <ItemModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
      />

      {/* Footer with attribution */}
      <div className="border-t border-gray-200 bg-gray-50 p-3 text-center">
        <p className="text-xs text-gray-500">
          Powered by{' '}
          <Link href="/" className="font-medium text-gray-900 hover:underline">
            Virtual Bookshelf
          </Link>
        </p>
      </div>
    </div>
  );
}
