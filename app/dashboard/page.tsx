'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShelfType } from '@/lib/types/shelf';

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

      // Clear form and refresh dashboard
      setShelfName('');
      setShelfDescription('');
      setShelfType('standard');
      setShowCreateForm(false);

      // Redirect to new shelf
      router.push(`/shelf/${json.data.id}`);
    } catch {
      setError('Something went wrong. Please try again.');
      setCreatingShelf(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Failed to load dashboard</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Section Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Shelves</h1>
              <p className="text-gray-600 mt-2">
                {data.shelves.length === 0
                  ? "You don't have any shelves yet. Create one to get started!"
                  : `You have ${data.shelves.length} shelf${data.shelves.length !== 1 ? 'es' : ''}`}
              </p>
            </div>
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                + Create Shelf
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Create Shelf Form */}
        {showCreateForm && (
          <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Create New Shelf</h2>
            <form onSubmit={handleCreateShelf} className="space-y-4">
              {/* Shelf Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Shelf Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setShelfType('standard')}
                    disabled={creatingShelf}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      shelfType === 'standard'
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } disabled:opacity-50`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span className="font-semibold text-gray-900">Standard Shelf</span>
                    </div>
                    <p className="text-sm text-gray-500">Unlimited items in a flexible layout</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShelfType('top5')}
                    disabled={creatingShelf}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      shelfType === 'top5'
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-200 hover:border-amber-200'
                    } disabled:opacity-50`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <svg className="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
                      </svg>
                      <span className="font-semibold text-gray-900">Top 5 Shelf</span>
                    </div>
                    <p className="text-sm text-gray-500">Highlight your top 5 favorites in ranked order</p>
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="shelfName" className="block text-sm font-medium text-gray-700 mb-2">
                  Shelf Name *
                </label>
                <input
                  id="shelfName"
                  type="text"
                  value={shelfName}
                  onChange={(e) => setShelfName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder={shelfType === 'top5' ? 'e.g., My Top 5 Books' : 'e.g., My Reading List'}
                  required
                  maxLength={100}
                  disabled={creatingShelf}
                />
              </div>

              <div>
                <label htmlFor="shelfDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  id="shelfDescription"
                  value={shelfDescription}
                  onChange={(e) => setShelfDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
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
                  className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingShelf ? 'Creating...' : 'Create Shelf'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setShelfName('');
                    setShelfDescription('');
                    setShelfType('standard');
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Shelves Grid */}
        {data.shelves.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No shelves yet</h3>
            <p className="text-gray-600 mb-6">Create your first shelf to get started</p>
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                Create Shelf
              </button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.shelves.map((shelf) => (
              <Link
                key={shelf.id}
                href={`/shelf/${shelf.id}`}
                className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 block group ${
                  shelf.shelf_type === 'top5' ? 'border-2 border-amber-200' : ''
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {shelf.shelf_type === 'top5' && (
                    <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
                    </svg>
                  )}
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-700">
                    {shelf.name}
                  </h3>
                </div>
                {shelf.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {shelf.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
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
    </div>
  );
}
