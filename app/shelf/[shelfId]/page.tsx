'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ShelfGrid } from '@/components/shelf/ShelfGrid';
import { ItemModal } from '@/components/shelf/ItemModal';
import { ShareModal } from '@/components/shelf/ShareModal';
import { Confetti } from '@/components/Confetti';
import { EmptyState, BookshelfIcon } from '@/components/ui/EmptyState';
import { SkeletonItemGrid } from '@/components/ui/SkeletonLoader';
import { Item } from '@/lib/types/shelf';
import Link from 'next/link';
import { Space_Grotesk } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

interface ShelfPageData {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  items: Item[];
  share_token: string;
  is_public: boolean;
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
      <div className="brand-shell min-h-screen">
        <header className="border-b border-[var(--db-ink)]/10 bg-[var(--db-coconut)]/85 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-end mb-4 gap-4 flex-wrap">
              <div>
                <div className="h-6 w-28 bg-[var(--db-ink)]/10 rounded-full animate-pulse mb-3"></div>
                <div className="h-12 w-72 bg-[var(--db-ink)]/10 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-24 bg-[var(--db-ink)]/10 rounded animate-pulse"></div>
              </div>
              <div className="flex gap-3">
                <div className="h-10 w-28 bg-[var(--db-ink)]/10 rounded-full animate-pulse"></div>
                <div className="h-10 w-24 bg-[var(--db-ink)]/10 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <SkeletonItemGrid count={10} />
        </main>
      </div>
    );
  }

  if (error || !shelfData) {
    return (
      <div className="brand-shell min-h-screen flex items-center justify-center px-4">
        <div className="plane plane-paper p-12 text-center max-w-md">
          <span className="tab-anchor" style={{ background: 'var(--db-crimson)', color: '#fff' }}>
            404
          </span>
          <h1 className={`${spaceGrotesk.className} mt-5 text-5xl font-bold text-[var(--db-ink)] mb-3 tracking-[-0.03em] leading-none`}>
            Shelf not found.
          </h1>
          <p className="text-[var(--db-ink)]/70 mb-8 font-medium">{error || "This bookshelf doesn't exist."}</p>
          <Link href="/" className="brand-button brand-button-blue inline-flex px-6 py-3">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="brand-shell min-h-screen">
      <header className="border-b border-[var(--db-ink)]/10 bg-[var(--db-coconut)]/85 backdrop-blur-md" data-reveal="zoom">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex justify-between items-end gap-6 flex-wrap">
            <div>
              <span className="tab-anchor" style={{ background: 'var(--db-blue)', color: '#fff' }}>
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--db-lime)]" />
                Collection
              </span>
              <h1
                className={`${spaceGrotesk.className} mt-4 font-bold tracking-[-0.035em] text-[var(--db-ink)] leading-[0.92]`}
                style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)' }}
              >
                {shelfData.name}
              </h1>
              <p className="mt-3 text-sm font-semibold text-[var(--db-ink)]/60 uppercase tracking-[0.14em]">
                {shelfData.items.length} {shelfData.items.length === 1 ? 'item' : 'items'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowShareModal(true)}
                className="px-5 py-2.5 border border-[var(--db-ink)]/15 text-[var(--db-ink)] rounded-full hover:border-[var(--db-blue)] hover:text-[var(--db-blue)] hover:bg-white transition-all text-sm font-semibold"
              >
                Share
              </button>
              {isOwner && (
                <Link
                  href={`/shelf/${shelfId}/edit`}
                  className="brand-button brand-button-blue px-5 py-2.5 text-sm"
                >
                  Edit
                </Link>
              )}
            </div>
          </div>
          {shelfData.description && (
            <div className="mt-6 pt-5 border-t border-[var(--db-ink)]/10 max-w-2xl" data-reveal="soft" data-stagger="1">
              <p className="text-[var(--db-ink)]/80 text-lg leading-snug">{shelfData.description}</p>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-reveal="soft" data-stagger="2">
        {shelfData.items.length === 0 ? (
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
        onPublishToggle={isOwner ? async (isPublic) => {
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
        } : undefined}
      />

      {showConfetti && <Confetti />}

      <footer className="mt-16 border-t border-[var(--db-ink)]/10 bg-[var(--db-coconut)]/85 backdrop-blur-md" data-reveal="soft" data-stagger="3">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-[var(--db-ink)]/65">
            Powered by <Link href="/" className="font-semibold text-[var(--db-blue)] hover:underline">Virtual Bookshelf</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
