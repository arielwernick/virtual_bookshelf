'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creatingShelf, setCreatingShelf] = useState(false);
  const [shelfName, setShelfName] = useState('');
  const [shelfDescription, setShelfDescription] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/shelf/dashboard');
        const json = await res.json();

        if (!json.success) {
          // Not authenticated, redirect to login
          router.push('/login');
          return;
        }

        setData(json.data);
      } catch (err) {
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

      // Clear form and refresh dashboard
      setShelfName('');
      setShelfDescription('');
      setShowCreateForm(false);

      // Redirect to new shelf
      router.push(`/shelf/${json.data.id}`);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setCreatingShelf(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
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
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-2xl font-bold text-gray-900">
                Virtual Bookshelf
              </Link>
              <p className="text-sm text-gray-600 mt-1">{data.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
                  placeholder="e.g., My Reading List"
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
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 block group"
              >
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-700 mb-2">
                  {shelf.name}
                </h3>
                {shelf.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {shelf.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
                  <span>{shelf.item_count} item{shelf.item_count !== 1 ? 's' : ''}</span>
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
