'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EmptyState, BookshelfIcon } from '@/components/ui/EmptyState';
import { SkeletonShelfGrid } from '@/components/ui/SkeletonLoader';
import { AddItemModal } from '@/components/shelf/AddItemModal';
import { Space_Grotesk } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

interface Shelf {
  id: string;
  name: string;
  description: string | null;
  share_token: string;
  is_public: boolean;
  item_count: number;
  created_at: string;
  updated_at: string;
}

interface DashboardData {
  user_id: string;
  username: string | null;
  email: string;
  shelves: Shelf[];
}

// Dropbox-style accent planes cycled per card for a rich, varied grid
const SHELF_ACCENTS = [
  { bar: 'var(--db-blue)', tab: 'var(--db-blue)', text: '#fff' },
  { bar: 'var(--db-canopy)', tab: 'var(--db-canopy)', text: '#fff' },
  { bar: 'var(--db-crimson)', tab: 'var(--db-crimson)', text: '#fff' },
  { bar: 'var(--db-sunset)', tab: 'var(--db-sunset)', text: 'var(--db-ink)' },
  { bar: 'var(--db-gold)', tab: 'var(--db-gold)', text: 'var(--db-ink)' },
  { bar: 'var(--db-plum)', tab: 'var(--db-plum)', text: '#fff' },
  { bar: 'var(--db-ocean)', tab: 'var(--db-ocean)', text: '#fff' },
  { bar: 'var(--db-lime)', tab: 'var(--db-lime)', text: 'var(--db-ink)' },
] as const;

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creatingShelf, setCreatingShelf] = useState(false);
  const [shelfName, setShelfName] = useState('');
  const [shelfDescription, setShelfDescription] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newShelfId, setNewShelfId] = useState<string>('');
  const [newShelfName, setNewShelfName] = useState<string>('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/shelf/dashboard');
        const json = await res.json();

        if (!json.success) {
          console.error('Dashboard API error:', json.error);
          router.push('/login');
          return;
        }

        setData(json.data);
      } catch (err) {
        console.error('Failed to fetch dashboard:', err);
        setError('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [router]);

  const handleCreateShelf = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingShelf(true);
    setError('');

    try {
      const res = await fetch('/api/shelf/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: shelfName,
          description: shelfDescription || undefined,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error || 'Failed to create shelf');
        setCreatingShelf(false);
        return;
      }

      setNewShelfId(json.data.id);
      setNewShelfName(shelfName);

      setShelfName('');
      setShelfDescription('');
      setShowCreateForm(false);
      setCreatingShelf(false);

      const dashRes = await fetch('/api/shelf/dashboard');
      const dashJson = await dashRes.json();
      if (dashJson.success) {
        setData(dashJson.data);
      }

      setShowAddItemModal(true);
    } catch {
      setError('Something went wrong. Please try again.');
      setCreatingShelf(false);
    }
  };

  if (loading) {
    return (
      <div className="brand-shell min-h-screen">
        <div id="main-content" className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-10">
            <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
              <div>
                <div className="h-6 w-28 bg-[var(--db-ink)]/10 rounded-full animate-pulse mb-3"></div>
                <div className="h-14 w-72 bg-[var(--db-ink)]/10 rounded animate-pulse mb-2"></div>
                <div className="h-5 w-56 bg-[var(--db-ink)]/10 rounded animate-pulse"></div>
              </div>
              <div className="h-12 w-40 bg-[var(--db-ink)]/10 rounded-full animate-pulse"></div>
            </div>
          </div>
          <SkeletonShelfGrid count={6} />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="brand-shell min-h-screen flex items-center justify-center">
        <div className="text-[var(--db-ink)]/70">Failed to load dashboard</div>
      </div>
    );
  }

  return (
    <div className="brand-shell min-h-screen">
      <div id="main-content" className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Section Header — plane-anchored, oversized display type */}
        <div className="mb-10" data-reveal="soft">
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div>
              <span className="tab-anchor">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--db-lime)]"
                />
                Workspace — {data.username || data.email.split('@')[0]}
              </span>
              <h1
                className={`${spaceGrotesk.className} mt-4 text-[var(--db-ink)] font-bold tracking-[-0.035em] leading-[0.9]`}
                style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4rem)' }}
              >
                My Shelves.
              </h1>
              <p className="mt-3 text-[var(--db-ink)]/70 text-base font-medium max-w-md">
                {data.shelves.length === 0
                  ? "No shelves yet. Make your first one — it takes under a minute."
                  : `${data.shelves.length} shelf${data.shelves.length !== 1 ? 'es' : ''} curated. Keep going.`}
              </p>
            </div>
            {!showCreateForm && data.shelves.length > 0 && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="brand-button brand-button-blue px-6 py-3"
              >
                + New Shelf
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-[var(--db-crimson-soft)] border border-[var(--db-crimson)]/30 text-[var(--db-crimson)] px-4 py-3 text-sm font-medium">
            {error}
          </div>
        )}

        {showCreateForm && (
          <div className="mb-10 plane plane-paper p-7" data-reveal="zoom">
            <h2 className={`${spaceGrotesk.className} text-2xl font-bold text-[var(--db-ink)] mb-6 tracking-[-0.02em]`}>
              New shelf. What&apos;s on it?
            </h2>
            <form onSubmit={handleCreateShelf} className="space-y-4">
              <div>
                <label htmlFor="shelfName" className="block text-xs uppercase tracking-[0.14em] font-bold text-[var(--db-ink)]/70 mb-2">
                  Name
                </label>
                <input
                  id="shelfName"
                  type="text"
                  value={shelfName}
                  onChange={(e) => setShelfName(e.target.value)}
                  className="brand-input w-full px-4 py-3 text-[var(--db-ink)] text-base"
                  placeholder="e.g., Books that changed my year"
                  required
                  maxLength={100}
                  disabled={creatingShelf}
                />
              </div>

              <div>
                <label htmlFor="shelfDescription" className="block text-xs uppercase tracking-[0.14em] font-bold text-[var(--db-ink)]/70 mb-2">
                  Description (optional)
                </label>
                <textarea
                  id="shelfDescription"
                  value={shelfDescription}
                  onChange={(e) => setShelfDescription(e.target.value)}
                  className="brand-input w-full px-4 py-3 resize-none text-[var(--db-ink)]"
                  placeholder="A short note for anyone who visits…"
                  rows={3}
                  maxLength={1000}
                  disabled={creatingShelf}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={creatingShelf || !shelfName.trim()}
                  className="brand-button brand-button-blue px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingShelf ? (
                    <>
                      <svg className="animate-spin mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating…
                    </>
                  ) : (
                    'Create shelf'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setShelfName('');
                    setShelfDescription('');
                  }}
                  className="px-6 py-3 rounded-full border border-[var(--db-ink)]/15 text-[var(--db-ink)] hover:bg-[var(--db-ink)]/5 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {data.shelves.length === 0 ? (
          <EmptyState
            icon={<BookshelfIcon />}
            heading="Start your first shelf."
            subheading="A shelf is a small, sharable set of books, podcasts, or albums. Pick a theme and go."
            ctaText={showCreateForm ? undefined : 'Create Shelf'}
            onCTA={showCreateForm ? undefined : () => setShowCreateForm(true)}
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.shelves.map((shelf, idx) => {
              const accent = SHELF_ACCENTS[idx % SHELF_ACCENTS.length];
              return (
                <Link
                  key={shelf.id}
                  href={`/shelf/${shelf.id}`}
                  className="plane plane-paper plane-lift block group overflow-hidden"
                  data-reveal="soft"
                  data-stagger={String((idx % 4) + 1)}
                >
                  {/* Accent bar — the shelf's color "tab" */}
                  <div
                    className="h-2 w-full"
                    style={{ background: accent.bar }}
                    aria-hidden="true"
                  />
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.14em]"
                        style={{ background: accent.tab, color: accent.text }}
                      >
                        Shelf
                      </span>
                      <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--db-ink)]/50">
                        {shelf.is_public ? 'Public' : 'Private'}
                      </span>
                    </div>
                    <h3 className={`${spaceGrotesk.className} text-xl font-bold text-[var(--db-ink)] mb-2 tracking-[-0.02em] group-hover:text-[var(--db-blue)] transition-colors leading-tight`}>
                      {shelf.name}
                    </h3>
                    {shelf.description && (
                      <p className="text-sm text-[var(--db-ink)]/70 mb-4 line-clamp-2 leading-snug">
                        {shelf.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm pt-4 mt-3 border-t border-[var(--db-ink)]/8">
                      <span className="font-semibold text-[var(--db-ink)]/70">
                        {shelf.item_count} item{shelf.item_count !== 1 ? 's' : ''}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[var(--db-ink)]/55 text-xs font-semibold group-hover:text-[var(--db-blue)] transition-colors">
                        Open
                        <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <AddItemModal
        isOpen={showAddItemModal}
        onClose={() => {
          setShowAddItemModal(false);
          setNewShelfId('');
          setNewShelfName('');
        }}
        shelfId={newShelfId}
        shelfName={newShelfName}
        onItemAdded={async () => {
          try {
            const res = await fetch('/api/shelf/dashboard');
            const json = await res.json();
            if (json.success) {
              setData(json.data);
            }
          } catch (error) {
            console.error('Failed to refresh dashboard:', error);
          }
        }}
      />
    </div>
  );
}
