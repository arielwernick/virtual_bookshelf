'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ShelfGrid } from '@/components/shelf/ShelfGrid';
import { Top5ShelfGrid } from '@/components/shelf/Top5ShelfGrid';
import { ItemModal } from '@/components/shelf/ItemModal';
import { ShareModal } from '@/components/shelf/ShareModal';
import { Confetti } from '@/components/Confetti';
import { EmptyState, BookshelfIcon } from '@/components/ui/EmptyState';
import { SkeletonItemGrid } from '@/components/ui/SkeletonLoader';
import { Item, ShelfType } from '@/lib/types/shelf';
import Link from 'next/link';

interface ShelfPageData {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  items: Item[];
  share_token: string;
  is_public: boolean;
  shelf_type: ShelfType;
}

export default function ShelfPage() {
  const params = useParams();
  const shelfId = params?.shelfId as string;

  const [shelfData, setShelfData] = useState<ShelfPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (!shelfId) return;

    async function fetchData() {
      try {
        const shelfRes = await fetch(`/api/shelf/${shelfId}`);
        if (!shelfRes.ok) {
          setError(shelfRes.status === 404 ? 'Shelf not found' : 'Failed to load shelf');
          setLoading(false);
          return;
        }
        const shelfJson = await shelfRes.json();
        setShelfData(shelfJson.data);

        try {
          const authRes = await fetch('/api/auth/me');
          if (authRes.ok) {
            const authJson = await authRes.json();
            setIsOwner(String(authJson.data.userId) === String(shelfJson.data.user_id));
          }
        } catch {
          // Not authenticated
        }
      } catch (err) {
        console.error('Error fetching shelf:', err);
        setError('Failed to load shelf');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [shelfId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="h-9 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="flex gap-3">
                <div className="h-10 w-28 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        </header>
        {/* Items Skeleton */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SkeletonItemGrid count={10} />
        </main>
      </div>
    );
  }

  if (error || !shelfData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Shelf Not Found</h2>
          <p className="text-gray-600 mb-8">{error || "This bookshelf doesn't exist."}</p>
          <Link href="/" className="inline-block px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="flex items-center gap-3">
                {shelfData.shelf_type === 'top5' && (
                  <svg className="w-8 h-8 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
                  </svg>
                )}
                <h1 className="text-3xl font-bold text-gray-900">{shelfData.name}</h1>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {shelfData.shelf_type === 'top5'
                  ? `${shelfData.items.length} of 5 ranked`
                  : `${shelfData.items.length} ${shelfData.items.length === 1 ? 'item' : 'items'}`
                }
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowShareModal(true)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Share Shelf
              </button>
              {isOwner && (
                <Link
                  href={`/shelf/${shelfId}/edit`}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  Edit Shelf
                </Link>
              )}
            </div>
          </div>
          {shelfData.description && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-gray-700">{shelfData.description}</p>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {shelfData.shelf_type === 'top5' ? (
          // Top 5 shelf - always show the grid with empty slots
          <Top5ShelfGrid items={shelfData.items} onItemClick={setSelectedItem} />
        ) : shelfData.items.length === 0 ? (
          <EmptyState
            icon={<BookshelfIcon />}
            heading="Your shelf is empty"
            subheading={
              isOwner
                ? 'Add your first book, podcast, or album to get started'
                : 'Check back later for updates.'
            }
            ctaText={isOwner ? 'Add Item' : undefined}
            ctaHref={isOwner ? `/shelf/${shelfId}/edit` : undefined}
          />
        ) : (
          <ShelfGrid items={shelfData.items} onItemClick={setSelectedItem} />
        )}
      </main>

      <ItemModal item={selectedItem} isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} />

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareToken={shelfData.share_token}
        isPublic={shelfData.is_public}
        onPublishToggle={async (isPublic) => {
          const res = await fetch(`/api/shelf/${shelfId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_public: isPublic }),
          });
          if (res.ok) {
            setShelfData(prev => prev ? { ...prev, is_public: isPublic } : null);
            if (isPublic) {
              setShowConfetti(true);
              setTimeout(() => setShowConfetti(false), 3500);
            }
          }
        }}
      />

      {showConfetti && <Confetti />}

      <footer className="mt-16 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Powered by <Link href="/" className="font-medium text-gray-900 hover:underline">Virtual Bookshelf</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
