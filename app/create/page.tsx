'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreatePage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/shelf/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to create shelf');
        setLoading(false);
        return;
      }

      // Log in the user
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (loginRes.ok) {
        // Redirect to edit page
        router.push(`/shelf/${username}/edit`);
      } else {
        // Created but login failed, redirect to shelf
        router.push(`/shelf/${username}`);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-gray-900" style={{ fontWeight: 700 }}>
            Virtual Bookshelf
          </Link>
          <p className="mt-2 text-gray-600" style={{ fontWeight: 500 }}>Create your bookshelf</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2" style={{ fontWeight: 500 }}>
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="yourname"
                required
                minLength={3}
                maxLength={50}
                pattern="[a-zA-Z0-9_-]+"
                title="Only letters, numbers, hyphens, and underscores"
              />
              <p className="mt-1 text-xs text-gray-500">
                Your shelf will be at: bookshelf.app/shelf/{username || 'yourname'}
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2" style={{ fontWeight: 500 }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="Choose a password"
                required
                minLength={6}
              />
              <p className="mt-1 text-xs text-gray-500">
                You'll need this to edit your shelf
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-700 shadow-sm hover:shadow transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create My Shelf'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have a shelf?{' '}
          <button
            onClick={() => {
              const username = prompt('Enter your username:');
              if (username) router.push(`/shelf/${username}/edit`);
            }}
            className="text-gray-900 font-semibold hover:underline transition-all duration-300"
            style={{ fontWeight: 600 }}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
