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
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--background-secondary)' }}>
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold" style={{ color: 'var(--gray-900)', letterSpacing: '-0.02em' }}>
            Virtual Bookshelf
          </Link>
          <p className="mt-3 text-lg" style={{ color: 'var(--gray-600)' }}>Create your bookshelf</p>
        </div>

        <div className="bg-white rounded-xl p-8" style={{ border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--error-bg)', border: '1px solid var(--error-border)', color: 'var(--error-text)' }}>
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-semibold mb-2" style={{ color: 'var(--gray-900)' }}>
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-lg transition-all"
                style={{ 
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--gray-900)'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary-orange)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px var(--primary-orange-50)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                placeholder="yourname"
                required
                minLength={3}
                maxLength={50}
                pattern="[a-zA-Z0-9_-]+"
                title="Only letters, numbers, hyphens, and underscores"
              />
              <p className="mt-2 text-xs" style={{ color: 'var(--gray-500)' }}>
                Your shelf will be at: bookshelf.app/shelf/{username || 'yourname'}
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-2" style={{ color: 'var(--gray-900)' }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg transition-all"
                style={{ 
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--gray-900)'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary-orange)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px var(--primary-orange-50)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                placeholder="Choose a password"
                required
                minLength={6}
              />
              <p className="mt-2 text-xs" style={{ color: 'var(--gray-500)' }}>
                You'll need this to edit your shelf
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: loading ? 'var(--gray-400)' : 'var(--primary-orange)',
                color: 'white'
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = 'var(--primary-orange-dark)';
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = 'var(--primary-orange)';
              }}
            >
              {loading ? 'Creating...' : 'Create My Shelf'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm" style={{ color: 'var(--gray-600)' }}>
          Already have a shelf?{' '}
          <button
            onClick={() => {
              const username = prompt('Enter your username:');
              if (username) router.push(`/shelf/${username}/edit`);
            }}
            className="font-semibold hover:underline"
            style={{ color: 'var(--primary-orange)' }}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
