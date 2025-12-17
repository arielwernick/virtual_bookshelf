'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShelfType } from '@/lib/types/shelf';
import { EmptyState, BookshelfIcon } from '@/components/ui/EmptyState';
import { SkeletonShelfGrid } from '@/components/ui/SkeletonLoader';
import { AddItemModal } from '@/components/shelf/AddItemModal';

interface Shelf {
  id: string;
  name: string;
  description: string | null;
  share_token: string;
  is_public: boolean;
  shelf_type: ShelfType;
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

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creatingShelf, setCreatingShelf] = useState(false);
  const [shelfName, setShelfName] = useState('');
  const [shelfDescription, setShelfDescription] = useState('');
  const [shelfType, setShelfType] = useState<ShelfType>('standard');
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
          // Not authenticated, redirect to login
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
          shelf_type: shelfType,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error || 'Failed to create shelf');
        setCreatingShelf(false);
        return;
      }

      // Store new shelf info for modal
      setNewShelfId(json.data.id);
      setNewShelfName(shelfName);
      
      // Clear form
      setShelfName('');
      setShelfDescription('');
      setShelfType('standard');
      setShowCreateForm(false);
      setCreatingShelf(false);
      
      // Refresh dashboard data to include new shelf
      const dashRes = await fetch('/api/shelf/dashboard');
      const dashJson = await dashRes.json();
      if (dashJson.success) {
        setData(dashJson.data);
      }
      
      // Show add item modal
      setShowAddItemModal(true);
    } catch {
      setError('Something went wrong. Please try again.');
      setCreatingShelf(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="h-9 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                <div className="h-5 w-56 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
              <div className="h-12 w-36 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            </div>
          </div>
          {/* Shelf Cards Skeleton */}
          <SkeletonShelfGrid count={6} />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Failed to load dashboard</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Section Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Shelves</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {data.shelves.length === 0
                  ? "You don't have any shelves yet. Create one to get started!"
                  : `You have ${data.shelves.length} shelf${data.shelves.length !== 1 ? 'es' : ''}`}
              </p>
            </div>
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors font-medium"
              >
                + Create Shelf
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Create Shelf Form */}
        {showCreateForm && (
          <div className="mb-8 bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Create New Shelf</h2>
            <form onSubmit={handleCreateShelf} className="space-y-4">
              {/* Shelf Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Shelf Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setShelfType('standard')}
                    disabled={creatingShelf}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      shelfType === 'standard'
                        ? 'border-gray-900 dark:border-gray-100 bg-gray-50 dark:bg-gray-800'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    } disabled:opacity-50`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">Standard Shelf</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Unlimited items in a flexible layout</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShelfType('top5')}
                    disabled={creatingShelf}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      shelfType === 'top5'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-amber-200 dark:hover:border-amber-700'
                    } disabled:opacity-50`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <svg className="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
                      </svg>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">Top 5 Shelf</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Highlight your top 5 favorites in ranked order</p>
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="shelfName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Shelf Name *
                </label>
                <input
                  id="shelfName"
                  type="text"
                  value={shelfName}
                  onChange={(e) => setShelfName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder={shelfType === 'top5' ? 'e.g., My Top 5 Books' : 'e.g., My Reading List'}
                  required
                  maxLength={100}
                  disabled={creatingShelf}
                />
              </div>

              <div>
                <label htmlFor="shelfDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  id="shelfDescription"
                  value={shelfDescription}
                  onChange={(e) => setShelfDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="A brief description of this shelf..."
                  rows={3}
                  maxLength={1000}
                  disabled={creatingShelf}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={creatingShelf || !shelfName.trim()}
                  className="px-6 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                >
                  {creatingShelf ? (
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white dark:text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </div>
                  ) : (
                    'Create Shelf'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setShelfName('');
                    setShelfDescription('');
                    setShelfType('standard');
                  }}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Shelves Grid */}
        {data.shelves.length === 0 ? (
          <EmptyState
            icon={<BookshelfIcon />}
            heading="Create your first shelf"
            subheading="Share your favorite books, podcasts, and music with the world"
            ctaText={showCreateForm ? undefined : "Create Shelf"}
            onCTA={showCreateForm ? undefined : () => setShowCreateForm(true)}
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.shelves.map((shelf) => (
              <Link
                key={shelf.id}
                href={`/shelf/${shelf.id}`}
                className={`bg-white dark:bg-gray-900 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 block group ${
                  shelf.shelf_type === 'top5' ? 'border-2 border-amber-200 dark:border-amber-700' : ''
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {shelf.shelf_type === 'top5' && (
                    <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
                    </svg>
                  )}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-gray-700 dark:group-hover:text-gray-300">
                    {shelf.name}
                  </h3>
                </div>
                {shelf.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {shelf.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <span>
                    {shelf.shelf_type === 'top5' 
                      ? `${shelf.item_count}/5 ranked`
                      : `${shelf.item_count} item${shelf.item_count !== 1 ? 's' : ''}`
                    }
                  </span>
                  <span className="text-xs">
                    {shelf.is_public ? '🌍 Public' : '🔒 Private'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Add Item Modal */}
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
          // Refresh dashboard data to show updated item counts
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
